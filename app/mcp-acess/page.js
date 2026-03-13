import { redirect } from 'next/navigation';

export default function LegacyMisspelledMcpAccessPage() {
  redirect('/mcp-access');
}
