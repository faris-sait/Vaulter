import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTable() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/cli_auth_requests?select=request_id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Response status:', response.status);
  const text = await response.text();
  console.log('Response:', text);
  return response.status;
}

async function main() {
  console.log('Checking for cli_auth_requests table...');

  const status = await checkTable();

  if (status === 404 || status === 400) {
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    console.log('(Dashboard > SQL Editor > New Query)');
    console.log('\n' + '='.repeat(60));
    console.log(`
CREATE TABLE IF NOT EXISTS cli_auth_requests (
  request_id TEXT PRIMARY KEY,
  state      TEXT NOT NULL,
  token      TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cli_auth_requests_status
  ON cli_auth_requests(status);
    `);
    console.log('='.repeat(60));
    console.log('\nAfter running the SQL, re-run this script to verify.');
  } else if (status === 200) {
    console.log('Table cli_auth_requests already exists and is accessible!');
  } else {
    console.log('Unexpected status. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  }
}

main().catch(console.error);
