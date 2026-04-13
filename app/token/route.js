import { NextResponse } from 'next/server';
import { withOAuthCors as withCors } from '../../lib/server/cors.js';
import {
  authenticateOAuthClient,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  getAccessTokenLifetimeSeconds,
  getOAuthClient,
  issueAccessToken,
  issueRefreshToken,
} from '../../lib/server/mcp-oauth.js';
import { rateLimitByIp, rateLimitErrorResponse, withRateLimitHeaders } from '../../lib/server/rate-limit.js';

const TOKEN_RATE_LIMIT = {
  namespace: 'oauth-token',
  limit: 45,
  windowMs: 10 * 60 * 1000,
};

function tokenResponse(body) {
  return withCors(NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  }));
}

function tokenError(status, error, description) {
  return withCors(NextResponse.json({
    error,
    error_description: description,
  }, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  }));
}

function classifyTokenError(error) {
  const message = error.message || 'Invalid token request';

  if (
    message === 'Invalid client credentials' ||
    message === 'Malformed token' ||
    message === 'Invalid token signature' ||
    message === 'Unexpected token type'
  ) {
    return tokenError(401, 'invalid_client', message);
  }

  if (message.startsWith('Unsupported scope:')) {
    return tokenError(400, 'invalid_scope', message);
  }

  if (message === 'token endpoint requires application/x-www-form-urlencoded') {
    return tokenError(400, 'invalid_request', message);
  }

  return tokenError(400, 'invalid_grant', message);
}

async function parseFormBody(request) {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('application/x-www-form-urlencoded')) {
    throw new Error('token endpoint requires application/x-www-form-urlencoded');
  }

  const raw = await request.text();
  return new URLSearchParams(raw);
}

export async function POST(request) {
  const limitResult = await rateLimitByIp(request, TOKEN_RATE_LIMIT);
  if (!limitResult.allowed) {
    return rateLimitErrorResponse(limitResult, {
      error: 'rate_limited',
      error_description: 'Too many token requests. Try again later.',
    });
  }

  try {
    const params = await parseFormBody(request);
    const grantType = params.get('grant_type');
    const clientId = params.get('client_id');
    const clientSecret = params.get('client_secret');

    if (!grantType || !clientId) {
      return tokenError(400, 'invalid_request', 'grant_type and client_id are required');
    }

    const client = getOAuthClient(clientId);
    authenticateOAuthClient(client, clientSecret);

    if (grantType === 'authorization_code') {
      const code = params.get('code');
      const redirectUri = params.get('redirect_uri');
      const codeVerifier = params.get('code_verifier');

      if (!code || !redirectUri) {
        return withRateLimitHeaders(tokenError(400, 'invalid_request', 'code and redirect_uri are required'), limitResult);
      }

      const authorization = exchangeAuthorizationCode({
        code,
        clientId,
        redirectUri,
        codeVerifier,
      });

      return withRateLimitHeaders(tokenResponse({
        access_token: issueAccessToken({
          userId: authorization.userId,
          clientId,
          scopes: authorization.scopes,
          resource: authorization.resource,
        }),
        token_type: 'bearer',
        expires_in: getAccessTokenLifetimeSeconds(),
        refresh_token: issueRefreshToken({
          userId: authorization.userId,
          clientId,
          scopes: authorization.scopes,
          resource: authorization.resource,
        }),
        scope: authorization.scopes.join(' '),
      }), limitResult);
    }

    if (grantType === 'refresh_token') {
      const refreshToken = params.get('refresh_token');

      if (!refreshToken) {
        return withRateLimitHeaders(tokenError(400, 'invalid_request', 'refresh_token is required'), limitResult);
      }

      const refresh = exchangeRefreshToken({
        refreshToken,
        clientId,
        scope: params.get('scope') || undefined,
      });

      return withRateLimitHeaders(tokenResponse({
        access_token: issueAccessToken({
          userId: refresh.userId,
          clientId,
          scopes: refresh.scopes,
          resource: refresh.resource,
        }),
        token_type: 'bearer',
        expires_in: getAccessTokenLifetimeSeconds(),
        refresh_token: issueRefreshToken({
          userId: refresh.userId,
          clientId,
          scopes: refresh.scopes,
          resource: refresh.resource,
        }),
        scope: refresh.scopes.join(' '),
      }), limitResult);
    }

    return withRateLimitHeaders(tokenError(400, 'unsupported_grant_type', `Unsupported grant_type: ${grantType}`), limitResult);
  } catch (error) {
    return withRateLimitHeaders(classifyTokenError(error), limitResult);
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
