'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, Link2, PlugZap, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site/site-header';
import SiteFooter from '@/components/site/site-footer';
import SectionHeading from '@/components/site/section-heading';
import CommandPanel from '@/components/site/command-panel';

export default function MpcAccessPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.vaulter.in';
  const endpoint = `${origin}/mcp`;

  const steps = [
    { copy: 'Open `/mcp-access` to copy the setup details you need.', icon: Link2 },
    { copy: 'Connect your MCP-compatible client to the hosted `/mcp` URL.', icon: PlugZap },
    { copy: 'Authenticate in the browser when the client prompts for access.', icon: Shield },
    { copy: 'Reconnect and use vault tools from the client with the right permissions.', icon: RefreshCw },
  ];

  const distinctions = [
    {
      label: 'Human guide',
      value: '`/mcp-access`',
      copy: 'Use this page to understand setup and copy the endpoint your client should connect to.',
    },
    {
      label: 'Actual server endpoint',
      value: '`/mcp`',
      copy: 'This is the URL your MCP client should connect to when you add Vaulter.',
    },
  ];

  const securityCards = [
    {
      title: 'Scoped to your vault',
      copy: 'Clients access the same hosted Vaulter account you already use in the vault after browser approval.',
    },
    {
      title: 'Explicit secret access',
      copy: 'Secrets are only decrypted when the client makes the specific request that needs them.',
    },
    {
      title: 'Public guide, machine endpoint',
      copy: 'Humans navigate `/mcp-access`; tools connect to `/mcp`. The split stays visible across the whole page.',
    },
  ];

  return (
    <div className="vaulter-page">
      <SiteHeader />

      <main>
        <section className="vaulter-section pb-14 md:pb-18">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:px-8">
            <div className="max-w-3xl">
              <p className="vaulter-kicker">MCP setup</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Setup instructions live here. MCP clients connect to `/mcp`.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">
                Connect your MCP client to the Vaulter MCP server.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-purple-300 md:text-lg">
                The MCP endpoint is available at <span className="font-mono text-purple-100">/mcp</span>. This page provides the server URL your MCP-compatible client should connect to.
              </p>

              <div className="mt-10 max-w-2xl">
                <CommandPanel
                  label="Server URL"
                  title="Use this MCP endpoint"
                  description="Every MCP-compatible client should target this URL, not the setup page itself."
                  code={endpoint}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
                  <Link href="/dashboard">
                    Open Vault
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                  <Link href="/cli">View CLI</Link>
                </Button>
              </div>
            </div>

            <div className="vaulter-surface p-7">
              <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Important distinction</p>
              <div className="mt-6 space-y-5">
                {distinctions.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 rounded-[1.25rem] border border-purple-500/10 bg-black/60 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/15 bg-purple-500/10 text-purple-300">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-purple-300">{item.label}</p>
                      <p className="mt-2 text-lg font-medium text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-purple-200">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Setup flow"
              title="A shorter, more obvious sequence from instructions to connected client."
              description="The page prioritizes the main action first, then walks through the setup in a compact flow around the hosted endpoint URL."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.copy} className="vaulter-surface p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-500/15 bg-purple-500/10 text-purple-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-xs uppercase tracking-[0.24em] text-purple-300">Step {index + 1}</p>
                    <p className="mt-4 text-sm leading-7 text-purple-200">{step.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="vaulter-section pt-0">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="vaulter-surface p-7 md:p-8">
              <SectionHeading
                eyebrow="Connection details"
                title="The MCP page now centers on the endpoint itself."
                description="Copy the server URL, connect with your MCP-compatible client, then complete the browser authentication flow when prompted."
              />

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
                  <Link href="/dashboard">Open Vault</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                  <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                    MCP Docs
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="vaulter-subtle-surface p-7 md:p-8">
              <p className="vaulter-kicker">Connection details</p>
              <h3 className="mt-4 text-3xl font-semibold text-white">The MCP page now centers on the endpoint itself.</h3>
              <div className="mt-8 space-y-4">
                {securityCards.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-purple-500/10 bg-black/45 p-5">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-purple-300" />
                      <p className="text-lg font-medium text-white">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-purple-200">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
