import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AppTools } from "./tools/tools.js";

const mcpDescription = `
You are managing a sandboxed React application environment. Use the available tools to create, read, write, patch, and build React apps on behalf of the user.

Guidelines:
- Use file read/write tools to scaffold and modify React components, pages, and config files
- Use the build tool to compile and verify the app is error-free after changes
- Follow React best practices: functional components, hooks, TypeScript where applicable
- Keep components small and composable
- When creating a new app, start with a minimal working structure before adding features
- Always read a file before patching it to understand the current content
`;
export function createMcpServer() {
  const server = new McpServer({
    name: "easy-apps",
    version: "1.0.0",
    description: mcpDescription,
  });

  for (const tool of AppTools) {
    server.registerTool(tool.name, tool, tool.execute as any);
  }

  return server;
}
