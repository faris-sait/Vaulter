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
  Globe,
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
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 hover:bg-white/15 transition-all h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-purple-200 text-sm">{client.mode}</p>
          <h3 className="text-2xl font-semibold text-white mt-1">{client.name}</h3>
        </div>
        <Icon className="w-10 h-10 text-purple-400 shrink-0" />
      </div>

      <div className="bg-black/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-purple-200 text-sm">{client.label}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(client.copyValue, client.id)}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            {copiedKey === client.id ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copiedKey === client.id ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <pre className="font-mono text-sm text-purple-100 whitespace-pre-wrap break-words">
          {client.primary}
        </pre>
      </div>

      <div className="space-y-2 text-sm text-purple-100">
        {client.steps.map((step) => (
          <p key={step}>{step}</p>
        ))}
      </div>
    </Card>
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
      mode: 'Terminal',
      label: 'Add Command',
      primary: `claude mcp add --transport http --scope user vaulter ${endpoint}`,
      copyValue: `claude mcp add --transport http --scope user vaulter ${endpoint}`,
      steps: [
        'Then run `/mcp` inside Claude Code.',
        'Pick `vaulter` and finish browser authentication when prompted.',
      ],
      icon: Terminal,
    },
    {
      id: 'copilot-cli',
      name: 'GitHub Copilot CLI',
      mode: 'Interactive CLI',
      label: 'Command',
      primary: '/mcp add',
      copyValue: '/mcp add',
      steps: [
        'Set Server Name to `vaulter`.',
        'Choose `HTTP`, then paste the hosted endpoint shown on this page.',
        'Save, then use the server and complete browser auth when Copilot prompts you.',
      ],
      icon: Command,
    },
    {
      id: 'vscode',
      name: 'VS Code / Copilot Chat',
      mode: 'Command Palette',
      label: 'Command Palette Action',
      primary: 'MCP: Add Server',
      copyValue: 'MCP: Add Server',
      steps: [
        'Choose `Global` or `Workspace`.',
        'Name the server `vaulter`, choose `HTTP`, and enter the hosted endpoint.',
        'Open chat in Agent mode and authenticate in the browser when asked.',
      ],
      icon: Monitor,
    },
    {
      id: 'cursor',
      name: 'Cursor',
      mode: 'Settings',
      label: 'Open This Section',
      primary: 'Tools & MCP',
      copyValue: 'Tools & MCP',
      steps: [
        'Open Cursor Settings, then go to `Tools & MCP`.',
        'Add a remote MCP server named `vaulter` and use the hosted endpoint.',
        'Finish browser auth when Cursor redirects you to Vaulter.',
      ],
      icon: Bot,
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      mode: 'Auth Command',
      label: 'Authenticate Command',
      primary: 'opencode mcp auth vaulter',
      copyValue: 'opencode mcp auth vaulter',
      steps: [
        'Add a remote MCP server named `vaulter` in OpenCode.',
        'Then run this command to trigger the browser-based OAuth flow.',
        'OpenCode will store the resulting auth automatically for later sessions.',
      ],
      icon: Sparkles,
    },
  ]), [endpoint]);

  const copyText = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? '' : current)), 1800);
    toast({
      title: 'Copied',
      description: 'Saved to your clipboard.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex flex-col">
      <div className="max-w-7xl mx-auto mb-8 w-full">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-5">
              <ArrowLeft className="w-4 h-4" />
              Back to vault
            </Link>
            <div className="flex items-center gap-1 mb-2">
              <Image
                src="/assets/vaulter-logo.svg"
                alt="Vaulter Logo"
                width={90}
                height={90}
                className="vaulter-logo-spin"
              />
              <div>
                <h1 className="text-5xl font-bold text-white tracking-tight">MCP Access</h1>
                <p className="text-purple-200 text-lg font-medium mt-2">OAuth is live. Use the right add command for your client.</p>
              </div>
            </div>
            <p className="text-purple-300 max-w-3xl">
              Vaulter no longer needs manual token setup for the main flow. Use the hosted MCP endpoint with browser OAuth, then add the server using the command or command-palette action for your client below.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 self-start">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-purple-100 text-sm font-medium">
              Signed in as {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-sm">Supported Clients</p>
                  <p className="text-3xl font-bold text-white mt-1">5</p>
                </div>
                <Bot className="w-12 h-12 text-purple-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-sm">Authentication</p>
                  <p className="text-3xl font-bold text-white mt-1">OAuth</p>
                </div>
                <Shield className="w-12 h-12 text-blue-400" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-sm">Transport</p>
                  <p className="text-3xl font-bold text-white mt-1">HTTP</p>
                </div>
                <Globe className="w-12 h-12 text-green-400" />
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 h-full">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Hosted endpoint</h2>
                  <p className="text-purple-200 mt-2">Use this exact endpoint in every MCP client listed here.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyText(endpoint, 'endpoint')}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  {copied === 'endpoint' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied === 'endpoint' ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="rounded-xl bg-black/30 p-4 mb-6">
                <pre className="font-mono text-sm text-purple-100 break-all whitespace-pre-wrap">{endpoint}</pre>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white font-medium">How auth works now</p>
                  <p className="text-sm text-purple-200 mt-2">Add the server, use it once, then Vaulter redirects you to browser sign-in and approval automatically.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white font-medium">No manual token copy</p>
                  <p className="text-sm text-purple-200 mt-2">This page now focuses on add commands and client actions instead of fallback token generation or JSON config snippets.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-white font-medium">Docs</p>
                  <div className="flex flex-wrap gap-3 mt-3">
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
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 h-full">
              <h2 className="text-2xl font-semibold text-white mb-2">Add Vaulter to your client</h2>
              <p className="text-purple-200 mb-6">Use the matching command or action below, then complete browser auth when your client prompts you.</p>

              <div className="grid grid-cols-1 gap-5">
                {clients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                  >
                    <ClientCard client={client} copiedKey={copied} onCopy={copyText} />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <h2 className="text-2xl font-semibold text-white mb-3">Compatibility note</h2>
            <p className="text-purple-200">
              GitHub Copilot coding agent on GitHub.com currently does not support remote OAuth MCP servers. Use Claude Code, GitHub Copilot CLI, VS Code, Cursor, or OpenCode for the hosted Vaulter OAuth flow.
            </p>
          </Card>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto mt-auto pt-12 w-full">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 text-sm font-medium">Hosted MCP access secured by Vaulter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
