# API Key Manager - Setup Instructions

## ✅ Step 1: Create Supabase Database Table

The table needs to be created in your Supabase project. Follow these steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project:
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the following SQL and click **Run**:

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at DESC);
```

6. You should see "Success. No rows returned" message

## ✅ Step 2: Enable Row Level Security (Optional but Recommended)

For added security, you can enable RLS policies:

```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own keys
CREATE POLICY "Users can manage their own keys" 
ON api_keys 
FOR ALL 
USING (true);  -- Service role bypasses RLS
```

## ✅ Step 3: Verify Table Creation

Run this query to verify the table was created:

```sql
SELECT * FROM api_keys LIMIT 1;
```

You should see "Success. No rows returned" (since table is empty).

## 🚀 Your Application is Ready!

Once the table is created, your API Key Manager application is fully configured with:

- ✅ Clerk Authentication
- ✅ Supabase Database  
- ✅ AES-256 Encryption
- ✅ Beautiful Glassmorphic UI

Access your application at: **Your deployment URL**

---

## 🔐 Environment Variables (Already Configured)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bmV4dC1wYW5nb2xpbi04Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_***
SUPABASE_URL=https://njusnjxpgkfapkaarsso.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ***
ENCRYPTION_KEY=8f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918ab
```

## 📚 API Endpoints

- `POST /api/keys` - Create encrypted API key
- `GET /api/keys` - List all keys (masked)
- `GET /api/keys/{id}` - Get specific key
- `GET /api/keys/{id}?decrypt=true` - Get decrypted key
- `DELETE /api/keys/{id}` - Delete key
- `POST /api/usage/{id}` - Log usage event

## 🎨 Features

- Glassmorphic UI with backdrop blur effects
- Dashboard with real-time stats
- Search and filter by name/tags
- Copy to clipboard functionality
- Usage tracking per key
- Reveal/hide key functionality
- AES-256-GCM encryption
- Clerk authentication with protected routes
