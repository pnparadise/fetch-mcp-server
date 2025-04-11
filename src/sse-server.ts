import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

export function createSSEServer(mcpServer: McpServer) {
  const app = express();

  const transports: {[sessionId: string]: SSEServerTransport} = {};

  app.get("/sse", async (_, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
      delete transports[transport.sessionId];
    });

    // Start keep-alive ping
    const intervalId = setInterval(() => {
      if (transports[transport.sessionId] && !res.writableEnded) {
        res.write(': keepalive\n\n');
      } else {
        // Should not happen if close handler is working, but clear just in case
        clearInterval(intervalId);
      }
    }, 5000);

    await mcpServer.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });


  return app;
}
