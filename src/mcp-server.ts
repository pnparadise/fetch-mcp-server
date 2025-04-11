import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chromium } from 'playwright';
import TurndownService from 'turndown';
import type {LaunchOptions} from "playwright-core";

const mcpServer = new McpServer({
  name: "ExampleMCPServer",
  version: "1.0.0"
}, {
  capabilities: {},
});




mcpServer.tool(
  "fetchUrls",
  "Fetch multiple URLs and convert their content to markdown",
  {
    urls: z.array(z.string().url()).describe("Array of URLs to fetch")
  },
  async ({urls}): Promise<any> => {
    console.log('fetchUrls tool called with urls:', urls);
    const launchConfig: LaunchOptions = {
      headless: true,
      // 通过Chromium参数增强匿名性
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1920,1080",
        "--start-maximized",
        "--disable-extensions",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars"
      ]
    };

    if(process.env.PROXY) {
      launchConfig.proxy = {
        server: process.env.PROXY
      }
    }

    const browser = await chromium.launch(launchConfig);

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });


    try {
      const results = await Promise.all(
        urls.map(async (url) => {
          console.log(`Processing URL: ${url}`);
          try {
            const page = await context.newPage();
            // 拦截不必要的资源
            await page.route('**/*.{png,jpg,jpeg,svg,gif,webp}', route => route.abort());

            await page.goto(url, {waitUntil: 'domcontentloaded'});

            // 移除所有脚本和样式标签
            const content = await page.evaluate(() => {
              const elementsToRemove = document.querySelectorAll('script, style, link[rel="stylesheet"], meta, iframe, noscript');
              elementsToRemove.forEach(el => el.remove());

              // 移除所有元素的内联样式和事件处理器
              const allElements = document.getElementsByTagName('*');
              // @ts-ignore
              for (const element of allElements) {
                element.removeAttribute('style');
                element.removeAttribute('onclick');
                element.removeAttribute('onload');
                element.removeAttribute('onmouseover');
                element.removeAttribute('onmouseout');
                element.removeAttribute('onmouseenter');
                element.removeAttribute('onmouseleave');
              }

              // 只返回 body 内容
              return document.body.innerHTML;
            });

            const turndown = new TurndownService();
            const markdown = turndown.turndown(content);

            await page.close();
            console.log(`Successfully processed URL: ${url}`);

            return {
              type: 'text',
              text: markdown
            };
          } catch (error: any) {
            console.error(`Error processing URL ${url}:`, error);
            console.error('Stack trace:', error.stack);
            return {
              type: 'text',
              text: error.message
            };
          }
        })
      );

      return {
        content: results
      };
    } catch (error: any) {
      console.error('Fatal error in fetchUrls:', error);
      console.error('Stack trace:', error.stack);

      throw error;
    } finally {
      console.log('Closing browser');
      await browser.close();
    }
  }
);



mcpServer.tool(
    "search",
    "Search and retrieve content from web pages. Returns SERP results (url, title, description) .",
    {
      query: z.string().describe("Search query string")
    },
    async ({query}): Promise<any> => {
      console.log('search tool called with query:', query);

      const launchConfig: LaunchOptions = {
        headless: true,
        // 通过Chromium参数增强匿名性
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--window-size=1920,1080",
          "--start-maximized",
          "--disable-extensions",
          "--disable-gpu",
          "--ignore-certificate-errors",
          "--disable-blink-features=AutomationControlled",
          "--disable-infobars"
        ]
      };

      if(process.env.PROXY) {
        launchConfig.proxy = {
          server: process.env.PROXY
        }
      }

      const browser = await chromium.launch(launchConfig);

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
      });

      const page = await context.newPage();

      // 拦截不必要的资源
      await page.route('**/*.{png,jpg,jpeg,svg,gif,webp}', route => route.abort());

      try {
        await page.goto(`https://www.google.com/search?q=${query}`, {waitUntil: 'commit'});

        // 等待结果加载
        let resultElement = await page.waitForSelector('#search,#captcha-form',  {
          state: 'attached',
          timeout: 15000
        });

        let resultId = await resultElement.getAttribute("id")

        if(resultId === 'captcha-form') {
          throw new Error("触发验证码, 搜索失败")
        }

        const results = await resultElement.evaluate(() => {
          const results = [];

          // 查找所有包含 h3 的链接元素
          const linkElements = document.querySelectorAll('a[href]:has(h3)');

          linkElements.forEach(link => {
            const title = link.querySelector('h3')?.textContent?.trim();
            const url = link.getAttribute('href');

            // 找到最近的包含 data-ved 属性的容器
            const container = link.closest('div[data-ved]');

            let description = '';
            if (container) {
              // 查找所有文本容器
              const textElements = container.querySelectorAll('div, span');

              textElements.forEach(elem => {
                // 排除包含其他 div/span 的元素
                if (elem.querySelector('div, span')) return;
                // 排除包含 h3 的元素
                if (elem.querySelector('h3')) return;
                // 确保有文本内容
                const text = elem.textContent?.trim();
                if (text) {
                  description += text + ' ';
                }
              });
            }

            if (title && url) {
              results.push({
                title,
                url,
                description: description.trim()
              });
            }
          });

          return results;
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results)
          }]
        };
      } catch (error: any) {
        console.error('Fatal error in search:', error);
        console.error('Stack trace:', error.stack);

        throw error;
      } finally {
        console.log('Closing browser');
        await browser.close();
      }
    }
);

export { mcpServer };
