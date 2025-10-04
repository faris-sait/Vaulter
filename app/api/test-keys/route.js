import { createClient } from '@supabase/supabase-js';
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

// Test user ID for testing purposes
const TEST_USER_ID = 'test-user-123';

// GET /api/test-keys - List all keys (masked)
async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data || [] });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/test-keys - Create new encrypted key
async function POST(request) {
  try {
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
        user_id: TEST_USER_ID,
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
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { GET, POST };