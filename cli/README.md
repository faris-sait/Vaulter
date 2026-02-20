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

# View decrypted values in your terminal
vaulter view STRIPE_SECRET
vaulter view KEY1 KEY2

# Generate a .env file from your vault
vaulter make .env

# Upload a local .env file to your vault
vaulter save .env

# Initialize current directory as a Vaulter project
vaulter init
```

## Commands

| Command | Description |
| --- | --- |
| `vaulter sign-in` | Authenticate with Vaulter via browser |
| `vaulter sign-out` | Sign out and clear saved credentials |
| `vaulter ls` | List all API keys in your vault |
| `vaulter add <name>` | Add a new API key to your vault |
| `vaulter remove <name-or-id>` | Remove an API key from your vault |
| `vaulter view [key_names...]` | Decrypt and display one or more API keys in your terminal |
| `vaulter make [file]` | Generate a .env file from your vault keys |
| `vaulter save [file]` | Upload a local .env file to your vault |
| `vaulter init` | Initialize current directory as a Vaulter project |
| `vaulter web-app` | Open the Vaulter web app in your browser |
| `vaulter help` | Show all available commands |

## Viewing Keys

### `vaulter view [key_names...]`

Decrypt and print key values directly to your terminal — without writing them to a file.

```bash
# Interactive: select which keys to view via checkbox
vaulter view

# View a specific key by name
vaulter view STRIPE_SECRET

# View multiple keys at once
vaulter view STRIPE_SECRET OPENAI_API_KEY
```

Key names are matched case-insensitively. If a name doesn't match any key in your vault, a warning is printed and the rest continue. A security reminder is shown below the output table — clear your terminal when done.

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

## Project Initialization

### `vaulter init`

Initialize the current directory as a Vaulter project. This creates a `.vaulter/config.json` file that associates the directory with a named project, and automatically adds `.vaulter/` to your `.gitignore` if one exists.

```bash
# Interactive setup (prompts for project name)
vaulter init

# Non-interactive, use directory name as project name
vaulter init --yes

# Specify a project name directly
vaulter init --name my-project
```

After initialization, if no `.env` is found and you're signed in, you'll be offered the option to generate one from your vault immediately.

## Authentication

Vaulter uses browser-based device auth. Running `vaulter sign-in` opens your browser where you log in, and the CLI receives a token automatically. Credentials are stored locally at `~/.vaulter/credentials.json` with restricted file permissions.

## License

MIT
