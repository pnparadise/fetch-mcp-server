import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

const mcpServer = new McpServer({
  name: "ExampleMCPServer",
  version: "1.0.0"
}, {
  capabilities: {},
});

mcpServer.resource(
  'document',
  new ResourceTemplate("document://{name}", {
    list: async () => {
      return {
        resources: [
          {
            name: 'document-getting-started',
            uri: 'document://getting-started',
          }
        ]
      }
    }
  }),
  async (uri, variables) => {
    return {
      contents: [
        {
          uri: uri.href,
          text: 'Getting Started',
          mimeType: 'text/plain'
        }
      ]
    }
  }
);

export { mcpServer };
