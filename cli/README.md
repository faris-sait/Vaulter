# vaulter-cli

Command-line tool for [Vaulter](https://vaulter-nine.vercel.app) — a secure API key manager. Store, list, and manage your API keys from the terminal.

```
  ╦  ╦╔═╗╦ ╦╦ ╔╦╗╔═╗╦═╗
  ╚╗╔╝╠═╣║ ║║  ║ ║╣ ╠╦╝
   ╚╝ ╩ ╩╚═╝╩═╝╩ ╚═╝╩╚═
   Your keys. Your vault.
```

## Install

```bash
npm install -g vaulter-cli
```

## Quick Start

```bash
# Authenticate via browser
vaulter sign-in

# List your keys
vaulter ls

# Add a new key
vaulter add my-openai-key

# Remove a key
vaulter remove my-openai-key

# Generate a .env file from your vault
vaulter make .env

# Upload a local .env file to your vault
vaulter save .env
```

## Commands

| Command | Description |
| --- | --- |
| `vaulter sign-in` | Authenticate with Vaulter via browser |
| `vaulter sign-out` | Sign out and clear saved credentials |
| `vaulter ls` | List all API keys in your vault |
| `vaulter add <name>` | Add a new API key to your vault |
| `vaulter remove <name-or-id>` | Remove an API key from your vault |
| `vaulter make [file]` | Generate a .env file from your vault keys |
| `vaulter save [file]` | Upload a local .env file to your vault |
| `vaulter web-app` | Open the Vaulter web app in your browser |
| `vaulter help` | Show all available commands |

## .env Support

### `vaulter make [file]`

Generate a `.env` file from keys stored in your vault. You select which keys to include via an interactive checkbox. Key names are automatically converted to `UPPER_SNAKE_CASE` (e.g. "My Stripe Key" becomes `MY_STRIPE_KEY`). The output file is written with `0600` permissions.

```bash
# Write to .env in current directory
vaulter make

# Write to a specific file
vaulter make .env.local

# Write to a different directory
vaulter make .env -o ./config
```

### `vaulter save [file]`

Upload a local `.env` file to your vault. The file is **parsed entirely on your machine** — only the extracted key names and values are sent to the API. If any keys already exist in your vault, you'll be prompted to skip or overwrite each one individually.

```bash
# Upload .env from current directory
vaulter save

# Upload a specific file
vaulter save .env.production
```

## Authentication

Vaulter uses browser-based device auth. Running `vaulter sign-in` opens your browser where you log in, and the CLI receives a token automatically. Credentials are stored locally at `~/.vaulter/credentials.json` with restricted file permissions.

## License

MIT
