import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { rateLimitByIdentifier, rateLimitErrorResponse, withRateLimitHeaders } from '../../../../../lib/server/rate-limit.js';
import { revokeMcpToken } from '../../../../../lib/server/tokens.js';

const MCP_TOKEN_REVOKE_LIMIT = {
  namespace: 'mcp-token-revoke',
  limit: 20,
  windowMs: 60 * 60 * 1000,
};

export async function DELETE(_request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = await rateLimitByIdentifier(userId, MCP_TOKEN_REVOKE_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many token revoke requests' });
    }

    const { tokenHash } = await params;
    const token = await revokeMcpToken(userId, tokenHash);
    return withRateLimitHeaders(NextResponse.json({ revoked: token }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }), limitResult);
  } catch (error) {
    console.error('MCP token revoke error:', error);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
