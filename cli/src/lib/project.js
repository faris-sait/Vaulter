import fs from 'fs';
import path from 'path';

const VAULTER_PROJECT_DIR = '.vaulter';
const CONFIG_FILE = 'config.json';

export function getProjectDirPath(root = process.cwd()) {
  return path.join(root, VAULTER_PROJECT_DIR);
}

export function getConfigFilePath(root = process.cwd()) {
  return path.join(root, VAULTER_PROJECT_DIR, CONFIG_FILE);
}

export function isInitialized(root = process.cwd()) {
  return fs.existsSync(getConfigFilePath(root));
}

export function getProjectConfig(root = process.cwd()) {
  try {
    const data = JSON.parse(fs.readFileSync(getConfigFilePath(root), 'utf-8'));
    return data;
  } catch {
    return null;
  }
}

export function ensureProjectDir(root = process.cwd()) {
  const dirPath = getProjectDirPath(root);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { mode: 0o700 });
  }
}

export function createDefaultConfig(name) {
  const now = new Date().toISOString();
  return {
    version: 1,
    project: {
      name,
      createdAt: now,
      updatedAt: now,
    },
    sync: { enabled: false, remote: null },
    env: { autoGenerate: false, filename: '.env', selectedKeys: [] },
  };
}

export function writeProjectConfig(root, config) {
  ensureProjectDir(root);
  fs.writeFileSync(
    getConfigFilePath(root),
    JSON.stringify(config, null, 2) + '\n',
    { mode: 0o600 }
  );
}
