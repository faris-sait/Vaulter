const API_URL = process.env.VAULTER_API_URL || 'https://vaulter-nine.vercel.app';

export function getApiUrl() {
  return API_URL;
}
