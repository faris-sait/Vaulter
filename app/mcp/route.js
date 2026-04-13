import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { NextResponse } from 'next/server';
import { createVaulterMcpServer } from '../../lib/mcp/server.js';
import { withMcpCors as withCors } from '../../lib/server/cors.js';
import { buildWwwAuthenticateHeader, getRequestOrigin, verifyAccessTokenForResource } from '../../lib/server/mcp-oauth.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../lib/server/rate-limit.js';
import { resolveStoredBearerUser } from '../../lib/server/vaulter-auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MCP_RATE_LIMIT = {
  namespace: 'mcp',
  limit: 120,
  windowMs: 60 * 1000,
};

function jsonRpcErrorResponse(status, message, extraHeaders = {}) {
  return withCors(new NextResponse(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message,
      },
      id: null,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    }
  ));
}

function oauthErrorResponse(request, status, description) {
  return withCors(new NextResponse(
    JSON.stringify({
      error: 'invalid_token',
      error_description: description,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'WWW-Authenticate': buildWwwAuthenticateHeader(getRequestOrigin(request), description),
      },
    }
  ));
}

async function resolveMcpUser(request) {
  const authHeader = request.headers.get('authorization');
  let authFailure = 'Authorization required. Sign in through MCP OAuth or use an MCP token.';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      const accessToken = verifyAccessTokenForResource(token, getRequestOrigin(request));
      return {
        userId: accessToken.userId,
        authFailure,
      };
    } catch {
      authFailure = 'Invalid or expired bearer token.';
    }

    const fallback = await resolveStoredBearerUser(request, { requireMcpToken: true });
    return {
      userId: fallback.userId,
      authFailure,
    };
  }

  return {
    userId: null,
    authFailure,
  };
}

function infoResponse(request) {
  const origin = getRequestOrigin(request);

  return withCors(NextResponse.json({
    name: 'Vaulter MCP',
    transport: 'streamable-http',
    endpoint: `${origin}/mcp`,
    auth: {
      primary: 'OAuth 2.1 with browser sign-in via Clerk',
      fallback: 'See MCP setup instructions at /mcp-access',
    },
    discovery: {
      authorizationServer: `${origin}/.well-known/oauth-authorization-server`,
      protectedResource: `${origin}/.well-known/oauth-protected-resource/mcp`,
    },
    note: 'Opening /mcp directly in a browser does not start an MCP session. MCP clients should connect using Streamable HTTP.',
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  }));
}

async function handleTransportRequest(request) {
  const limitResult = await rateLimitByIp(request, MCP_RATE_LIMIT);
  if (!limitResult.allowed) {
    return rateLimitErrorResponse(limitResult, {
      error: 'rate_limited',
      error_description: 'Too many MCP requests. Try again shortly.',
    });
  }

  const { userId, authFailure } = await resolveMcpUser(request);

  if (!userId) {
    return withRateLimitHeaders(oauthErrorResponse(request, 401, authFailure), limitResult);
  }

  const server = createVaulterMcpServer({ userId });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);

    if (request.method !== 'GET') {
      await transport.close();
      await server.close();
    }

    return withRateLimitHeaders(withCors(response), limitResult);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
    return withRateLimitHeaders(jsonRpcErrorResponse(500, 'Internal server error'), limitResult);
  }
}

export async function POST(request) {
  return handleTransportRequest(request);
}

export async function GET(request) {
  const accept = request.headers.get('accept') || '';

  if (accept.includes('text/event-stream')) {
    return handleTransportRequest(request);
  }

  return infoResponse(request);
}

export async function DELETE(request) {
  return handleTransportRequest(request);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, DELETE, OPTIONS',
    },
  }));
}
