// Setup script to create Supabase table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTable() {
  console.log('Creating api_keys table in Supabase...');

  // Create table using SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
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
    `
  });

  if (error) {
    console.error('Error details:', error);
    console.log('\n⚠️  If the RPC method does not exist, please run this SQL manually in Supabase:');
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
    
    // Try alternative approach - direct table creation
    console.log('\nTrying alternative approach...');
    const { error: createError } = await supabase
      .from('api_keys')
      .select('id')
      .limit(1);
    
    if (createError && createError.code === 'PGRST204') {
      console.log('✅ Table might already exist or needs manual creation.');
    }
  } else {
    console.log('✅ Table created successfully!');
  }

  // Test connection
  const { data: testData, error: testError } = await supabase
    .from('api_keys')
    .select('count')
    .limit(1);

  if (testError) {
    console.error('❌ Table test failed:', testError.message);
    console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
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
  } else {
    console.log('✅ Table is accessible!');
  }
}

setupTable().then(() => {
  console.log('\nSetup complete!');
  process.exit(0);
}).catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
