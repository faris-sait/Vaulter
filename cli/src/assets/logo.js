import chalk from 'chalk';

const purple1 = chalk.hex('#9200ff');
const purple2 = chalk.hex('#7a00e6');
const purple3 = chalk.hex('#6600cc');
const purple4 = chalk.hex('#5e00ff');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeLine(text, colorFn, charDelay = 18) {
  for (let i = 0; i <= text.length; i++) {
    const partial = colorFn(text.slice(0, i));
    // Clear line fully then write partial
    process.stdout.write(`\x1b[2K\r${partial}`);
    await sleep(charDelay);
  }
  process.stdout.write('\n');
}

export async function printLogo() {
  console.log('');
  await typeLine('  ╦  ╦╔═╗╦ ╦╦ ╔╦╗╔═╗╦═╗', purple1, 18);
  await typeLine('  ╚╗╔╝╠═╣║ ║║  ║ ║╣ ╠╦╝', purple2, 18);
  await typeLine('   ╚╝ ╩ ╩╚═╝╩═╝╩ ╚═╝╩╚═', purple3, 18);
  await sleep(80);
  await typeLine('   Your keys. Your vault.', purple4, 30);
  console.log('');
}
