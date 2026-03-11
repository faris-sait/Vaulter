import { z } from 'zod';
import { countStatuses, resolveSelection } from '../lib/behaviors.js';
import { jsonResult } from '../lib/response.js';
import { decryptVaultKey, listVaultKeys } from '../lib/vault-client.js';

export function registerViewKeysTool(server) {
  server.registerTool(
    'vaulter_view_keys',
    {
      description: 'Decrypt one or more Vaulter keys by exact name, similar to `vaulter view`',
      inputSchema: {
        names: z.array(z.string()).optional().describe('Exact key names to decrypt, matched case-insensitively'),
        all: z.boolean().optional().describe('Decrypt every key in the vault when set to true'),
      },
    },
    async ({ names, all }) => {
      const keys = await listVaultKeys();
      const requests = resolveSelection(keys, { names, all });
      const items = [];

      for (const request of requests) {
        if (!request.key) {
          items.push({
            requested: request.requested,
            status: 'missing',
          });
          continue;
        }

        try {
          const value = await decryptVaultKey(request.key.id);
          items.push({
            requested: request.requested,
            status: 'ok',
            keyId: request.key.id,
            name: request.key.name,
            value,
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

      return jsonResult({
        items,
        ...countStatuses(items),
      });
    }
  );
}
