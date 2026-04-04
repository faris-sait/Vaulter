import crypto from 'crypto';
import { z } from 'zod';

const SUPPORTED_SCOPE = 'mcp:tools';
const CONSENT_TTL_SECONDS = 10 * 60;
const AUTH_CODE_TTL_SECONDS = 10 * 60;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_PREFIX = 'vaulter';
const TOKEN_VERSION = 'v1';
const MAX_REDIRECT_URIS = 10;
const MAX_URL_LENGTH = 2048;
const MAX_STATE_LENGTH = 1024;
const CODE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const replayStore = globalThis.__vaulterOauthReplayStore || new Map();

if (!globalThis.__vaulterOauthReplayStore) {
  globalThis.__vaulterOauthReplayStore = replayStore;
}

const clientMetadataSchema = z.object({
  redirect_uris: z.array(z.string().max(MAX_URL_LENGTH)).min(1).max(MAX_REDIRECT_URIS),
  token_endpoint_auth_method: z.enum(['client_secret_post', 'none']).optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  client_name: z.string().max(120).optional(),
  scope: z.string().optional(),
}).passthrough();

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function createTokenId() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function pruneReplayStore(now = Date.now()) {
  for (const [key, expiresAt] of replayStore.entries()) {
    if (expiresAt <= now) {
      replayStore.delete(key);
    }
  }
}

function consumeReplayToken(type, tokenId, expiresAtSeconds) {
  pruneReplayStore();
  const key = `${type}:${tokenId}`;

  if (replayStore.has(key)) {
    return false;
  }

  replayStore.set(key, expiresAtSeconds * 1000);
  return true;
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getOAuthSecret() {
  const rawSecret = process.env.MCP_OAUTH_SECRET || process.env.ENCRYPTION_KEY;

  if (!rawSecret) {
    throw new Error('Missing MCP_OAUTH_SECRET or ENCRYPTION_KEY');
  }

  if (process.env.MCP_OAUTH_SECRET) {
    return Buffer.from(process.env.MCP_OAUTH_SECRET, 'utf8');
  }

  return Buffer.from(rawSecret, 'hex');
}

function createSignature(payloadSegment) {
  return base64UrlEncode(
    crypto
      .createHmac('sha256', getOAuthSecret())
      .update(`${TOKEN_PREFIX}.${TOKEN_VERSION}.${payloadSegment}`)
      .digest()
  );
}

function signPayload(payload) {
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signatureSegment = createSignature(payloadSegment);
  return `${TOKEN_PREFIX}.${TOKEN_VERSION}.${payloadSegment}.${signatureSegment}`;
}

function verifySignedPayload(token, expectedType) {
  const parts = token.split('.');

  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX || parts[1] !== TOKEN_VERSION) {
    throw new Error('Malformed token');
  }

  const payloadSegment = parts[2];
  const signatureSegment = parts[3];
  const expectedSignature = createSignature(payloadSegment);

  if (!timingSafeStringEqual(signatureSegment, expectedSignature)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(payloadSegment).toString('utf8'));

  if (expectedType && payload.typ !== expectedType) {
    throw new Error('Unexpected token type');
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }

  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => Number(part));
  return octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) && octets[0] === 127;
}

function isLoopbackRedirectUrl(parsed) {
  return parsed.protocol === 'http:' && isLoopbackHostname(parsed.hostname);
}

function isAllowedRedirectUri(value) {
  try {
    const parsed = new URL(value);

    if (value.length > MAX_URL_LENGTH || parsed.hash || parsed.username || parsed.password) {
      return false;
    }

    if (parsed.protocol === 'https:') {
      return true;
    }

    if (isLoopbackRedirectUrl(parsed)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function matchesRedirectUriIgnoringLoopbackPort(registeredUri, requestedUri) {
  try {
    const registered = new URL(registeredUri);
    const requested = new URL(requestedUri);

    if (!isLoopbackRedirectUrl(registered) || !isLoopbackRedirectUrl(requested)) {
      return false;
    }

    return (
      registered.protocol === requested.protocol &&
      registered.pathname === requested.pathname &&
      registered.search === requested.search &&
      registered.username === requested.username &&
      registered.password === requested.password &&
      registered.hash === requested.hash
    );
  } catch {
    return false;
  }
}

function redirectUrisMatch(expectedUri, actualUri) {
  return expectedUri === actualUri || matchesRedirectUriIgnoringLoopbackPort(expectedUri, actualUri);
}

function isRegisteredRedirectUri(client, redirectUri) {
  return client.redirect_uris.some((registeredUri) => redirectUrisMatch(registeredUri, redirectUri));
}

function normalizeScopes(scopeValue) {
  const scopes = typeof scopeValue === 'string' && scopeValue.trim().length > 0
    ? scopeValue.trim().split(/\s+/)
    : [SUPPORTED_SCOPE];

  const uniqueScopes = [...new Set(scopes.filter(Boolean))];

  if (uniqueScopes.length === 0) {
    return [SUPPORTED_SCOPE];
  }

  const unsupported = uniqueScopes.filter((scope) => scope !== SUPPORTED_SCOPE);
  if (unsupported.length > 0) {
    throw new Error(`Unsupported scope: ${unsupported.join(', ')}`);
  }

  return uniqueScopes;
}

function hashCodeVerifier(verifier) {
  return base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
}

function normalizeOrigin(origin) {
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
}

export function getRequestOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return `${protocol}://${host}`;
}

export function getMcpResourceUrl(origin) {
  return `${normalizeOrigin(origin)}/mcp`;
}

export function getProtectedResourceMetadataUrl(origin) {
  return `${normalizeOrigin(origin)}/.well-known/oauth-protected-resource/mcp`;
}

export function getAuthorizationServerMetadata(origin) {
  const normalizedOrigin = normalizeOrigin(origin);

  return {
    issuer: normalizedOrigin,
    authorization_endpoint: `${normalizedOrigin}/authorize`,
    token_endpoint: `${normalizedOrigin}/token`,
    registration_endpoint: `${normalizedOrigin}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [SUPPORTED_SCOPE],
  };
}

export function issueAuthorizationConsent({ userId, params }) {
  const now = Math.floor(Date.now() / 1000);

  return signPayload({
    typ: 'oauth_authorization_consent',
    jti: createTokenId(),
    iat: now,
    exp: now + CONSENT_TTL_SECONDS,
    userId,
    params,
  });
}

export function verifyAuthorizationConsent({ token, userId, params }) {
  const payload = verifySignedPayload(token, 'oauth_authorization_consent');

  if (payload.userId !== userId) {
    throw new Error('Consent token user mismatch');
  }

  const payloadParams = payload.params || {};
  const expectedScopes = Array.isArray(payloadParams.scopes) ? payloadParams.scopes.join(' ') : '';
  const actualScopes = Array.isArray(params.scopes) ? params.scopes.join(' ') : '';

  if (
    payloadParams.clientId !== params.clientId ||
    payloadParams.redirectUri !== params.redirectUri ||
    payloadParams.state !== params.state ||
    payloadParams.codeChallenge !== params.codeChallenge ||
    payloadParams.codeChallengeMethod !== params.codeChallengeMethod ||
    payloadParams.resource !== params.resource ||
    expectedScopes !== actualScopes
  ) {
    throw new Error('Consent token request mismatch');
  }

  if (!consumeReplayToken('authorization_consent', payload.jti, payload.exp)) {
    throw new Error('Consent token has already been used');
  }

  return payload;
}

export function getProtectedResourceMetadata(origin) {
  const normalizedOrigin = normalizeOrigin(origin);

  return {
    resource: getMcpResourceUrl(normalizedOrigin),
    authorization_servers: [normalizedOrigin],
    scopes_supported: [SUPPORTED_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Vaulter MCP',
  };
}

export function buildWwwAuthenticateHeader(origin, description = 'Authorization required') {
  const escaped = description.replace(/"/g, '\\"');
  return `Bearer realm="Vaulter", error="invalid_token", error_description="${escaped}", resource_metadata="${getProtectedResourceMetadataUrl(origin)}"`;
}

export function registerOAuthClient(rawMetadata) {
  const metadata = clientMetadataSchema.parse(rawMetadata);
  const redirectUris = metadata.redirect_uris.map((uri) => uri.trim());

  if (!redirectUris.every(isAllowedRedirectUri)) {
    throw new Error('All redirect_uris must use HTTPS or a loopback HTTP callback');
  }

  const grantTypes = metadata.grant_types && metadata.grant_types.length > 0
    ? [...new Set(metadata.grant_types)]
    : ['authorization_code', 'refresh_token'];

  if (!grantTypes.includes('authorization_code')) {
    throw new Error('authorization_code grant_type is required');
  }

  const responseTypes = metadata.response_types && metadata.response_types.length > 0
    ? [...new Set(metadata.response_types)]
    : ['code'];

  if (!responseTypes.includes('code')) {
    throw new Error('response_types must include code');
  }

  const tokenEndpointAuthMethod = metadata.token_endpoint_auth_method || (
    redirectUris.every((uri) => isLoopbackRedirectUrl(new URL(uri)))
      ? 'none'
      : 'client_secret_post'
  );
  const issuedAt = Math.floor(Date.now() / 1000);
  const normalizedMetadata = {
    redirect_uris: redirectUris,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
    grant_types: grantTypes,
    response_types: responseTypes,
    client_name: metadata.client_name || 'Vaulter MCP Client',
    scope: normalizeScopes(metadata.scope).join(' '),
  };
  const clientId = signPayload({
    typ: 'oauth_client',
    iat: issuedAt,
    metadata: normalizedMetadata,
  });
  const clientSecret = tokenEndpointAuthMethod === 'none'
    ? undefined
    : base64UrlEncode(
        crypto
          .createHmac('sha256', getOAuthSecret())
          .update(`client_secret:${clientId}`)
          .digest()
      );

  return {
    ...normalizedMetadata,
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: issuedAt,
    client_secret_expires_at: clientSecret ? 0 : undefined,
  };
}

export function getOAuthClient(clientId) {
  const payload = verifySignedPayload(clientId, 'oauth_client');
  return {
    client_id: clientId,
    ...payload.metadata,
  };
}

export function authenticateOAuthClient(client, clientSecret) {
  if (client.token_endpoint_auth_method === 'none') {
    return;
  }

  const expectedSecret = base64UrlEncode(
    crypto
      .createHmac('sha256', getOAuthSecret())
      .update(`client_secret:${client.client_id}`)
      .digest()
  );

  if (!clientSecret || !timingSafeStringEqual(clientSecret, expectedSecret)) {
    throw new Error('Invalid client credentials');
  }
}

export function normalizeRequestedResource(resource, origin) {
  const defaultResource = getMcpResourceUrl(origin);

  if (!resource) {
    return defaultResource;
  }

  const parsed = new URL(resource);
  const parsedDefault = new URL(defaultResource);

  const sameOrigin = parsed.origin === parsedDefault.origin;
  const allowedPath = parsed.pathname === '/' || parsed.pathname === parsedDefault.pathname;

  if (!sameOrigin || !allowedPath) {
    throw new Error('Invalid resource requested');
  }

  return defaultResource;
}

export function parseAuthorizationRequest(rawParams, origin) {
  const clientId = typeof rawParams.client_id === 'string' ? rawParams.client_id : '';
  const redirectUri = typeof rawParams.redirect_uri === 'string' ? rawParams.redirect_uri : '';
  const responseType = typeof rawParams.response_type === 'string' ? rawParams.response_type : '';
  const state = typeof rawParams.state === 'string' ? rawParams.state : undefined;
  const codeChallenge = typeof rawParams.code_challenge === 'string' ? rawParams.code_challenge : '';
  const codeChallengeMethod = typeof rawParams.code_challenge_method === 'string'
    ? rawParams.code_challenge_method
    : 'S256';
  const scope = typeof rawParams.scope === 'string' ? rawParams.scope : undefined;
  const resource = typeof rawParams.resource === 'string' ? rawParams.resource : undefined;

  if (!clientId || !redirectUri || !responseType || !codeChallenge) {
    throw new Error('Missing required OAuth parameters');
  }

  if (redirectUri.length > MAX_URL_LENGTH) {
    throw new Error('redirect_uri is too long');
  }

  if (state && state.length > MAX_STATE_LENGTH) {
    throw new Error('state is too long');
  }

  if (responseType !== 'code') {
    throw new Error('Unsupported response_type');
  }

  if (codeChallengeMethod !== 'S256') {
    throw new Error('code_challenge_method must be S256');
  }

  if (!CODE_CHALLENGE_PATTERN.test(codeChallenge)) {
    throw new Error('code_challenge must be base64url encoded and 43-128 characters long');
  }

  const client = getOAuthClient(clientId);

  // Native/public clients commonly use loopback redirects with an ephemeral local port.
  if (!isRegisteredRedirectUri(client, redirectUri)) {
    throw new Error('redirect_uri is not registered for this client');
  }

  return {
    client,
    params: {
      clientId,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      scopes: normalizeScopes(scope || client.scope),
      resource: normalizeRequestedResource(resource, origin),
    },
  };
}

export function issueAuthorizationCode({ userId, clientId, redirectUri, codeChallenge, scopes, resource }) {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    typ: 'oauth_authorization_code',
    jti: createTokenId(),
    iat: now,
    exp: now + AUTH_CODE_TTL_SECONDS,
    userId,
    clientId,
    redirectUri,
    codeChallenge,
    scopes,
    resource,
  });
}

export function exchangeAuthorizationCode({ code, clientId, redirectUri, codeVerifier }) {
  const payload = verifySignedPayload(code, 'oauth_authorization_code');

  if (payload.clientId !== clientId) {
    throw new Error('Authorization code was not issued to this client');
  }

  // Native clients can legitimately reuse a loopback callback on a different host label
  // or ephemeral port across the authorization and token steps.
  if (!redirectUrisMatch(payload.redirectUri, redirectUri)) {
    throw new Error('redirect_uri mismatch');
  }

  if (!codeVerifier) {
    throw new Error('Missing code_verifier');
  }

  if (!timingSafeStringEqual(hashCodeVerifier(codeVerifier), payload.codeChallenge)) {
    throw new Error('Invalid code_verifier');
  }

  if (!consumeReplayToken('authorization_code', payload.jti, payload.exp)) {
    throw new Error('Authorization code has already been used');
  }

  return payload;
}

export function issueAccessToken({ userId, clientId, scopes, resource }) {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    typ: 'oauth_access_token',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
    userId,
    clientId,
    scopes,
    resource,
  });
}

export function issueRefreshToken({ userId, clientId, scopes, resource }) {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    typ: 'oauth_refresh_token',
    jti: createTokenId(),
    iat: now,
    exp: now + REFRESH_TOKEN_TTL_SECONDS,
    userId,
    clientId,
    scopes,
    resource,
  });
}

export function verifyAccessToken(token) {
  const payload = verifySignedPayload(token, 'oauth_access_token');
  return {
    userId: payload.userId,
    clientId: payload.clientId,
    scopes: Array.isArray(payload.scopes) ? payload.scopes : [SUPPORTED_SCOPE],
    resource: payload.resource,
    expiresAt: payload.exp,
  };
}

export function verifyAccessTokenForResource(token, origin) {
  const payload = verifyAccessToken(token);
  const expectedResource = getMcpResourceUrl(origin);

  if (payload.resource !== expectedResource) {
    throw new Error('Access token resource does not match this MCP server');
  }

  return payload;
}

export function exchangeRefreshToken({ refreshToken, clientId, scope }) {
  const payload = verifySignedPayload(refreshToken, 'oauth_refresh_token');

  if (payload.clientId !== clientId) {
    throw new Error('Refresh token was not issued to this client');
  }

  const originalScopes = Array.isArray(payload.scopes) ? payload.scopes : [SUPPORTED_SCOPE];
  const requestedScopes = scope ? normalizeScopes(scope) : originalScopes;
  const invalidScope = requestedScopes.some((item) => !originalScopes.includes(item));

  if (invalidScope) {
    throw new Error('Requested scope exceeds original grant');
  }

  if (!consumeReplayToken('refresh_token', payload.jti, payload.exp)) {
    throw new Error('Refresh token has already been used');
  }

  return {
    userId: payload.userId,
    clientId: payload.clientId,
    scopes: requestedScopes,
    resource: payload.resource,
  };
}

export function buildOAuthCallbackUrl(redirectUri, params) {
  const url = new URL(redirectUri);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

export function getSupportedScopes() {
  return [SUPPORTED_SCOPE];
}

export function getAccessTokenLifetimeSeconds() {
  return ACCESS_TOKEN_TTL_SECONDS;
}
