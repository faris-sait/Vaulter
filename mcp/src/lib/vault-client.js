import { apiFetch } from '../../../cli/src/lib/api.js';

export async function listVaultKeys() {
  const data = await apiFetch('/api/keys');
  return data.keys || [];
}

export async function decryptVaultKey(keyId) {
  const data = await apiFetch(`/api/keys/${keyId}?decrypt=true`);
  return data.decrypted_key;
}

export async function createVaultKey({ name, apiKey, tags }) {
  return apiFetch('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name, apiKey, tags }),
  });
}

export async function deleteVaultKey(keyId) {
  return apiFetch(`/api/keys/${keyId}`, {
    method: 'DELETE',
  });
}

export function toPublicKeyMetadata(key) {
  return {
    id: key.id,
    name: key.name,
    maskedKey: key.masked_key,
    tags: Array.isArray(key.tags) ? key.tags : [],
    createdAt: key.created_at || null,
    lastUsed: key.last_used || null,
    usageCount: typeof key.usage_count === 'number' ? key.usage_count : 0,
  };
}
