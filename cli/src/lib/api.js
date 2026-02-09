import { getToken } from './auth.js';
import { getApiUrl } from './config.js';

export async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Run `vaulter sign-in` first.');
  }

  const url = `${getApiUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    throw new Error('Session expired. Run `vaulter sign-in` to re-authenticate.');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}
