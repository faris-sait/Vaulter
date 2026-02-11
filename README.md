# vaulter-cli

> Your keys. Your vault. Secure API key management from the terminal and the web.

[![npm version](https://img.shields.io/npm/v/vaulter-cli)](https://www.npmjs.com/package/vaulter-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-brightgreen)]()

Vaulter is a secure API key manager with a CLI and a web dashboard. Store, encrypt, and sync your secrets across machines — no plaintext, ever.

---

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
  - [vaulter init](#vaulter-init)
  - [vaulter sign-in](#vaulter-sign-in)
  - [vaulter sign-out](#vaulter-sign-out)
  - [vaulter ls](#vaulter-ls)
  - [vaulter add](#vaulter-add-name)
  - [vaulter remove](#vaulter-remove-name-or-id)
  - [vaulter make](#vaulter-make-filename)
  - [vaulter save](#vaulter-save-filename)
  - [vaulter web-app](#vaulter-web-app)
- [Web App](#web-app)
  - [Dashboard](#dashboard)
  - [Key Management](#key-management)
  - [.env Upload](#env-upload)
  - [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Self-Hosting](#self-hosting)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Install

```bash
npm install -g vaulter-cli
```

After install you'll see:

```
  ╦  ╦╔═╗╦ ╦╦ ╔╦╗╔═╗╦═╗
  ╚╗╔╝╠═╣║ ║║  ║ ║╣ ╠╦╝
   ╚╝ ╩ ╩╚═╝╩═╝╩ ╚═╝╩╚═
   Your keys. Your vault.
```

Requires **Node.js 18+**.

---

## Quick Start

```bash
# 1. Initialize your project
vaulter init

# 2. Authenticate (opens browser)
vaulter sign-in

# 3. Add a key
vaulter add STRIPE_SECRET_KEY

# 4. List your keys
vaulter ls

# 5. Generate a .env file from your vault
vaulter make

# 6. Or upload an existing .env to your vault
vaulter save .env.local
```

---

## CLI Commands

### `vaulter init`

Initialize the current directory as a Vaulter project.

Creates a `.vaulter/config.json` with project metadata. If a `.gitignore` exists, `.vaulter/` is automatically added to it. No authentication required.

```bash
vaulter init
# ? Project name: my-app
# ✔ Initialized Vaulter project "my-app"
# ✔ Added .vaulter/ to .gitignore

# Non-interactive with a custom name
vaulter init --yes --name my-app
```

**Options:**

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Project name (skips prompt) |
| `-y, --yes` | Non-interactive, use all defaults |

### `vaulter sign-in`

Authenticate with Vaulter via your browser.

Opens a browser window where you sign in with **Google**, **GitHub**, or **Email**. The CLI starts a temporary local server, receives the auth token via callback, and stores it securely at `~/.vaulter/credentials.json` with `0600` permissions.

```bash
vaulter sign-in
# ● Opening browser for authentication...
# ✔ Authenticated successfully!
```

Times out after 120 seconds if no login is completed.

### `vaulter sign-out`

Sign out and clear saved credentials.

```bash
vaulter sign-out
# ✔ Signed out successfully
```

### `vaulter ls`

List all API keys in your vault.

Displays a formatted table with key name, masked value, tags, and usage count.

```bash
vaulter ls
# ┌──────────────────┬────────────────┬────────────┬───────┐
# │ Name             │ Key            │ Tags       │ Used  │
# ├──────────────────┼────────────────┼────────────┼───────┤
# │ STRIPE_SECRET    │ sk_l...3xf4    │ payments   │ 12    │
# │ OPENAI_KEY       │ sk-p...a91b    │ ai         │ 5     │
# └──────────────────┴────────────────┴────────────┴───────┘
```

### `vaulter add <name>`

Add a new API key to your vault.

Prompts for the key value securely (hidden input). The key is encrypted with AES-256-GCM before being stored.

```bash
vaulter add OPENAI_API_KEY
# ? Enter API key: ••••••••••••••••
# ✔ Key "OPENAI_API_KEY" added to vault
```

### `vaulter remove <name-or-id>`

Remove an API key from your vault by name or ID.

```bash
vaulter remove OPENAI_API_KEY
# ✔ Key "OPENAI_API_KEY" removed from vault
```

### `vaulter make [filename]`

Generate a `.env` file from your vault keys.

Interactive checkbox lets you pick which keys to include. Key names are converted to `UPPER_SNAKE_CASE`. Output file has `0600` permissions.

```bash
vaulter make
# ? Select keys to include in .env:
#   ◉ STRIPE_SECRET
#   ◉ OPENAI_KEY
#   ◯ DATABASE_URL
# ✔ Written to .env (2 keys)

# Custom filename and output directory
vaulter make .env.production -o ./config
```

**Options:**

| Flag | Description |
|------|-------------|
| `-o, --output <dir>` | Output directory for the generated file |

### `vaulter save [filename]`

Upload a local `.env` file to your vault.

Parses the file and uploads each key-value pair. Detects duplicates with existing vault keys and prompts for conflict resolution (skip or overwrite) per key.

```bash
vaulter save .env.local
# Found 5 keys in .env.local
# ⚠ "STRIPE_SECRET" already exists in vault
# ? How to handle? (skip / overwrite)
# ✔ Uploaded 5 keys to vault
```

Handles comments, quoted values, empty lines, and multiline values.

### `vaulter web-app`

Open the Vaulter web dashboard in your default browser.

```bash
vaulter web-app
# ● Opening https://vaulter-nine.vercel.app ...
```

---

## Web App

The Vaulter web app is a full-featured dashboard for managing your encrypted keys. Access it at **[vaulter-nine.vercel.app](https://vaulter-nine.vercel.app)** or self-host it.

### Dashboard

The dashboard gives you an overview of your vault:

- **Total keys** stored
- **Recently used** keys (last 7 days)
- **Unique tags** across all keys
- **Search and filter** by key name or tag

### Key Management

- **Add keys** — Enter a name, the API key value, and optional tags
- **Masked display** — Keys show as `sk_l...3xf4` by default
- **Reveal / Hide** — Click to reveal the full decrypted key (tracks usage)
- **Copy to clipboard** — One-click copy
- **Delete** — Remove keys with a confirmation dialog
- **Usage tracking** — Every reveal or copy increments the usage counter

### .env Upload

Upload `.env` files directly from the web dashboard:

1. **Drag & drop** or use the file picker (max 1MB)
2. Vaulter parses the file client-side
3. **Duplicate detection** — flags keys that already exist in your vault
4. **Per-key conflict resolution** — choose to skip or overwrite each duplicate
5. Bulk import to your vault

### Authentication

The web app uses [Clerk](https://clerk.com) for authentication. Sign in with:

- **Email** (magic link / password)
- **Google**
- **GitHub**

Every API request is verified with a Clerk JWT session token. CLI requests use bearer tokens stored as SHA-256 hashes in the database.

---

## API Endpoints

All endpoints require authentication (Clerk session or CLI bearer token).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/keys` | List all keys (masked) |
| `GET` | `/api/keys/:id` | Get a specific key (masked) |
| `GET` | `/api/keys/:id?decrypt=true` | Get decrypted key value |
| `POST` | `/api/keys` | Create a new encrypted key |
| `POST` | `/api/keys/bulk` | Bulk import keys |
| `DELETE` | `/api/keys/:id` | Delete a key |
| `POST` | `/api/usage/:id` | Log a usage event |
| `POST` | `/api/cli/create-token` | Create a CLI auth token |

---

## Security

- **AES-256-GCM** — Authenticated encryption for every key. Each key gets a unique random IV.
- **Zero plaintext storage** — Keys are encrypted before hitting the database. Stored format: `iv:authTag:ciphertext`.
- **Credential file permissions** — CLI credentials saved with `0600` (owner read/write only).
- **CSRF protection** — Device auth flow uses a cryptographic state token to prevent cross-site request forgery.
- **Token hashing** — CLI tokens are stored as SHA-256 hashes. The raw token only exists on your machine.
- **Clerk JWT verification** — Every web request is authenticated and verified server-side.

---

## Self-Hosting

Clone the repo and set up your environment:

```bash
git clone https://github.com/faris-sait/Vaulter.git
cd Vaulter
npm install
```

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Encryption (64-char hex string)
ENCRYPTION_KEY=your_64_char_hex_encryption_key
```

Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

To point the CLI at your self-hosted instance:

```bash
export VAULTER_API_URL=http://localhost:3000
vaulter sign-in
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **CLI** | Node.js, Commander, Inquirer, Chalk, Ora |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Clerk (Google, GitHub, Email) |
| **Encryption** | AES-256-GCM (Node.js crypto) |
| **Deployment** | Vercel |

---

## License

[MIT](LICENSE) - [faris-sait](https://github.com/faris-sait)
