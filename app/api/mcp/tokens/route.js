import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  createMcpToken,
  listMcpTokens,
  toCreatedMcpTokenResponse,
} from '../../../../lib/server/tokens.js';
import { rateLimitByIdentifier, rateLimitErrorResponse, withRateLimitHeaders } from '../../../../lib/server/rate-limit.js';

const MCP_TOKEN_LIST_LIMIT = {
  namespace: 'mcp-token-list',
  limit: 60,
  windowMs: 60 * 1000,
};
const MCP_TOKEN_CREATE_LIMIT = {
  namespace: 'mcp-token-create',
  limit: 10,
  windowMs: 60 * 60 * 1000,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, MCP_TOKEN_LIST_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many token list requests' });
    }

    const tokens = await listMcpTokens(userId);
    return withRateLimitHeaders(NextResponse.json({ tokens }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }), limitResult);
  } catch (error) {
    console.error('MCP tokens list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, MCP_TOKEN_CREATE_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many token creation requests' });
    }

    const body = await request.json().catch(() => ({}));
    const rawLabel = typeof body.label === 'string' ? body.label.trim() : '';
    const label = rawLabel.slice(0, 80);
    const { token, record } = await createMcpToken(userId, label);

    return withRateLimitHeaders(NextResponse.json(toCreatedMcpTokenResponse(token, record), {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    }), limitResult);
  } catch (error) {
    console.error('MCP token create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
