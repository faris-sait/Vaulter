import { NextResponse } from 'next/server';
import { getAuthorizationServerMetadata, getRequestOrigin, registerOAuthClient } from '../../lib/server/mcp-oauth.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../lib/server/rate-limit.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version',
};
const REGISTER_RATE_LIMIT = {
  namespace: 'oauth-register',
  limit: 20,
  windowMs: 15 * 60 * 1000,
};

function withCors(response) {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(request) {
  const limitResult = rateLimitByIp(request, REGISTER_RATE_LIMIT);
  if (!limitResult.allowed) {
    return rateLimitErrorResponse(limitResult, {
      error: 'rate_limited',
      error_description: 'Too many client registration attempts. Try again later.',
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('registration endpoint requires application/json');
    }

    const body = await request.json();
    const client = registerOAuthClient(body);
    const response = NextResponse.json(client, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    const metadata = getAuthorizationServerMetadata(getRequestOrigin(request));
    response.headers.set('Location', metadata.registration_endpoint);
    return withRateLimitHeaders(withCors(response), limitResult);
  } catch (error) {
    return withRateLimitHeaders(withCors(NextResponse.json({
      error: 'invalid_client_metadata',
      error_description: error.message,
    }, { status: 400 })), limitResult);
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
