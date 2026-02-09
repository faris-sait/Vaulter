import open from 'open';
import { getApiUrl } from '../lib/config.js';
import { success } from '../lib/ui.js';

export async function openWebApp() {
  const url = getApiUrl();
  success(`Opening ${url}`);
  await open(url);
}
