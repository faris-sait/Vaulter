import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  buildOAuthCallbackUrl,
  getRequestOrigin,
  issueAuthorizationCode,
  parseAuthorizationRequest,
  verifyAuthorizationConsent,
} from '../../../../lib/server/mcp-oauth.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../../../lib/server/rate-limit.js';

const OAUTH_APPROVAL_RATE_LIMIT = {
  namespace: 'oauth-authorize',
  limit: 30,
  windowMs: 10 * 60 * 1000,
};

function hasTrustedOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === getRequestOrigin(request);
}

export async function POST(request) {
  const limitResult = await rateLimitByIp(request, OAUTH_APPROVAL_RATE_LIMIT);
  if (!limitResult.allowed) {
    return rateLimitErrorResponse(limitResult, {
      error: 'rate_limited',
      error_description: 'Too many authorization attempts. Try again shortly.',
    });
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return withRateLimitHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), limitResult);
    }

    if (!hasTrustedOrigin(request)) {
      return withRateLimitHeaders(NextResponse.json({ error: 'Untrusted origin' }, { status: 403 }), limitResult);
    }

    const formData = await request.formData();
    const rawParams = Object.fromEntries(formData.entries());
    const decision = rawParams.decision;
    const authorization = parseAuthorizationRequest(rawParams, getRequestOrigin(request));
    const { params } = authorization;
    verifyAuthorizationConsent({
      token: typeof rawParams.consent_token === 'string' ? rawParams.consent_token : '',
      userId,
      params,
    });

    if (decision === 'deny') {
      return withRateLimitHeaders(NextResponse.redirect(buildOAuthCallbackUrl(params.redirectUri, {
        error: 'access_denied',
        error_description: 'The user denied access to Vaulter MCP.',
        state: params.state,
      }), 303), limitResult);
    }

    if (decision !== 'allow') {
      return withRateLimitHeaders(NextResponse.json({ error: 'Invalid decision' }, { status: 400 }), limitResult);
    }

    const code = issueAuthorizationCode({
      userId,
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      scopes: params.scopes,
      resource: params.resource,
    });

    return withRateLimitHeaders(NextResponse.redirect(buildOAuthCallbackUrl(params.redirectUri, {
      code,
      state: params.state,
    }), 303), limitResult);
  } catch (error) {
    return withRateLimitHeaders(NextResponse.json({ error: error.message }, { status: 400 }), limitResult);
  }
}
