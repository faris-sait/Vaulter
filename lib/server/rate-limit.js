import { getSupabaseAdmin } from './supabase-admin.js';

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
    request.headers.get('x-vercel-forwarded-for') ||
    null
  );
}

function failOpen(limit, windowMs) {
  const now = Date.now();
  return {
    allowed: true,
    limit,
    remaining: limit,
    retryAfter: Math.ceil(windowMs / 1000),
    resetAt: now + windowMs,
  };
}

export async function checkRateLimit({ key, limit, windowMs }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });

    if (error) {
      console.error('[rate-limit] Supabase RPC error, failing open:', error);
      return failOpen(limit, windowMs);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      console.error('[rate-limit] Empty RPC response, failing open');
      return failOpen(limit, windowMs);
    }

    const resetAtMs = new Date(row.window_reset_at).getTime();
    const now = Date.now();
    const count = Number(row.hit_count) || 0;

    return {
      allowed: Boolean(row.is_allowed),
      limit,
      remaining: Math.max(limit - count, 0),
      retryAfter: Math.max(Math.ceil((resetAtMs - now) / 1000), 1),
      resetAt: resetAtMs,
    };
  } catch (err) {
    console.error('[rate-limit] Unexpected error, failing open:', err);
    return failOpen(limit, windowMs);
  }
}

export async function rateLimitByIp(request, options) {
  const ip = getClientIp(request);
  if (!ip) {
    console.warn(
      `[rate-limit] Unable to determine client IP for namespace "${options.namespace}" — failing open. Check your proxy / x-forwarded-for configuration.`
    );
    return failOpen(options.limit, options.windowMs);
  }
  return checkRateLimit({
    key: `${options.namespace}:ip:${ip}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

export async function rateLimitByIdentifier(identifier, options) {
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
