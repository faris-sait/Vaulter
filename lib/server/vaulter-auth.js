import crypto from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from './supabase-admin.js';
import { isMcpTokenName } from './tokens.js';

export async function resolveStoredBearerUser(request, options = {}) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const supabaseAdmin = getSupabaseAdmin();
    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabaseAdmin
      .from('cli_tokens')
      .select('user_id, name')
      .eq('token_hash', tokenHash)
      .single();

    if (data && !error) {
      if (options.requireMcpToken === true && !isMcpTokenName(data.name)) {
        return { userId: null, authType: null };
      }

      await supabaseAdmin
        .from('cli_tokens')
        .update({ last_used: new Date().toISOString() })
        .eq('token_hash', tokenHash);

      return { userId: data.user_id, authType: 'bearer' };
    }
  }

  return { userId: null, authType: null };
}

export async function resolveVaulterUser(request) {
  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, authType: 'clerk' };
    }
  } catch {}

  return resolveStoredBearerUser(request);
}
