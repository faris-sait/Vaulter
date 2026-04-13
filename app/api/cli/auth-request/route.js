import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/server/supabase-admin.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../../../lib/server/rate-limit.js';

const CLI_AUTH_REQUEST_LIMIT = {
  namespace: 'cli-auth-request',
  limit: 30,
  windowMs: 10 * 60 * 1000,
};

export async function POST(request) {
  const limitResult = await rateLimitByIp(request, CLI_AUTH_REQUEST_LIMIT);
  if (!limitResult.allowed) {
    return rateLimitErrorResponse(limitResult, { error: 'Too many CLI auth requests. Try again shortly.' });
  }

  try {
    const { request_id, state } = await request.json();

    if (!request_id || !state) {
      return withRateLimitHeaders(NextResponse.json({ error: 'Missing request_id or state' }, { status: 400 }), limitResult);
    }

    if (!/^[0-9a-f]{32}$/.test(request_id) || !/^[0-9a-f]{32}$/.test(state)) {
      return withRateLimitHeaders(NextResponse.json({ error: 'Invalid request_id or state format' }, { status: 400 }), limitResult);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();

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
      return withRateLimitHeaders(NextResponse.json({ error: 'Failed to create auth request' }, { status: 500 }), limitResult);
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true }), limitResult);
  } catch (err) {
    console.error('Auth request error:', err);
    return withRateLimitHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), limitResult);
  }
}
