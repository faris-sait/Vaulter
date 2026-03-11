'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  Check,
  Command,
  Copy,
  ExternalLink,
  Monitor,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function ClientCard({ client, copiedKey, onCopy }) {
  const Icon = client.icon;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-black/20 border border-white/10 p-4 hover:bg-black/30 transition-all">
      <Icon className="w-8 h-8 text-purple-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium">{client.name}</h3>
        <pre className="font-mono text-sm text-purple-200 mt-1 whitespace-pre-wrap break-all">{client.command}</pre>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCopy(client.command, client.id)}
        className="border-white/20 bg-white/5 text-white hover:bg-white/10 shrink-0"
      >
        {copiedKey === client.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export default function MpcAccessPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vaulter-nine.vercel.app';
  const endpoint = `${origin}/mcp`;

  const clients = useMemo(() => ([
    {
      id: 'claude-code',
      name: 'Claude Code',
      command: `claude mcp add --transport http --scope user vaulter ${endpoint}`,
      icon: Terminal,
    },
    {
      id: 'copilot-cli',
      name: 'GitHub Copilot CLI',
      command: '/mcp add',
      icon: Command,
    },
    {
      id: 'vscode',
      name: 'VS Code / Copilot Chat',
      command: 'MCP: Add Server',
      icon: Monitor,
    },
    {
      id: 'cursor',
      name: 'Cursor',
      command: 'Settings → Tools & MCP → Add remote server',
      icon: Bot,
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      command: 'opencode mcp auth vaulter',
      icon: Sparkles,
    },
  ]), [endpoint]);

  const copyText = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? '' : current)), 1800);
    toast({ title: 'Copied', description: 'Saved to your clipboard.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col">
      <div className="max-w-3xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to vault
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Image
            src="/assets/vaulter-logo.svg"
            alt="Vaulter Logo"
            width={48}
            height={48}
            className="vaulter-logo-spin"
          />
          <h1 className="text-4xl font-bold text-white tracking-tight">MCP Access</h1>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-purple-200 text-sm">
            Signed in as {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
          </span>
        </div>

        {/* Endpoint */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-purple-200 text-sm font-medium">Hosted Endpoint</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(endpoint, 'endpoint')}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                {copied === 'endpoint' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied === 'endpoint' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="font-mono text-lg text-white break-all">{endpoint}</pre>
            <p className="text-purple-300 text-sm mt-3">
              Use this endpoint in any MCP client. Auth happens automatically via browser sign-in.
            </p>
          </Card>
        </motion.div>

        {/* Client list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add to your client</h2>
            <div className="space-y-3">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <ClientCard client={client} copiedKey={copied} onCopy={copyText} />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Docs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                MCP Docs
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <a href="https://code.claude.com/docs/claude-code/mcp" target="_blank" rel="noreferrer">
                Claude Code Docs
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
