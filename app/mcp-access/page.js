import MpcAccessPage from '@/components/mcp/mcp-access-page';

export const metadata = {
  title: 'MCP Access | Vaulter',
  description: 'Set up Vaulter with MCP clients and use the hosted MCP server endpoint at /mcp.'
};

export default function Page() {
  return <MpcAccessPage />;
}
