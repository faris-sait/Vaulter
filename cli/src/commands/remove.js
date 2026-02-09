import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { apiFetch } from '../lib/api.js';
import { success, error, warn, purple, dim } from '../lib/ui.js';

export async function removeKey(nameOrId) {
  const spinner = ora({ text: 'Looking up key...', color: 'magenta' }).start();

  let keys;
  try {
    const data = await apiFetch('/api/keys');
    keys = data.keys || [];
  } catch (err) {
    spinner.fail('Failed to fetch keys');
    error(err.message);
    return;
  }

  // Match by name (case-insensitive) or UUID prefix
  const matches = keys.filter(
    (k) =>
      k.name.toLowerCase() === nameOrId.toLowerCase() ||
      k.id.startsWith(nameOrId)
  );

  spinner.stop();

  if (matches.length === 0) {
    console.log('');
    warn(`No key found matching "${nameOrId}".`);
    console.log('');
    return;
  }

  let target;

  if (matches.length === 1) {
    target = matches[0];
  } else {
    console.log('');
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'key',
        message: purple('Multiple keys found. Select one:'),
        choices: matches.map((k) => ({
          name: `${k.name} ${dim(`(${k.masked_key})`)}`,
          value: k,
        })),
      },
    ]);
    target = answer.key;
  }

  console.log('');
  console.log(`  ${chalk.white.bold(target.name)}`);
  console.log(`  ${dim(target.masked_key)}`);
  console.log(`  ${dim(`Created: ${new Date(target.created_at).toLocaleDateString()}`)}`);
  console.log('');

  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'yes',
      message: chalk.red('Delete this key? This cannot be undone.'),
      default: false,
    },
  ]);

  if (!confirm.yes) {
    warn('Cancelled.');
    return;
  }

  const deleteSpinner = ora({ text: 'Deleting...', color: 'magenta' }).start();

  try {
    await apiFetch(`/api/keys/${target.id}`, { method: 'DELETE' });
    deleteSpinner.succeed('Key deleted!');
    console.log('');
    success(`"${target.name}" has been removed from your vault.`);
    console.log('');
  } catch (err) {
    deleteSpinner.fail('Failed to delete key');
    error(err.message);
  }
}
