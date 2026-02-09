// postinstall.js - Uses raw ANSI escape codes (no ESM imports needed)
const purple = '\x1b[38;2;146;0;255m';
const purple2 = '\x1b[38;2;122;0;230m';
const purple3 = '\x1b[38;2;102;0;204m';
const purple4 = '\x1b[38;2;94;0;255m';
const reset = '\x1b[0m';

console.log('');
console.log(purple + '  ╦  ╦╔═╗╦ ╦╦ ╔╦╗╔═╗╦═╗' + reset);
console.log(purple2 + '  ╚╗╔╝╠═╣║ ║║  ║ ║╣ ╠╦╝' + reset);
console.log(purple3 + '   ╚╝ ╩ ╩╚═╝╩═╝╩ ╚═╝╩╚═' + reset);
console.log(purple4 + '   Your keys. Your vault.' + reset);
console.log('');
console.log('  Run \x1b[1mvaulter sign-in\x1b[0m to get started.');
console.log('');
