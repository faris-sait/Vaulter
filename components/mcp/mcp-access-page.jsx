'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Bot, Braces, Cloud, Command, ExternalLink, FileCode, Hexagon, Monitor, Shield, Sparkles, SquareTerminal, Terminal, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site/site-header';
import SiteFooter from '@/components/site/site-footer';
import SectionHeading from '@/components/site/section-heading';
import CommandPanel from '@/components/site/command-panel';

function ClientGroup({ title, items }) {
  return (
    <div className="vaulter-surface p-6">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((client) => {
          const Icon = client.icon;
          return (
            <div key={client.id} className="rounded-2xl border border-purple-500/10 bg-black/45 p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/10 p-3 text-purple-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-medium text-white">{client.name}</p>
                  <div className="mt-2">
                    <CommandPanel code={client.command} dense />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MpcAccessPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.vaulter.in';
  const endpoint = `${origin}/mcp`;
  const opencodeCommand = 'opencode mcp add --transport http vaulter https://www.vaulter.in/mcp';

  const clientGroups = useMemo(
    () => [
      {
        title: 'CLI tools',
        items: [
          { id: 'claude-code', name: 'Claude Code', command: `claude mcp add --transport http --scope user vaulter ${endpoint}`, icon: Terminal },
          { id: 'gemini-cli', name: 'Gemini CLI', command: `gemini mcp add --transport http vaulter ${endpoint}`, icon: Hexagon },
          { id: 'codex-cli', name: 'Codex CLI', command: `codex mcp add --transport http vaulter ${endpoint}`, icon: FileCode },
          { id: 'opencode', name: 'OpenCode', command: opencodeCommand, icon: Sparkles },
          { id: 'copilot-cli', name: 'GitHub Copilot CLI', command: `gh copilot mcp add --transport http vaulter ${endpoint}`, icon: Command },
        ],
      },
      {
        title: 'Editors and AI IDEs',
        items: [
          { id: 'cursor', name: 'Cursor', command: `{ "mcpServers": { "vaulter": { "url": "${endpoint}" } } }`, icon: Bot },
          { id: 'vscode', name: 'VS Code / Copilot Chat', command: `{ "servers": { "vaulter": { "type": "http", "url": "${endpoint}" } } }`, icon: Monitor },
          { id: 'windsurf', name: 'Windsurf', command: `{ "mcpServers": { "vaulter": { "serverUrl": "${endpoint}" } } }`, icon: Wind },
          { id: 'jetbrains', name: 'JetBrains AI', command: `{ "mcpServers": { "vaulter": { "url": "${endpoint}" } } }`, icon: Braces },
        ],
      },
      {
        title: 'Other MCP clients',
        items: [
          { id: 'cline', name: 'Cline', command: `{ "mcpServers": { "vaulter": { "url": "${endpoint}", "type": "streamableHttp" } } }`, icon: SquareTerminal },
          { id: 'warp', name: 'Warp', command: `{ "mcpServers": { "vaulter": { "url": "${endpoint}" } } }`, icon: SquareTerminal },
          { id: 'amazon-q', name: 'Amazon Q', command: `{ "mcpServers": { "vaulter": { "type": "http", "url": "${endpoint}" } } }`, icon: Cloud },
        ],
      },
    ],
    [endpoint, opencodeCommand]
  );

  const steps = [
    'Open `/mcp-access` to copy the setup details you need.',
    'Add Vaulter to your MCP-compatible client using the hosted `/mcp` URL.',
    'Authenticate in the browser when the client prompts for access.',
    'Reconnect and use vault tools from the client with the right permissions.',
  ];

  return (
    <div className="vaulter-page">
      <SiteHeader />

      <main>
        <section className="vaulter-section pb-10 md:pb-12">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:px-8">
            <div className="max-w-3xl">
              <p className="vaulter-kicker">MCP setup</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Setup instructions live here. MCP clients connect to `/mcp`.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">
                Connect your MCP client to the Vaulter MCP server.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-purple-300 md:text-lg">
                The MCP endpoint is available at <span className="font-mono text-purple-100">/mcp</span>. This page provides setup instructions, the server URL, and example commands for MCP-compatible clients.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
                  <Link href="/dashboard">Open Vault</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                  <Link href="/cli">View CLI</Link>
                </Button>
              </div>
            </div>

            <div className="vaulter-surface p-6 md:p-7">
              <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Important distinction</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-purple-500/10 bg-black/45 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-purple-300">Human guide</p>
                  <p className="mt-2 text-2xl font-semibold text-white">`/mcp-access`</p>
                  <p className="mt-2 text-sm leading-6 text-purple-200">Use this page to understand setup, copy commands, and choose a client configuration.</p>
                </div>
                <div className="rounded-2xl border border-purple-500/10 bg-black/45 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-purple-300">Actual server endpoint</p>
                  <p className="mt-2 text-2xl font-semibold text-white">`/mcp`</p>
                  <p className="mt-2 text-sm leading-6 text-purple-200">This is the URL your MCP client should connect to when you add Vaulter.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto w-full max-w-4xl px-6 lg:px-8">
            <CommandPanel
              label="Server URL"
              title="Use this MCP endpoint"
              description="Every MCP-compatible client should target this URL, not the setup page itself."
              code={endpoint}
            />
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Setup flow"
              title="A shorter, more obvious sequence from instructions to connected client."
              description="The page prioritizes the main action first, then walks through the setup in a compact flow before listing client-specific configs."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="vaulter-subtle-surface p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Step {index + 1}</p>
                  <p className="mt-4 text-sm leading-7 text-purple-100">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-3 lg:px-8">
            <div className="vaulter-subtle-surface p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-300" />
                <p className="text-lg font-medium text-white">Scoped to your vault</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-purple-200">Clients access the same hosted Vaulter account you already use in the vault after browser approval.</p>
            </div>
            <div className="vaulter-subtle-surface p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-300" />
                <p className="text-lg font-medium text-white">Explicit secret access</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-purple-200">Secrets are only decrypted when the client makes the specific request that needs them.</p>
            </div>
            <div className="vaulter-subtle-surface p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-300" />
                <p className="text-lg font-medium text-white">Public guide, machine endpoint</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-purple-200">Humans navigate `/mcp-access`; tools connect to `/mcp`. The split stays visible across the whole page.</p>
            </div>
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Client configurations"
              title="Grouped configs instead of one long command wall."
              description="Clients are separated by context so you can find the right setup faster and copy fewer irrelevant commands."
            />

            <div className="mt-8 space-y-4">
              {clientGroups.map((group) => (
                <ClientGroup key={group.title} title={group.title} items={group.items} />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
                <Link href="/dashboard">Open Vault</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                  <Link href="/cli">View CLI</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                  MCP Docs
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
