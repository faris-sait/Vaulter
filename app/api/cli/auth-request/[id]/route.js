import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('cli_auth_requests')
      .select('status, token, expires_at')
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
      const token = data.token;
      await supabase.from('cli_auth_requests').delete().eq('request_id', id);
      return NextResponse.json({ status: 'completed', token });
    }

    return NextResponse.json({ status: data.status });
  } catch (err) {
    console.error('Auth request poll error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { token, state, action } = await request.json();

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

    await supabase
      .from('cli_auth_requests')
      .update({ status: 'completed', token })
      .eq('request_id', id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Auth request complete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
