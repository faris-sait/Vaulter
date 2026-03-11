const rateLimitStore = globalThis.__vaulterRateLimitStore || new Map();

if (!globalThis.__vaulterRateLimitStore) {
  globalThis.__vaulterRateLimitStore = rateLimitStore;
}

function pruneExpired(now = Date.now()) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  pruneExpired(now);

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - entry.count, 0),
      retryAfter: Math.ceil(windowMs / 1000),
      resetAt: entry.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(limit - existing.count, 0),
    retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    resetAt: existing.resetAt,
  };
}

export function rateLimitByIp(request, options) {
  const ip = getClientIp(request);
  return checkRateLimit({
    key: `${options.namespace}:ip:${ip}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export function rateLimitByIdentifier(identifier, options) {
  return checkRateLimit({
    key: `${options.namespace}:id:${identifier}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export function withRateLimitHeaders(response, result) {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    headers.set('Retry-After', String(result.retryAfter));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function rateLimitErrorResponse(result, body = { error: 'Too many requests' }) {
  return withRateLimitHeaders(
    Response.json(body, { status: 429 }),
    result
  );
}
