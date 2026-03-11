import { listVaultKeys, toPublicKeyMetadata } from '../lib/vault-client.js';
import { jsonResult } from '../lib/response.js';

export function registerListKeysTool(server) {
  server.registerTool(
    'vaulter_list_keys',
    {
      description: 'List masked Vaulter keys without decrypting them',
      inputSchema: {},
    },
    async () => {
      const keys = await listVaultKeys();
      const items = keys.map(toPublicKeyMetadata);

      return jsonResult({
        items,
        count: items.length,
      });
    }
  );
}
