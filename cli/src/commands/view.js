import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import chalk from 'chalk';
import { apiFetch } from '../lib/api.js';
import { purple, dim, error, warn } from '../lib/ui.js';

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
    // Interactive checkbox selection
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
    // Match provided names case-insensitively
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
      rows.push([chalk.white(key.name), chalk.hex('#a78bfa')(data.decrypted_key)]);
    } catch (err) {
      rows.push([chalk.white(key.name), dim('(failed to decrypt)')]);
    }
  }

  decryptSpinner.stop();

  const table = new Table({
    head: [purple.bold('Name'), purple.bold('Decrypted Value')],
    style: {
      head: [],
      border: ['dim'],
    },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
  });

  for (const row of rows) {
    table.push(row);
  }

  console.log('');
  console.log(table.toString());
  console.log('');
  console.log(dim('  These values are sensitive. Clear your terminal when done.'));
  console.log('');
}
