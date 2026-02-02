import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Encryption utilities
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskKey(key) {
  if (key.length <= 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// GET /api/keys - List all keys (masked)
// GET /api/keys/:id - Get specific key
// GET /api/keys/:id?decrypt=true - Get decrypted key
async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
      }

      if (shouldDecrypt) {
        try {
          const decryptedKey = decrypt(data.encrypted_key);
          return NextResponse.json({ ...data, decrypted_key: decryptedKey });
        } catch (err) {
          return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
        }
      }

      return NextResponse.json(data);
    }

    // GET /api/keys - List all keys
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ keys: data || [] });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/keys - Create new encrypted key
// POST /api/usage/:id - Log usage event
async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

      return NextResponse.json({ success: true });
    }

    // POST /api/keys/bulk - Bulk import keys
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'keys' && pathParts[2] === 'bulk') {
      const body = await request.json();
      const { keys: keysToImport, overwriteKeys } = body;

      if (!Array.isArray(keysToImport) || keysToImport.length === 0) {
        return NextResponse.json(
          { error: 'Keys array is required and must not be empty' },
          { status: 400 }
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
          const encryptedKey = encrypt(apiKey);
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

      return NextResponse.json(results, { status: 201 });
    }

    // POST /api/keys - Create new key
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'keys') {
      const body = await request.json();
      const { name, apiKey, tags } = body;

      if (!name || !apiKey) {
        return NextResponse.json(
          { error: 'Name and API key are required' },
          { status: 400 }
        );
      }

      // Encrypt the key
      const encryptedKey = encrypt(apiKey);
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/keys/:id - Delete key
async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { GET, POST, DELETE };