import { clearToken, isAuthenticated } from '../lib/auth.js';
import { success, warn } from '../lib/ui.js';

export function signOut() {
  if (!isAuthenticated()) {
    warn('You are not signed in.');
    return;
  }

  clearToken();
  success('Signed out of Vaulter.');
}
