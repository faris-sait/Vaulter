import crypto from 'crypto';
import open from 'open';
import ora from 'ora';
import { saveToken } from '../lib/auth.js';
import { getApiUrl } from '../lib/config.js';
import { printLogo } from '../assets/logo.js';
import { success, error, info } from '../lib/ui.js';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 120000;

function isSSH() {
  return !!(process.env.SSH_CLIENT || process.env.SSH_TTY || process.env.SSH_CONNECTION);
}

export async function signIn() {
  const requestId = crypto.randomBytes(16).toString('hex');
  const state = crypto.randomBytes(16).toString('hex');
  const apiUrl = getApiUrl();

  // Register pending auth request on backend
  const registerRes = await fetch(`${apiUrl}/api/cli/auth-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, state }),
  });

  if (!registerRes.ok) {
    const data = await registerRes.json().catch(() => ({}));
    error(`Failed to start authentication: ${data.error || registerRes.status}`);
    return;
  }

  const authUrl = `${apiUrl}/cli-auth?request_id=${requestId}&state=${state}`;

  console.log('');
  if (isSSH()) {
    info('Open this URL in your browser to authenticate:');
    console.log(`  ${authUrl}`);
  } else {
    info('Opening browser for authentication...');
    info(`If the browser doesn't open, visit:`);
    console.log(`  ${authUrl}`);
    open(authUrl);
  }
  console.log('');

  const spinner = ora({
    text: 'Waiting for browser authorization...',
    color: 'magenta',
  }).start();

  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let pollData;
    try {
      const pollRes = await fetch(`${apiUrl}/api/cli/auth-request/${requestId}`);
      pollData = await pollRes.json();
    } catch {
      // Network hiccup — keep polling
      continue;
    }

    if (pollData.status === 'completed') {
      const token = pollData.token;

      // Verify the token works
      try {
        const verifyRes = await fetch(`${apiUrl}/api/keys`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!verifyRes.ok) throw new Error('Verification failed');
      } catch {
        spinner.fail('Token verification failed. Please try again.');
        return;
      }

      saveToken(token);
      spinner.succeed('Authenticated successfully!');
      await printLogo();
      success('You are now signed in to Vaulter.');
      info('Run `vaulter ls` to list your keys.');
      return;
    }

    if (pollData.status === 'denied') {
      spinner.fail('Authorization denied.');
      return;
    }

    if (pollData.status === 'expired') {
      spinner.fail('Authorization request expired. Please try again.');
      return;
    }
  }

  spinner.fail('Authorization timed out (120s). Please try again.');
}
