# VAULTER - Your Secure API Key Manager

> **For Detailed Documentation:** Navigate to `Documentation.pdf` in the `SubmissionDetails` folder.

[![Security](https://img.shields.io/badge/Security-AES--256-brightgreen)]()

A personal, ultra-secure vault for managing API keys. VAULTER protects your sensitive credentials using military-grade AES-256 encryption, ensuring your API keys are never stored in plaintext.

## 🔐 Core Features

- **Military-Grade Encryption**: AES-256 encryption on the backend
- **Secure Authentication**: JWT-based login via Clerk (Google, GitHub, Email)
- **Intuitive Dashboard**: View key statistics, usage tracking, and filter by tags
- **Safe Key Management**: Masked display, one-click reveal/copy, usage tracking
- **Zero Plaintext Storage**: Keys encrypted before database storage

## 🏗️ Tech Stack

**Frontend:** React + Vite + TailwindCSS  
**Backend:** Next.js API routes (Deployed on Vercel)  
**Database:** Supabase with encrypted storage  
**Authentication:** Clerk with JWT verification  

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (.env.local)
# Configure: Supabase keys, Clerk keys

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📖 Main Workflow

1. **Login** using your email, GitHub, or Google account
2. **Add Keys** by clicking "+ Add Key" and entering name, key, and tags
3. **View & Manage** keys in masked format on your dashboard
4. **Copy/Reveal** keys when needed, track usage automatically
5. **Delete** keys anytime from the vault

## 🔧 API Endpoints

- `POST /api/keys/` - Create encrypted API key
- `GET /api/keys/` - List all keys (masked)
- `GET /api/keys/{id}` - Get decrypted key
- `DELETE /api/keys/{id}` - Delete key
- `POST /api/usage/{id}` - Log usage event

## 🔐 Security Promise

Your API key is encrypted with AES-256 on the backend before being stored in the database. Only you can decrypt and view your keys. Clerk JWT tokens verify every authenticated request.

---

**For complete technical details, database schema, and comprehensive documentation, please refer to `Documentation.pdf`.**
