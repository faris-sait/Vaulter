import Table from 'cli-table3';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api.js';
import { purple, dim, error, tip } from '../lib/ui.js';

export async function listKeys() {
  const spinner = ora({ text: 'Fetching keys...', color: 'magenta' }).start();

  try {
    const data = await apiFetch('/api/keys');
    const keys = data.keys || [];

    spinner.stop();

    if (keys.length === 0) {
      console.log('');
      console.log(dim('  No keys found. Run `vaulter add <name>` to add one.'));
      console.log('');
      return;
    }

    const table = new Table({
      head: [
        purple.bold('Name'),
        purple.bold('Masked Key'),
        purple.bold('Tags'),
        purple.bold('Created'),
        purple.bold('Usage'),
      ],
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

    for (const key of keys) {
      const tags = (key.tags || []).join(', ') || dim('none');
      const created = new Date(key.created_at).toLocaleDateString();
      const usageCount = key.usage_count || 0;
      const usage = usageCount > 0 ? dim(`${usageCount}x`) : dim('—');

      table.push([
        chalk.white(key.name),
        chalk.hex('#a78bfa')(key.masked_key),
        dim(tags),
        dim(created),
        usage,
      ]);
    }

    console.log('');
    console.log(table.toString());
    console.log('');
    const label = keys.length === 1 ? '1 key in your vault' : `${keys.length} keys in your vault`;
    console.log(dim(`  ${label}`));
    tip('Run `vaulter make .env` to export keys to a .env file.');
    console.log('');
  } catch (err) {
    spinner.fail('Failed to fetch keys');
    error(err.message);
  }
}
