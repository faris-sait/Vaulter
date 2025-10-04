import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test user ID for testing purposes
const TEST_USER_ID = 'test-user-123';

// POST /api/test-usage/:id - Log usage event
async function POST(request, { params }) {
  try {
    const keyId = params.id;

    // Get current usage count
    const { data: currentKey } = await supabase
      .from('api_keys')
      .select('usage_count')
      .eq('id', keyId)
      .eq('user_id', TEST_USER_ID)
      .single();

    if (currentKey) {
      await supabase
        .from('api_keys')
        .update({
          last_used: new Date().toISOString(),
          usage_count: (currentKey.usage_count || 0) + 1
        })
        .eq('id', keyId)
        .eq('user_id', TEST_USER_ID);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('POST Usage Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { POST };