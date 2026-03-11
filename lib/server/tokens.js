import crypto from 'crypto';
import { getSupabaseAdmin } from './supabase-admin.js';

const MCP_TOKEN_PREFIX = 'Vaulter MCP';

function createTokenValue() {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

function normalizeLabel(label, fallback) {
  const cleaned = typeof label === 'string' ? label.trim().replace(/\s+/g, ' ') : '';
  return cleaned || fallback;
}

function buildMcpTokenName(label) {
  const normalized = normalizeLabel(label, 'Default');
  return `${MCP_TOKEN_PREFIX}: ${normalized}`;
}

function parseMcpTokenLabel(name) {
  if (!name || !name.startsWith(`${MCP_TOKEN_PREFIX}: `)) {
    return name || 'Unnamed';
  }

  return name.slice(`${MCP_TOKEN_PREFIX}: `.length);
}

export function isMcpTokenRecord(record) {
  return typeof record?.name === 'string' && record.name.startsWith(`${MCP_TOKEN_PREFIX}: `);
}

export function isMcpTokenName(name) {
  return typeof name === 'string' && name.startsWith(`${MCP_TOKEN_PREFIX}: `);
}

export function toPublicTokenRecord(record) {
  return {
    id: record.token_hash,
    label: parseMcpTokenLabel(record.name),
    createdAt: record.created_at || null,
    lastUsed: record.last_used || null,
  };
}

export async function createNamedToken(userId, name) {
  const supabaseAdmin = getSupabaseAdmin();
  const { token, tokenHash } = createTokenValue();

  const { data, error } = await supabaseAdmin
    .from('cli_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      name,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    token,
    record: data,
  };
}

export async function createMcpToken(userId, label) {
  return createNamedToken(userId, buildMcpTokenName(label));
}

export async function listMcpTokens(userId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('cli_tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).filter(isMcpTokenRecord).map(toPublicTokenRecord);
}

export async function revokeMcpToken(userId, tokenHash) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('cli_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !existing) {
    throw new Error('Token not found');
  }

  if (!isMcpTokenRecord(existing)) {
    throw new Error('Only MCP tokens can be revoked from this endpoint');
  }

  const { data, error } = await supabaseAdmin
    .from('cli_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Token not found');
  }

  return toPublicTokenRecord(data);
}

export function toCreatedMcpTokenResponse(token, record) {
  return {
    token,
    item: toPublicTokenRecord(record),
  };
}
