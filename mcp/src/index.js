#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAddKeyTool } from './tools/add-key.js';
import { registerGetEnvMapTool } from './tools/get-env-map.js';
import { registerListKeysTool } from './tools/list-keys.js';
import { registerRemoveKeyTool } from './tools/remove-key.js';
import { registerViewKeysTool } from './tools/view-keys.js';

const server = new McpServer({
  name: 'vaulter',
  version: '0.1.0',
});

registerListKeysTool(server);
registerViewKeysTool(server);
registerAddKeyTool(server);
registerRemoveKeyTool(server);
registerGetEnvMapTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vaulter MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error starting Vaulter MCP server:', error);
  process.exit(1);
});
