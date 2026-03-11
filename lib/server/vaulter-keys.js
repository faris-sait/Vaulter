import { decryptSecret, encryptSecret, maskKey } from './vaulter-crypto.js';
import { getSupabaseAdmin } from './supabase-admin.js';

export async function listKeysForUser(userId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getKeyByIdForUser(userId, keyId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('id', keyId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Key not found');
  }

  return data;
}

export async function createKeyForUser(userId, { name, apiKey, tags = [] }) {
  const supabaseAdmin = getSupabaseAdmin();
  const encryptedKey = encryptSecret(apiKey);
  const maskedKey = maskKey(apiKey);

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      encrypted_key: encryptedKey,
      masked_key: maskedKey,
      tags,
      created_at: new Date().toISOString(),
      last_used: null,
      usage_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteKeyForUser(userId, keyId) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export function decryptKeyRecord(record) {
  return decryptSecret(record.encrypted_key);
}
