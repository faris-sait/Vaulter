import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MAX_KEY_VALUE_LENGTH = 10000;

function getMasterKey() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('Missing ENCRYPTION_KEY');
  }

  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
}

function deriveUserKey(userId) {
  const masterKey = getMasterKey();
  return crypto.createHmac('sha256', masterKey).update(`vaulter:user:${userId}`).digest();
}

export function encryptSecret(text, userId) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('API key value must be a non-empty string');
  }

  if (text.length > MAX_KEY_VALUE_LENGTH) {
    throw new Error(`API key value exceeds maximum length of ${MAX_KEY_VALUE_LENGTH} characters`);
  }

  const encryptionKey = userId ? deriveUserKey(userId) : getMasterKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedText, userId) {
  if (typeof encryptedText !== 'string') {
    throw new Error('Encrypted text must be a string');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format: expected iv:authTag:ciphertext');
  }

  const encryptionKey = userId ? deriveUserKey(userId) : getMasterKey();
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskKey(key) {
  if (key.length <= 8) {
    return '****';
  }

  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}
