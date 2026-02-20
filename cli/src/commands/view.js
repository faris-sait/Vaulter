import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { apiFetch } from '../lib/api.js';
import { purple, dim, error, warn, green } from '../lib/ui.js';

const DIVIDER_WIDTH = 60;
const divider = chalk.dim('─'.repeat(DIVIDER_WIDTH));

function printKeyCard(name, value, index, total) {
  const label = purple.bold(name);
  const counter = chalk.dim(`[${index + 1}/${total}]`);
  console.log(`  ${label}  ${counter}`);
  console.log(`  ${divider}`);
  console.log(`  ${chalk.hex('#a78bfa')(value)}`);
  console.log('');
}

export async function viewKeys(names) {
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

  let selected;

  if (names.length === 0) {
    console.log('');
    const { selectedKeys } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedKeys',
        message: purple('Select keys to view:'),
        choices: keys.map((k) => ({
          name: `${k.name} ${dim(`(${k.masked_key})`)}`,
          value: k,
          checked: false,
        })),
      },
    ]);

    if (selectedKeys.length === 0) {
      console.log('');
      warn('No keys selected.');
      console.log('');
      return;
    }

    selected = selectedKeys;
  } else {
    selected = [];
    for (const name of names) {
      const match = keys.find((k) => k.name.toLowerCase() === name.toLowerCase());
      if (!match) {
        warn(`No key found matching "${name}".`);
      } else {
        selected.push(match);
      }
    }

    if (selected.length === 0) {
      console.log('');
      return;
    }
  }

  // Decrypt each selected key
  const decryptSpinner = ora({ text: `Decrypting ${selected.length} key(s)...`, color: 'magenta' }).start();

  const rows = [];
  for (const key of selected) {
    try {
      const data = await apiFetch(`/api/keys/${key.id}?decrypt=true`);
      rows.push({ name: key.name, value: data.decrypted_key });
    } catch (err) {
      rows.push({ name: key.name, value: null });
    }
  }

  decryptSpinner.stop();

  // Display cards
  console.log('');
  console.log(`  ${chalk.dim('━'.repeat(DIVIDER_WIDTH))}`);
  console.log('');

  for (let i = 0; i < rows.length; i++) {
    const { name, value } = rows[i];
    if (value === null) {
      printKeyCard(name, chalk.dim('(failed to decrypt)'), i, rows.length);
    } else {
      printKeyCard(name, value, i, rows.length);
    }
  }

  console.log(`  ${chalk.dim('━'.repeat(DIVIDER_WIDTH))}`);
  console.log('');
  console.log(`  ${chalk.yellow('⚠')}  ${chalk.yellow.bold('These values are sensitive.')} ${chalk.dim('Clear your terminal when done.')}`);
  console.log(`  ${chalk.dim('💡 Tip: Select a key below to copy it to your clipboard.')}`);
  console.log('');

  // Clipboard copy loop
  const copyableRows = rows.filter((r) => r.value !== null);
  if (copyableRows.length === 0) return;

  let copying = true;
  while (copying) {
    const { toCopy } = await inquirer.prompt([
      {
        type: 'list',
        name: 'toCopy',
        message: purple('Copy a key to clipboard:'),
        choices: [
          ...copyableRows.map((r) => ({
            name: `${chalk.white(r.name)}  ${chalk.dim(r.value.slice(0, 24) + (r.value.length > 24 ? '...' : ''))}`,
            value: r,
          })),
          new inquirer.Separator(),
          { name: chalk.dim('Done'), value: null },
        ],
      },
    ]);

    if (toCopy === null) {
      copying = false;
    } else {
      try {
        await clipboardy.write(toCopy.value);
        console.log(`  ${green('✔')} ${chalk.white(toCopy.name)} copied to clipboard.`);
        console.log('');
      } catch {
        warn('Could not access clipboard. Copy the value manually from above.');
        console.log('');
      }
    }
  }

  console.log('');
}
