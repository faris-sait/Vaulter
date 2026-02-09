import fs from 'fs';
import path from 'path';
import os from 'os';

const VAULTER_DIR = path.join(os.homedir(), '.vaulter');
const CREDENTIALS_FILE = path.join(VAULTER_DIR, 'credentials.json');

export function getToken() {
  try {
    const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    return data.token || null;
  } catch {
    return null;
  }
}

export function saveToken(token) {
  if (!fs.existsSync(VAULTER_DIR)) {
    fs.mkdirSync(VAULTER_DIR, { mode: 0o700 });
  }
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify({ token }, null, 2),
    { mode: 0o600 }
  );
}

export function clearToken() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
  } catch {}
}

export function isAuthenticated() {
  return !!getToken();
}
