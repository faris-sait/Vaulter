import http from 'http';
import crypto from 'crypto';
import open from 'open';
import ora from 'ora';
import { saveToken, getToken } from '../lib/auth.js';
import { getApiUrl } from '../lib/config.js';
import { printLogo } from '../assets/logo.js';
import { success, error, info } from '../lib/ui.js';

export async function signIn() {
  const state = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost`);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const returnedState = url.searchParams.get('state');
        const denied = url.searchParams.get('error');

        if (denied === 'denied') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body style="background:#0f172a;color:#c4b5fd;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Authorization denied. You can close this tab.</h2></body></html>');
          spinner.fail('Authorization denied.');
          server.close();
          resolve();
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>State mismatch. Please try again.</h2></body></html>');
          spinner.fail('State mismatch - possible CSRF attack. Try again.');
          server.close();
          resolve();
          return;
        }

        if (token) {
          saveToken(token);

          // Verify the token works
          try {
            const verifyRes = await fetch(`${getApiUrl()}/api/keys`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!verifyRes.ok) throw new Error('Verification failed');
          } catch {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Token verification failed. Please try again.</h2></body></html>');
            spinner.fail('Token verification failed.');
            server.close();
            resolve();
            return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body style="background:#0f172a;color:#a78bfa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#22c55e">Authenticated!</h2><p>You can close this tab and return to your terminal.</p></div></body></html>');
          spinner.succeed('Authenticated successfully!');
          await printLogo();
          success('You are now signed in to Vaulter.');
          info('Run `vaulter ls` to list your keys.');
          server.close();
          resolve();
          return;
        }

        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Missing token. Please try again.</h2></body></html>');
        spinner.fail('No token received.');
        server.close();
        resolve();
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(0, () => {
      const port = server.address().port;
      const authUrl = `${getApiUrl()}/cli-auth?port=${port}&state=${state}`;

      console.log('');
      info('Opening browser for authentication...');
      console.log('');
      info(`If the browser doesn't open, visit:`);
      console.log(`  ${authUrl}`);
      console.log('');

      open(authUrl);
    });

    const spinner = ora({
      text: 'Waiting for browser authorization...',
      color: 'magenta',
    }).start();

    // 120 second timeout
    setTimeout(() => {
      spinner.fail('Authorization timed out (120s). Please try again.');
      server.close();
      resolve();
    }, 120000);
  });
}
