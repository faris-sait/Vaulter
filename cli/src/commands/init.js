import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import {
  isInitialized,
  getProjectConfig,
  createDefaultConfig,
  writeProjectConfig,
  getProjectDirPath,
} from '../lib/project.js';
import { isAuthenticated } from '../lib/auth.js';
import { success, error, warn, tip, dim, purple, bold, white } from '../lib/ui.js';

export async function initProject(options = {}) {
  const root = process.cwd();
  const dirName = path.basename(root);
  const yes = options.yes || false;

  console.log('');

  // Check if already initialized
  if (isInitialized(root)) {
    const existing = getProjectConfig(root);

    if (existing) {
      console.log(dim(`  Existing project: ${bold(existing.project?.name || 'unknown')}`));
      console.log(dim(`  Created: ${existing.project?.createdAt || 'unknown'}`));
      console.log('');
    }

    if (!yes) {
      const { reinit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reinit',
          message: purple('.vaulter/ already exists. Re-initialize?'),
          default: false,
        },
      ]);
      if (!reinit) {
        warn('Cancelled.');
        console.log('');
        return;
      }
    }
  }

  // Prompt for project name
  let projectName = options.name || null;

  if (!projectName && !yes) {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: purple('Project name:'),
        default: dirName,
      },
    ]);
    projectName = name;
  }

  if (!projectName) {
    projectName = dirName;
  }

  // Create config
  const config = createDefaultConfig(projectName);

  try {
    writeProjectConfig(root, config);
  } catch (err) {
    error(`Failed to create .vaulter/config.json: ${err.message}`);
    console.log('');
    return;
  }

  success(`Initialized Vaulter project "${projectName}"`);

  // Append .vaulter/ to .gitignore if it exists and doesn't already contain it
  const gitignorePath = path.join(root, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.includes('.vaulter/')) {
        fs.appendFileSync(gitignorePath, '\n.vaulter/\n');
        success('Added .vaulter/ to .gitignore');
      }
    } catch {
      warn('Could not update .gitignore (non-fatal)');
    }
  }

  // .env tips based on state
  const envPath = path.join(root, '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    tip('Run `vaulter save` to upload your .env to the vault, or `vaulter make` to regenerate it.');
  } else if (isAuthenticated()) {
    console.log('');
    const { generate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'generate',
        message: purple('No .env found. Generate one from your vault?'),
        default: true,
      },
    ]);
    if (generate) {
      const { makeEnv } = await import('./make.js');
      await makeEnv(undefined, {});
    }
  } else {
    tip('Run `vaulter sign-in` to connect your vault, then `vaulter make` to generate a .env.');
  }

  console.log('');
}
