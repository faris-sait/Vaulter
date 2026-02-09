import inquirer from 'inquirer';
import ora from 'ora';
import { apiFetch } from '../lib/api.js';
import { success, error, info, purple } from '../lib/ui.js';

export async function addKey(name) {
  console.log('');
  info(`Adding key: ${name}`);
  console.log('');

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: purple('API Key:'),
      mask: '*',
      validate: (input) => input.length > 0 || 'API key cannot be empty',
    },
    {
      type: 'input',
      name: 'tags',
      message: purple('Tags (comma-separated, optional):'),
    },
  ]);

  const tags = answers.tags
    ? answers.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const spinner = ora({ text: 'Encrypting and saving...', color: 'magenta' }).start();

  try {
    await apiFetch('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name, apiKey: answers.apiKey, tags }),
    });

    spinner.succeed('Key added to vault!');
    console.log('');
    success(`"${name}" has been securely stored.`);
    console.log('');
  } catch (err) {
    spinner.fail('Failed to add key');
    error(err.message);
  }
}
