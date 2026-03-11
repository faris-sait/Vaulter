import { NextResponse } from 'next/server';
import { rateLimitByIdentifier, rateLimitErrorResponse, withRateLimitHeaders } from '../../../lib/server/rate-limit.js';
import { resolveVaulterUser } from '../../../lib/server/vaulter-auth.js';
import { decryptSecret, encryptSecret, maskKey } from '../../../lib/server/vaulter-crypto.js';
import { getSupabaseAdmin } from '../../../lib/server/supabase-admin.js';

const API_GET_LIMIT = { namespace: 'api-get', limit: 120, windowMs: 60 * 1000 };
const API_POST_LIMIT = { namespace: 'api-post', limit: 60, windowMs: 60 * 1000 };
const API_DELETE_LIMIT = { namespace: 'api-delete', limit: 30, windowMs: 60 * 1000 };

function json(body, init = {}, rateLimitResult) {
  const response = NextResponse.json(body, init);
  return rateLimitResult ? withRateLimitHeaders(response, rateLimitResult) : response;
}

// GET /api/keys - List all keys (masked)
// GET /api/keys/:id - Get specific key
// GET /api/keys/:id?decrypt=true - Get decrypted key
async function GET(request) {
  try {
    const { userId } = await resolveVaulterUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, API_GET_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many read requests' });
    }

    const supabase = getSupabaseAdmin();

    const { pathname, searchParams } = new URL(request.url);
    const pathParts = pathname.split('/').filter(Boolean);
    
    // GET /api/keys/:id
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const keyId = pathParts[2];
      const shouldDecrypt = searchParams.get('decrypt') === 'true';

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return json({ error: 'Key not found' }, { status: 404 }, limitResult);
      }

      if (shouldDecrypt) {
        try {
          const decryptedKey = decryptSecret(data.encrypted_key);
          return json({ ...data, decrypted_key: decryptedKey }, {}, limitResult);
        } catch (err) {
          return json({ error: 'Decryption failed' }, { status: 500 }, limitResult);
        }
      }

      return json(data, {}, limitResult);
    }

    // GET /api/keys - List all keys
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return json({ error: error.message }, { status: 500 }, limitResult);
      }

      return json({ keys: data || [] }, {}, limitResult);
    }

    return json({ error: 'Not found' }, { status: 404 }, limitResult);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/keys - Create new encrypted key
// POST /api/usage/:id - Log usage event
async function POST(request) {
  try {
    const { userId } = await resolveVaulterUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, API_POST_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many write requests' });
    }

    const supabase = getSupabaseAdmin();

    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/').filter(Boolean);

    // POST /api/usage/:id - Log usage
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'usage') {
      const keyId = pathParts[2];

      const { error } = await supabase
        .from('api_keys')
        .update({
          last_used: new Date().toISOString(),
          usage_count: supabase.rpc('increment_usage', { key_id: keyId })
        })
        .eq('id', keyId)
        .eq('user_id', userId);

      // If RPC doesn't exist, update manually
      const { data: currentKey } = await supabase
        .from('api_keys')
        .select('usage_count')
        .eq('id', keyId)
        .eq('user_id', userId)
        .single();

      if (currentKey) {
        await supabase
          .from('api_keys')
          .update({
            last_used: new Date().toISOString(),
            usage_count: (currentKey.usage_count || 0) + 1
          })
          .eq('id', keyId)
          .eq('user_id', userId);
      }

      return json({ success: true }, {}, limitResult);
    }

    // POST /api/keys/bulk - Bulk import keys
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'keys' && pathParts[2] === 'bulk') {
      const body = await request.json();
      const { keys: keysToImport, overwriteKeys } = body;

        if (!Array.isArray(keysToImport) || keysToImport.length === 0) {
        return json(
          { error: 'Keys array is required and must not be empty' },
          { status: 400 },
          limitResult
        );
      }

      const results = { success: [], failed: [], overwritten: [] };

      // Insert all keys (delete existing only after successful encryption/validation)
      for (const keyData of keysToImport) {
        const { name, apiKey } = keyData;

        if (!name || !apiKey || typeof name !== 'string' || typeof apiKey !== 'string') {
          results.failed.push({ name: name || 'Unknown', error: 'Missing or invalid name/API key' });
          continue;
        }

        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length > 255) {
          results.failed.push({ name, error: 'Invalid name length (must be 1-255 characters)' });
          continue;
        }

        try {
          const encryptedKey = encryptSecret(apiKey);
          const maskedKey = maskKey(apiKey);

          const shouldOverwrite = overwriteKeys && overwriteKeys.includes(trimmedName);

          // If overwriting, delete existing key first (only after encryption succeeds)
          if (shouldOverwrite) {
            const { error: deleteError } = await supabase
              .from('api_keys')
              .delete()
              .eq('user_id', userId)
              .eq('name', trimmedName);

            if (deleteError) {
              results.failed.push({ name: trimmedName, error: `Failed to delete existing: ${deleteError.message}` });
              continue;
            }
          }

          const { data, error } = await supabase
            .from('api_keys')
            .insert({
              user_id: userId,
              name: trimmedName,
              encrypted_key: encryptedKey,
              masked_key: maskedKey,
              tags: [],
              created_at: new Date().toISOString(),
              last_used: null,
              usage_count: 0
            })
            .select()
            .single();

          if (error) {
            results.failed.push({ name: trimmedName, error: error.message });
          } else {
            if (shouldOverwrite) {
              results.overwritten.push(data);
            } else {
              results.success.push(data);
            }
          }
        } catch (err) {
          results.failed.push({ name: trimmedName, error: `Encryption failed: ${err.message}` });
        }
      }

      return json(results, { status: 201 }, limitResult);
    }

    // POST /api/keys - Create new key
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const body = await request.json();
      const { name, apiKey, tags } = body;

      if (!name || !apiKey) {
        return json(
          { error: 'Name and API key are required' },
          { status: 400 },
          limitResult
        );
      }

      // Encrypt the key
      const encryptedKey = encryptSecret(apiKey);
      const maskedKey = maskKey(apiKey);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          encrypted_key: encryptedKey,
          masked_key: maskedKey,
          tags: tags || [],
          created_at: new Date().toISOString(),
          last_used: null,
          usage_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return json({ error: error.message }, { status: 500 }, limitResult);
      }

      return json(data, { status: 201 }, limitResult);
    }

    return json({ error: 'Not found' }, { status: 404 }, limitResult);
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/keys/:id - Delete key
async function DELETE(request) {
  try {
    const { userId } = await resolveVaulterUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitResult = rateLimitByIdentifier(userId, API_DELETE_LIMIT);
    if (!limitResult.allowed) {
      return rateLimitErrorResponse(limitResult, { error: 'Too many delete requests' });
    }

    const supabase = getSupabaseAdmin();

    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/').filter(Boolean);

    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const keyId = pathParts[2];

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId);

      if (error) {
        return json({ error: error.message }, { status: 500 }, limitResult);
      }

      return json({ success: true }, {}, limitResult);
    }

    return json({ error: 'Not found' }, { status: 404 }, limitResult);
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { GET, POST, DELETE };
