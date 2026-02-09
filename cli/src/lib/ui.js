import chalk from 'chalk';

export const purple = chalk.hex('#9200ff');
export const deepPurple = chalk.hex('#5e00ff');
export const dim = chalk.dim;
export const bold = chalk.bold;
export const white = chalk.white;
export const red = chalk.red;
export const green = chalk.green;
export const yellow = chalk.yellow;
export const cyan = chalk.cyan;

export function success(msg) {
  console.log(green('  ' + msg));
}

export function error(msg) {
  console.log(red('  ' + msg));
}

export function info(msg) {
  console.log(purple('  ' + msg));
}

export function warn(msg) {
  console.log(yellow('  ' + msg));
}
