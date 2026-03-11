import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/server/supabase-admin.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('cli_auth_requests')
      .select('status, token_hash, expires_at')
      .eq('request_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('cli_auth_requests').delete().eq('request_id', id);
      return NextResponse.json({ status: 'expired' });
    }

    if (data.status === 'completed') {
      // Token was already consumed during the POST that approved it.
      // The CLI should have received it via the approval callback.
      await supabase.from('cli_auth_requests').delete().eq('request_id', id);
      return NextResponse.json({ status: 'completed', token_hash: data.token_hash });
    }

    return NextResponse.json({ status: data.status });
  } catch (err) {
    console.error('Auth request poll error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { token, state, action } = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('cli_auth_requests')
      .select('state, status, expires_at')
      .eq('request_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('cli_auth_requests').delete().eq('request_id', id);
      return NextResponse.json({ error: 'Request expired' }, { status: 410 });
    }

    if (data.status !== 'pending') {
      return NextResponse.json({ error: 'Request already resolved' }, { status: 409 });
    }

    if (data.state !== state) {
      return NextResponse.json({ error: 'State mismatch' }, { status: 403 });
    }

    if (action === 'deny') {
      await supabase
        .from('cli_auth_requests')
        .update({ status: 'denied' })
        .eq('request_id', id);
      return NextResponse.json({ ok: true });
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Store only the hash of the token, not the raw value
    await supabase
      .from('cli_auth_requests')
      .update({ status: 'completed', token_hash: hashToken(token) })
      .eq('request_id', id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Auth request complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
