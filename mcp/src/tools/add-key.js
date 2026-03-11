import { z } from 'zod';
import { normalizeTags } from '../lib/behaviors.js';
import { jsonResult } from '../lib/response.js';
import { createVaultKey, toPublicKeyMetadata } from '../lib/vault-client.js';

export function registerAddKeyTool(server) {
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
      const created = await createVaultKey({
        name,
        apiKey,
        tags: normalizeTags(tags || []),
      });

      return jsonResult({
        status: 'created',
        item: toPublicKeyMetadata(created),
      });
    }
  );
}
