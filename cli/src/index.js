#!/usr/bin/env node

import { Command } from 'commander';
import { signIn } from './commands/sign-in.js';
import { listKeys } from './commands/ls.js';
import { addKey } from './commands/add.js';
import { removeKey } from './commands/remove.js';
import { openWebApp } from './commands/web-app.js';
import { showHelp } from './commands/help.js';
import { printLogo } from './assets/logo.js';
import { isAuthenticated } from './lib/auth.js';
import { error } from './lib/ui.js';

const program = new Command();

program
  .name('vaulter')
  .description('Vaulter CLI - Secure API Key Manager')
  .version('0.1.0')
  .action(async () => {
    await showHelp();
  });

program
  .command('sign-in')
  .description('Authenticate with Vaulter via browser')
  .action(signIn);

program
  .command('ls')
  .description('List all API keys in your vault')
  .action(async () => {
    if (!isAuthenticated()) {
      error('Not authenticated. Run `vaulter sign-in` first.');
      process.exit(1);
    }
    await listKeys();
  });

program
  .command('add <name>')
  .description('Add a new API key to your vault')
  .action(async (name) => {
    if (!isAuthenticated()) {
      error('Not authenticated. Run `vaulter sign-in` first.');
      process.exit(1);
    }
    await addKey(name);
  });

program
  .command('remove <name-or-id>')
  .description('Remove an API key from your vault')
  .action(async (nameOrId) => {
    if (!isAuthenticated()) {
      error('Not authenticated. Run `vaulter sign-in` first.');
      process.exit(1);
    }
    await removeKey(nameOrId);
  });

program
  .command('web-app')
  .description('Open the Vaulter web app in your browser')
  .action(openWebApp);

program
  .command('help')
  .description('Show all available commands')
  .action(async () => {
    await showHelp();
  });

program.parse();
