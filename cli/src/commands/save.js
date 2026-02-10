import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { apiFetch } from '../lib/api.js';
import { parseEnvFile } from '../lib/env-parser.js';
import { success, error, warn, dim, purple, tip } from '../lib/ui.js';

export async function saveEnv(filename) {
  const file = filename || '.env';
  const inputPath = path.resolve(file);

  // Check file exists
  if (!fs.existsSync(inputPath)) {
    console.log('');
    error(`File not found: ${inputPath}`);
    console.log('');
    return;
  }

  // Read and parse
  const content = fs.readFileSync(inputPath, 'utf-8');
  const { parsedKeys, warnings } = parseEnvFile(content);

  // Show warnings
  if (warnings.length > 0) {
    console.log('');
    for (const w of warnings) {
      warn(w);
    }
  }

  if (parsedKeys.length === 0) {
    console.log('');
    error('No valid keys found in the file.');
    console.log('');
    return;
  }

  console.log('');
  success(`Found ${parsedKeys.length} key(s) in ${file}`);

  // Fetch existing vault keys to detect duplicates
  const spinner = ora({ text: 'Checking for duplicates...', color: 'magenta' }).start();

  let existingKeys;
  try {
    const data = await apiFetch('/api/keys');
    existingKeys = data.keys || [];
  } catch (err) {
    spinner.fail('Failed to fetch existing keys');
    error(err.message);
    return;
  }

  spinner.stop();

  const existingNames = new Set(existingKeys.map((k) => k.name));
  const duplicates = parsedKeys.filter((k) => existingNames.has(k.name));
  const overwriteKeys = [];

  // Per-key duplicate resolution
  if (duplicates.length > 0) {
    console.log('');
    warn(`${duplicates.length} key(s) already exist in your vault:`);
    console.log('');

    for (const dup of duplicates) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: purple(`"${dup.name}" already exists. What do you want to do?`),
          choices: [
            { name: 'Skip', value: 'skip' },
            { name: 'Overwrite', value: 'overwrite' },
          ],
        },
      ]);

      if (action === 'overwrite') {
        overwriteKeys.push(dup.name);
      }
    }
  }

  // Filter: keep non-duplicates + overwrite choices
  const keysToImport = parsedKeys.filter(
    (k) => !existingNames.has(k.name) || overwriteKeys.includes(k.name)
  );

  if (keysToImport.length === 0) {
    console.log('');
    warn('All keys were skipped. Nothing to upload.');
    console.log('');
    return;
  }

  // Upload
  const uploadSpinner = ora({ text: `Uploading ${keysToImport.length} key(s)...`, color: 'magenta' }).start();

  try {
    const result = await apiFetch('/api/keys/bulk', {
      method: 'POST',
      body: JSON.stringify({ keys: keysToImport, overwriteKeys }),
    });

    uploadSpinner.succeed('Upload complete!');
    console.log('');

    const imported = result.imported || keysToImport.length;
    const overwritten = overwriteKeys.length;
    const failed = result.failed || 0;

    success(`${imported} key(s) saved to vault.`);
    if (overwritten > 0) {
      warn(`${overwritten} key(s) overwritten.`);
    }
    if (failed > 0) {
      error(`${failed} key(s) failed.`);
    }
    tip('Run `vaulter ls` to see all your vault keys.');
    console.log('');
  } catch (err) {
    uploadSpinner.fail('Failed to upload keys');
    error(err.message);
  }
}
