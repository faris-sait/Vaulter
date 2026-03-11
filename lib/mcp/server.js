import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createKeyForUser,
  decryptKeyRecord,
  deleteKeyForUser,
  listKeysForUser,
} from '../server/vaulter-keys.js';

function normalizeTags(tags = []) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function toEnvVarName(name) {
  return name
    .replace(/[\s\-.]+/g, '_')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function resolveSelection(keys, { names, all }) {
  if (all === true && Array.isArray(names) && names.length > 0) {
    throw new Error('Pass either `names` or `all: true`, not both.');
  }

  if (all === true) {
    return keys.map((key) => ({
      requested: key.name,
      key,
    }));
  }

  if (!Array.isArray(names) || names.length === 0) {
    throw new Error('Provide `names` or set `all: true`.');
  }

  return names.map((requested) => ({
    requested,
    key: keys.find((key) => key.name.toLowerCase() === requested.toLowerCase()) || null,
  }));
}

function toPublicKeyMetadata(key) {
  return {
    id: key.id,
    name: key.name,
    maskedKey: key.masked_key,
    tags: Array.isArray(key.tags) ? key.tags : [],
    createdAt: key.created_at || null,
    lastUsed: key.last_used || null,
    usageCount: typeof key.usage_count === 'number' ? key.usage_count : 0,
  };
}

function resolveRemoval(keys, identifier) {
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
  return {
    status: 'matched',
    matchType: target.name.toLowerCase() === identifier.toLowerCase() ? 'exact_name' : 'id_prefix',
    target,
  };
}

function countStatuses(items) {
  return {
    okCount: items.filter((item) => item.status === 'ok').length,
    missingCount: items.filter((item) => item.status === 'missing').length,
    failedCount: items.filter((item) => item.status === 'decrypt_failed').length,
  };
}

function buildEnvArtifacts(entries) {
  const env = {};
  const lines = [];
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
  }

  const collisions = [];
  for (const [envName, sourceNames] of occurrenceMap.entries()) {
    if (sourceNames.length > 1) {
      collisions.push({
        envName,
        sourceNames: [...new Set(sourceNames)],
      });
    }
  }

  return {
    env,
    dotenv: lines.length > 0 ? `${lines.join('\n')}\n` : '',
    collisions,
  };
}

function jsonToolResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

export function createVaulterMcpServer({ userId }) {
  const server = new McpServer({
    name: 'vaulter',
    version: '0.2.0',
  });

  server.registerTool(
    'vaulter_list_keys',
    {
      description: 'List masked Vaulter keys without decrypting them',
      inputSchema: {},
    },
    async () => {
      const keys = await listKeysForUser(userId);
      const items = keys.map(toPublicKeyMetadata);
      return jsonToolResult({ items, count: items.length });
    }
  );

  server.registerTool(
    'vaulter_view_keys',
    {
      description: 'Decrypt one or more Vaulter keys by exact name, similar to vaulter view',
      inputSchema: {
        names: z.array(z.string()).optional().describe('Exact key names to decrypt, matched case-insensitively'),
        all: z.boolean().optional().describe('Decrypt every key in the vault when set to true'),
      },
    },
    async ({ names, all }) => {
      const keys = await listKeysForUser(userId);
      const requests = resolveSelection(keys, { names, all });
      const items = [];

      for (const request of requests) {
        if (!request.key) {
          items.push({ requested: request.requested, status: 'missing' });
          continue;
        }

        try {
          items.push({
            requested: request.requested,
            status: 'ok',
            keyId: request.key.id,
            name: request.key.name,
            value: decryptKeyRecord(request.key),
          });
        } catch (error) {
          items.push({
            requested: request.requested,
            status: 'decrypt_failed',
            keyId: request.key.id,
            name: request.key.name,
            error: error.message,
          });
        }
      }

      return jsonToolResult({
        items,
        ...countStatuses(items),
      });
    }
  );

  server.registerTool(
    'vaulter_add_key',
    {
      description: 'Add a new API key to Vaulter',
      inputSchema: {
        name: z.string().min(1).describe('Name of the key to store'),
        apiKey: z.string().min(1).describe('Plaintext API key value to encrypt and store'),
        tags: z.array(z.string()).optional().describe('Optional tags for the key'),
      },
    },
    async ({ name, apiKey, tags }) => {
      const created = await createKeyForUser(userId, {
        name,
        apiKey,
        tags: normalizeTags(tags || []),
      });

      return jsonToolResult({
        status: 'created',
        item: toPublicKeyMetadata(created),
      });
    }
  );

  server.registerTool(
    'vaulter_remove_key',
    {
      description: 'Remove a Vaulter key by exact name or UUID prefix, similar to vaulter remove',
      inputSchema: {
        identifier: z.string().min(1).describe('Exact key name or UUID prefix'),
        confirm: z.boolean().optional().describe('Set to true to confirm deletion when a single match is found'),
      },
    },
    async ({ identifier, confirm }) => {
      const keys = await listKeysForUser(userId);
      const resolution = resolveRemoval(keys, identifier);

      if (resolution.status === 'not_found' || resolution.status === 'ambiguous') {
        return jsonToolResult(resolution);
      }

      if (confirm !== true) {
        return jsonToolResult({
          status: 'confirmation_required',
          identifier,
          matchType: resolution.matchType,
          item: toPublicKeyMetadata(resolution.target),
        });
      }

      await deleteKeyForUser(userId, resolution.target.id);

      return jsonToolResult({
        status: 'deleted',
        matchType: resolution.matchType,
        item: toPublicKeyMetadata(resolution.target),
      });
    }
  );

  server.registerTool(
    'vaulter_get_env_map',
    {
      description: 'Decrypt selected keys and return both env object and dotenv content, similar to vaulter make',
      inputSchema: {
        names: z.array(z.string()).optional().describe('Exact key names to export, matched case-insensitively'),
        all: z.boolean().optional().describe('Export every key in the vault when set to true'),
      },
    },
    async ({ names, all }) => {
      const keys = await listKeysForUser(userId);
      const requests = resolveSelection(keys, { names, all });
      const entries = [];

      for (const request of requests) {
        if (!request.key) {
          entries.push({ requested: request.requested, status: 'missing' });
          continue;
        }

        const envName = toEnvVarName(request.key.name);

        try {
          entries.push({
            requested: request.requested,
            status: 'ok',
            keyId: request.key.id,
            sourceName: request.key.name,
            envName,
            value: decryptKeyRecord(request.key),
          });
        } catch (error) {
          entries.push({
            requested: request.requested,
            status: 'decrypt_failed',
            keyId: request.key.id,
            sourceName: request.key.name,
            envName,
            error: error.message,
          });
        }
      }

      return jsonToolResult({
        entries,
        ...buildEnvArtifacts(entries),
        ...countStatuses(entries),
      });
    }
  );

  return server;
}
