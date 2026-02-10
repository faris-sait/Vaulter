import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { apiFetch } from '../lib/api.js';
import { success, error, warn, dim, purple, tip } from '../lib/ui.js';

function toEnvVarName(name) {
  return name
    .replace(/[\s\-\.]+/g, '_')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function makeEnv(filename, options) {
  const outputDir = options.output ? path.resolve(options.output) : process.cwd();
  const file = filename || '.env';
  const outputPath = path.join(outputDir, file);

  // Check if output directory exists
  if (options.output && !fs.existsSync(outputDir)) {
    console.log('');
    error(`Directory not found: ${outputDir}`);
    console.log('');
    return;
  }

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log('');
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: purple(`${outputPath} already exists. Overwrite?`),
        default: false,
      },
    ]);
    if (!overwrite) {
      warn('Cancelled.');
      console.log('');
      return;
    }
  }

  // Fetch all keys
  const spinner = ora({ text: 'Fetching vault keys...', color: 'magenta' }).start();

  let keys;
  try {
    const data = await apiFetch('/api/keys');
    keys = data.keys || [];
  } catch (err) {
    spinner.fail('Failed to fetch keys');
    error(err.message);
    return;
  }

  spinner.stop();

  if (keys.length === 0) {
    console.log('');
    warn('No keys in your vault. Run `vaulter add <name>` to add one.');
    console.log('');
    return;
  }

  // Interactive checkbox to select keys
  console.log('');
  const { selectedKeys } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedKeys',
      message: purple('Select keys to include in .env:'),
      choices: keys.map((k) => ({
        name: `${k.name} ${dim(`(${k.masked_key})`)}`,
        value: k,
        checked: true,
      })),
    },
  ]);

  if (selectedKeys.length === 0) {
    console.log('');
    warn('No keys selected.');
    console.log('');
    return;
  }

  // Decrypt each selected key
  const decryptSpinner = ora({ text: `Decrypting ${selectedKeys.length} key(s)...`, color: 'magenta' }).start();

  const lines = [];
  let failed = 0;

  for (const key of selectedKeys) {
    try {
      const data = await apiFetch(`/api/keys/${key.id}?decrypt=true`);
      const envName = toEnvVarName(key.name);
      lines.push(`${envName}=${data.decrypted_key}`);
    } catch (err) {
      failed++;
      decryptSpinner.text = `Decrypting... (failed: ${key.name})`;
    }
  }

  decryptSpinner.stop();

  if (lines.length === 0) {
    console.log('');
    error('All keys failed to decrypt.');
    console.log('');
    return;
  }

  // Write .env file with restrictive permissions
  try {
    fs.writeFileSync(outputPath, lines.join('\n') + '\n', { mode: 0o600 });
  } catch (err) {
    error(`Failed to write file: ${err.message}`);
    return;
  }

  console.log('');
  success(`${lines.length} key(s) written to ${outputPath}`);
  if (failed > 0) {
    warn(`${failed} key(s) failed to decrypt.`);
  }
  tip('Run `vaulter save .env` to upload a .env file back to your vault.');
  console.log('');
}
