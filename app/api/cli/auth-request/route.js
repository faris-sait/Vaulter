import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { request_id, state } = await request.json();

    if (!request_id || !state) {
      return NextResponse.json({ error: 'Missing request_id or state' }, { status: 400 });
    }

    if (!/^[0-9a-f]{32}$/.test(request_id) || !/^[0-9a-f]{32}$/.test(state)) {
      return NextResponse.json({ error: 'Invalid request_id or state format' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('cli_auth_requests')
      .insert({
        request_id,
        state,
        status: 'pending',
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Error creating auth request:', error);
      return NextResponse.json({ error: 'Failed to create auth request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Auth request error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
