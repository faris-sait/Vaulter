import { z } from 'zod';
import {
  buildEnvArtifacts,
  countStatuses,
  resolveSelection,
  toEnvVarName,
} from '../lib/behaviors.js';
import { jsonResult } from '../lib/response.js';
import { decryptVaultKey, listVaultKeys } from '../lib/vault-client.js';

export function registerGetEnvMapTool(server) {
  server.registerTool(
    'vaulter_get_env_map',
    {
      description: 'Decrypt selected keys and return both env object and dotenv content, similar to `vaulter make`',
      inputSchema: {
        names: z.array(z.string()).optional().describe('Exact key names to export, matched case-insensitively'),
        all: z.boolean().optional().describe('Export every key in the vault when set to true'),
      },
    },
    async ({ names, all }) => {
      const keys = await listVaultKeys();
      const requests = resolveSelection(keys, { names, all });
      const entries = [];

      for (const request of requests) {
        if (!request.key) {
          entries.push({
            requested: request.requested,
            status: 'missing',
          });
          continue;
        }

        const envName = toEnvVarName(request.key.name);

        try {
          const value = await decryptVaultKey(request.key.id);
          entries.push({
            requested: request.requested,
            status: 'ok',
            keyId: request.key.id,
            sourceName: request.key.name,
            envName,
            value,
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

      const artifacts = buildEnvArtifacts(entries);

      return jsonResult({
        entries,
        ...artifacts,
        ...countStatuses(entries),
      });
    }
  );
}
