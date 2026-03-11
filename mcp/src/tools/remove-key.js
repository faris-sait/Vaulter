import { z } from 'zod';
import { resolveRemoval } from '../lib/behaviors.js';
import { jsonResult } from '../lib/response.js';
import { deleteVaultKey, listVaultKeys, toPublicKeyMetadata } from '../lib/vault-client.js';

export function registerRemoveKeyTool(server) {
  server.registerTool(
    'vaulter_remove_key',
    {
      description: 'Remove a Vaulter key by exact name or UUID prefix, similar to `vaulter remove`',
      inputSchema: {
        identifier: z.string().min(1).describe('Exact key name or UUID prefix'),
        confirm: z.boolean().optional().describe('Set to true to confirm deletion when a single match is found'),
      },
    },
    async ({ identifier, confirm }) => {
      const keys = await listVaultKeys();
      const resolution = resolveRemoval(keys, identifier);

      if (resolution.status === 'not_found' || resolution.status === 'ambiguous') {
        return jsonResult(resolution);
      }

      if (confirm !== true) {
        return jsonResult({
          status: 'confirmation_required',
          identifier,
          matchType: resolution.matchType,
          item: toPublicKeyMetadata(resolution.target),
        });
      }

      await deleteVaultKey(resolution.target.id);

      return jsonResult({
        status: 'deleted',
        matchType: resolution.matchType,
        item: toPublicKeyMetadata(resolution.target),
      });
    }
  );
}
