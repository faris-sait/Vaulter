import { NextResponse } from 'next/server';
import { withOAuthCors as withCors } from '../../lib/server/cors.js';
import { getAuthorizationServerMetadata, getRequestOrigin, registerOAuthClient } from '../../lib/server/mcp-oauth.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../lib/server/rate-limit.js';

const REGISTER_RATE_LIMIT = {
  namespace: 'oauth-register',
  limit: 20,
  windowMs: 15 * 60 * 1000,
};

export async function POST(request) {
  const limitResult = await rateLimitByIp(request, REGISTER_RATE_LIMIT);
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
