// postinstall.js - Uses raw ANSI escape codes (no ESM imports needed)
const purple = '\x1b[38;2;146;0;255m';
const purple2 = '\x1b[38;2;122;0;230m';
const purple3 = '\x1b[38;2;102;0;204m';
const purple4 = '\x1b[38;2;94;0;255m';
const reset = '\x1b[0m';

const dim = '\x1b[2m';
const bold = '\x1b[1m';
const white = '\x1b[37m';

console.log('');
console.log(purple + '  ╦  ╦╔═╗╦ ╦╦ ╔╦╗╔═╗╦═╗' + reset);
console.log(purple2 + '  ╚╗╔╝╠═╣║ ║║  ║ ║╣ ╠╦╝' + reset);
console.log(purple3 + '   ╚╝ ╩ ╩╚═╝╩═╝╩ ╚═╝╩╚═' + reset);
console.log(purple4 + '   Your keys. Your vault.' + reset);
console.log('');
console.log(purple + '  COMMANDS' + reset);
console.log('');
console.log('  ' + bold + white + 'vaulter init              ' + reset + dim + 'Initialize current directory as a Vaulter project' + reset);
console.log('  ' + bold + white + 'vaulter sign-in           ' + reset + dim + 'Authenticate with Vaulter via browser' + reset);
console.log('  ' + bold + white + 'vaulter sign-out          ' + reset + dim + 'Sign out and clear saved credentials' + reset);
console.log('  ' + bold + white + 'vaulter ls                ' + reset + dim + 'List all API keys in your vault' + reset);
console.log('  ' + bold + white + 'vaulter add <name>        ' + reset + dim + 'Add a new API key to your vault' + reset);
console.log('  ' + bold + white + 'vaulter remove <name-or-id>' + reset + dim + ' Remove an API key from your vault' + reset);
console.log('  ' + bold + white + 'vaulter web-app           ' + reset + dim + 'Open the Vaulter web app in your browser' + reset);
console.log('  ' + bold + white + 'vaulter help              ' + reset + dim + 'Show all available commands' + reset);
console.log('');
console.log('  Run ' + bold + 'vaulter sign-in' + reset + ' to get started.');
console.log('');
