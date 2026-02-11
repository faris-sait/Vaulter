import { printLogo } from '../assets/logo.js';
import { isAuthenticated } from '../lib/auth.js';
import { purple, dim, bold, white, green, yellow } from '../lib/ui.js';

export async function showHelp() {
  await printLogo();

  const status = isAuthenticated()
    ? green('  Signed in')
    : yellow('  Not signed in') + dim(' — run `vaulter sign-in`');

  console.log(status);
  console.log('');

  console.log(purple.bold('  COMMANDS'));
  console.log('');

  const commands = [
    { name: 'init',                desc: 'Initialize current directory as a Vaulter project' },
    { name: 'sign-in',             desc: 'Authenticate with Vaulter via browser' },
    { name: 'sign-out',            desc: 'Sign out and clear saved credentials' },
    { name: 'ls',                  desc: 'List all API keys in your vault' },
    { name: 'add <name>',          desc: 'Add a new API key to your vault' },
    { name: 'remove <name-or-id>', desc: 'Remove an API key from your vault' },
    { name: 'make [file]',         desc: 'Generate a .env file from your vault keys' },
    { name: 'save [file]',         desc: 'Upload a local .env file to your vault' },
    { name: 'web-app',             desc: 'Open the Vaulter web app in your browser' },
    { name: 'help',                desc: 'Show this help message' },
  ];

  for (const cmd of commands) {
    const padded = cmd.name.padEnd(22);
    console.log(`  ${white.bold(padded)} ${dim(cmd.desc)}`);
  }

  console.log('');
  console.log(purple.bold('  OPTIONS'));
  console.log('');
  console.log(`  ${white.bold('-V, --version'.padEnd(22))} ${dim('Output the version number')}`);
  console.log(`  ${white.bold('-h, --help'.padEnd(22))} ${dim('Display help for a command')}`);
  console.log('');
  console.log(dim('  https://vaulter-nine.vercel.app'));
  console.log('');
}
