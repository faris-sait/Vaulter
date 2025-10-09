import fetch from 'node-fetch';

const SUPABASE_URL =process.env.SUPABASE_URL; 
const SUPABASE_KEY =  process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTable() {
  console.log('Testing Supabase connection...');
  
  // Test if table exists by trying to query it
  const response = await fetch(`${SUPABASE_URL}/rest/v1/api_keys?select=id&limit=1`, {
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
    console.log('\n❌ Table does not exist.');
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
    console.log('(Dashboard → SQL Editor → New Query)');
    console.log('\n' + '='.repeat(60));
    console.log(`
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
    `);
    console.log('='.repeat(60));
  } else if (response.status === 200) {
    console.log('✅ Table already exists and is accessible!');
  }
}

createTable().catch(console.error);
