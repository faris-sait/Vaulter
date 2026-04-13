import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

CREATE OR REPLACE FUNCTION rate_limit_hit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms BIGINT
) RETURNS TABLE (
  is_allowed BOOLEAN,
  hit_count INTEGER,
  window_reset_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_interval INTERVAL := (p_window_ms::TEXT || ' milliseconds')::INTERVAL;
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_now + v_interval)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE WHEN rl.reset_at <= v_now THEN 1 ELSE rl.count + 1 END,
    reset_at = CASE WHEN rl.reset_at <= v_now THEN v_now + v_interval ELSE rl.reset_at END
  RETURNING rl.count, rl.reset_at INTO v_count, v_reset_at;

  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE reset_at < v_now - INTERVAL '1 hour';
  END IF;

  is_allowed := v_count <= p_limit;
  hit_count := v_count;
  window_reset_at := v_reset_at;
  RETURN NEXT;
END;
$$;
`;

async function createRateLimitsTable() {
  console.log('Checking for rate_limits table...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?select=key&limit=1`, {
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
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    console.log('(Dashboard > SQL Editor > New Query)');
    console.log('\n' + '='.repeat(60));
    console.log(SQL);
    console.log('='.repeat(60));
  } else if (response.status === 200) {
    console.log('Table rate_limits already exists and is accessible.');
    console.log('\nIf you need to (re)create the rate_limit_hit function, run this SQL:');
    console.log('\n' + '='.repeat(60));
    console.log(SQL);
    console.log('='.repeat(60));
  }
}

createRateLimitsTable().catch(console.error);
