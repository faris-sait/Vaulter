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

// Test user ID for testing purposes
const TEST_USER_ID = 'test-user-123';

// GET /api/test-keys/:id - Get specific key
// GET /api/test-keys/:id?decrypt=true - Get decrypted key
async function GET(request, { params }) {
  try {
    const keyId = params.id;
    const { searchParams } = new URL(request.url);
    const shouldDecrypt = searchParams.get('decrypt') === 'true';

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', TEST_USER_ID)
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
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/test-keys/:id - Delete key
async function DELETE(request, { params }) {
  try {
    const keyId = params.id;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', TEST_USER_ID);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { GET, DELETE };