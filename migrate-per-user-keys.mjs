#!/usr/bin/env node

/**
 * Migration script: Re-encrypt all API keys with per-user derived keys.
 *
 * Previously, all keys were encrypted with a single ENCRYPTION_KEY.
 * This script decrypts each key with the old master key, then re-encrypts
 * it with a per-user derived key (HMAC-SHA256 of the master key + userId).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ENCRYPTION_KEY=... node migrate-per-user-keys.mjs
 *
 * Options:
 *   --dry-run    Preview what would be migrated without writing changes
 */

import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

const ALGORITHM = 'aes-256-gcm';
const BATCH_SIZE = 100;

if (!SUPABASE_URL || !SUPABASE_KEY || !ENCRYPTION_KEY) {
  console.error('❌ Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY');
  process.exit(1);
}

function getMasterKey() {
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

function deriveUserKey(userId) {
  return crypto.createHmac('sha256', getMasterKey()).update(`vaulter:user:${userId}`).digest();
}

function decryptWithKey(encryptedText, key) {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptWithKey(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function supabaseRequest(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

async function fetchAllKeys() {
  let allKeys = [];
  let offset = 0;

  while (true) {
    const keys = await supabaseRequest(
      `api_keys?select=id,user_id,encrypted_key&order=created_at.asc&offset=${offset}&limit=${BATCH_SIZE}`
    );

    if (!keys || keys.length === 0) break;

    allKeys = allKeys.concat(keys);
    offset += keys.length;

    if (keys.length < BATCH_SIZE) break;
  }

  return allKeys;
}

async function migrate() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no changes will be written\n' : '🔄 Starting migration...\n');

  const keys = await fetchAllKeys();
  console.log(`Found ${keys.length} key(s) to migrate.\n`);

  if (keys.length === 0) {
    console.log('✅ Nothing to migrate.');
    return;
  }

  const masterKey = getMasterKey();
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of keys) {
    const { id, user_id, encrypted_key } = row;

    // First, try decrypting with the per-user key — if it works, already migrated
    try {
      const userKey = deriveUserKey(user_id);
      decryptWithKey(encrypted_key, userKey);
      skipped++;
      continue;
    } catch {
      // Expected — not yet migrated, proceed
    }

    // Decrypt with old master key
    let plaintext;
    try {
      plaintext = decryptWithKey(encrypted_key, masterKey);
    } catch (err) {
      console.error(`  ❌ FAILED to decrypt key ${id} (user: ${user_id}): ${err.message}`);
      failed++;
      continue;
    }

    // Re-encrypt with per-user derived key
    const userKey = deriveUserKey(user_id);
    const reEncrypted = encryptWithKey(plaintext, userKey);

    if (DRY_RUN) {
      console.log(`  [dry-run] Would re-encrypt key ${id} for user ${user_id}`);
      migrated++;
      continue;
    }

    // Update in database
    try {
      await supabaseRequest(`api_keys?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ encrypted_key: reEncrypted }),
        prefer: 'return=minimal',
      });
      migrated++;
    } catch (err) {
      console.error(`  ❌ FAILED to update key ${id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already migrated): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`${'='.repeat(40)}`);

  if (failed > 0) {
    console.log('\n⚠️  Some keys failed to migrate. Check errors above and re-run.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n🔍 Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
