# Vaulter MCP Server

Optional local stdio MCP server for Vaulter. The hosted remote MCP endpoint is now the primary integration path; this package remains useful for local development or clients that only support stdio.

Hosted remote endpoint:

```text
https://vaulter-nine.vercel.app/mcp
```

The hosted endpoint now supports browser-based MCP OAuth for compatible clients. Setup instructions live at `/mcp-access`, while the actual hosted MCP server endpoint is `/mcp`.

## Prerequisites

```bash
vaulter sign-in
```

The server reads the same local credential file used by the CLI: `~/.vaulter/credentials.json`.

## Install

```bash
cd mcp
npm install
```

## Run

```bash
npm start
```

## Tools

- `vaulter_list_keys` - list masked key metadata only
- `vaulter_view_keys` - decrypt one or more keys by exact name, with partial success handling
- `vaulter_add_key` - add a new key to the vault
- `vaulter_remove_key` - remove by exact name or UUID prefix, with ambiguity and confirmation handling
- `vaulter_get_env_map` - decrypt selected keys and return both JSON env output and dotenv text

## Claude Desktop Example

```json
{
  "mcpServers": {
    "vaulter": {
      "command": "node",
      "args": [
        "C:\\ABSOLUTE\\PATH\\TO\\Vaulter\\mcp\\src\\index.js"
      ],
      "env": {
        "VAULTER_API_URL": "https://vaulter-nine.vercel.app"
      }
    }
  }
}
```

## Notes

- The server uses stdio transport, so it only logs to stderr.
- Authentication failures and expired sessions reuse the same error messages as the CLI.
- `vaulter_view_keys` and `vaulter_get_env_map` only decrypt when explicitly asked.
- For the hosted remote MCP server, prefer MCP OAuth first. Use `Authorization: Bearer <token>` only for clients that still need manual config.
