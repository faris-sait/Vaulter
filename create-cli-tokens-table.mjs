import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createCliTokensTable() {
  console.log('Checking for cli_tokens table...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/cli_tokens?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await response.text();
  console.log('Response status:', response.status);
  console.log('Response:', text);

  if (response.status === 404 || response.status === 400) {
    console.log('\n Please run this SQL in your Supabase SQL Editor:');
    console.log('(Dashboard > SQL Editor > New Query)');
    console.log('\n' + '='.repeat(60));
    console.log(`
CREATE TABLE IF NOT EXISTS cli_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT 'Vaulter CLI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cli_tokens_hash ON cli_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_cli_tokens_user_id ON cli_tokens(user_id);
    `);
    console.log('='.repeat(60));
  } else if (response.status === 200) {
    console.log('Table cli_tokens already exists and is accessible!');
  }
}

createCliTokensTable().catch(console.error);
