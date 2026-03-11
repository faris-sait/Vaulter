import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { rateLimitByIdentifier, rateLimitErrorResponse, withRateLimitHeaders } from '../../../../lib/server/rate-limit.js';
import { createNamedToken } from '../../../../lib/server/tokens.js';

const CLI_TOKEN_CREATE_LIMIT = {
  namespace: 'cli-token-create',
  limit: 20,
  windowMs: 60 * 60 * 1000,
};

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, CLI_TOKEN_CREATE_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many CLI token requests' });
    }

    const { token } = await createNamedToken(userId, 'Vaulter CLI');

    return withRateLimitHeaders(NextResponse.json({ token }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }), limitResult);
  } catch (error) {
    console.error('CLI token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
