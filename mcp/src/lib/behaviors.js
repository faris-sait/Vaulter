import { toPublicKeyMetadata } from './vault-client.js';

export function normalizeTags(tags = []) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

export function toEnvVarName(name) {
  return name
    .replace(/[\s\-.]+/g, '_')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function hasExplicitNames(names) {
  return Array.isArray(names) && names.length > 0;
}

export function resolveSelection(keys, { names, all }) {
  if (all === true && hasExplicitNames(names)) {
    throw new Error('Pass either `names` or `all: true`, not both.');
  }

  if (all === true) {
    return keys.map((key) => ({
      requested: key.name,
      key,
    }));
  }

  if (!hasExplicitNames(names)) {
    throw new Error('Provide `names` or set `all: true`.');
  }

  return names.map((requested) => ({
    requested,
    key: keys.find((key) => key.name.toLowerCase() === requested.toLowerCase()) || null,
  }));
}

export function resolveRemoval(keys, identifier) {
  const matches = keys.filter(
    (key) =>
      key.name.toLowerCase() === identifier.toLowerCase() ||
      key.id.startsWith(identifier)
  );

  if (matches.length === 0) {
    return {
      status: 'not_found',
      identifier,
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      identifier,
      candidates: matches.map(toPublicKeyMetadata),
    };
  }

  const target = matches[0];
  const matchType = target.name.toLowerCase() === identifier.toLowerCase()
    ? 'exact_name'
    : 'id_prefix';

  return {
    status: 'matched',
    matchType,
    target,
  };
}

export function countStatuses(items) {
  return {
    okCount: items.filter((item) => item.status === 'ok').length,
    missingCount: items.filter((item) => item.status === 'missing').length,
    failedCount: items.filter((item) => item.status === 'decrypt_failed').length,
  };
}

export function buildEnvArtifacts(entries) {
  const env = {};
  const lines = [];
  const collisionMap = new Map();
  const occurrenceMap = new Map();

  for (const entry of entries) {
    if (entry.status !== 'ok') {
      continue;
    }

    env[entry.envName] = entry.value;
    lines.push(`${entry.envName}=${entry.value}`);

    const seen = occurrenceMap.get(entry.envName) || [];
    seen.push(entry.sourceName);
    occurrenceMap.set(entry.envName, seen);

    const sources = collisionMap.get(entry.envName) || new Set();
    sources.add(entry.sourceName);
    collisionMap.set(entry.envName, sources);
  }

  const collisions = [];
  for (const [envName, sources] of collisionMap.entries()) {
    const occurrences = occurrenceMap.get(envName) || [];
    if (occurrences.length > 1) {
      collisions.push({
        envName,
        sourceNames: [...sources],
      });
    }
  }

  return {
    env,
    dotenv: lines.length > 0 ? `${lines.join('\n')}\n` : '',
    collisions,
  };
}
