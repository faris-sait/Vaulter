'use client';

import Link from 'next/link';
import { ArrowRight, KeyRound, Shield, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site/site-header';
import SiteFooter from '@/components/site/site-footer';
import SectionHeading from '@/components/site/section-heading';
import CommandPanel from '@/components/site/command-panel';

const installCommand = 'npm install -g vaulter';
const loginCommand = 'vaulter sign-in';

const commandGroups = [
  {
    title: 'Start here',
    description: 'Get Vaulter installed, authenticate once, and connect your terminal to the same Vaulter vault you use on the web.',
    commands: [
      { label: 'Install', code: installCommand },
      { label: 'Authenticate', code: loginCommand },
    ],
  },
  {
    title: 'Core operations',
    description: 'List, add, inspect, and assemble env output with small, readable commands.',
    commands: [
      { label: 'List secrets', code: 'vaulter list' },
      { label: 'Add a key', code: 'vaulter add OPENAI_API_KEY sk-... --tag production' },
      { label: 'View a key', code: 'vaulter view OPENAI_API_KEY' },
      { label: 'Generate env output', code: 'vaulter make OPENAI_API_KEY ANTHROPIC_API_KEY' },
    ],
  },
];

const steps = [
  { title: 'Install', copy: 'Add the CLI once and keep it available for local workflows.', icon: Terminal },
  { title: 'Sign in', copy: 'Use browser auth to connect the CLI to your Vaulter account.', icon: Shield },
  { title: 'Run commands', copy: 'Read from the same hosted vault you manage in Vaulter.', icon: KeyRound },
];

const workflow = [
  'vaulter sign-in',
  'vaulter add STRIPE_SECRET_KEY sk_live_... --tag billing',
  'vaulter make STRIPE_SECRET_KEY > .env.local',
];

const troubleshooting = [
  {
    title: 'Not authenticated',
    copy: 'Run `vaulter sign-in` again and complete the browser flow using the same account you use in Vaulter.',
  },
  {
    title: 'Expired session',
    copy: 'Refresh local credentials through browser sign-in, then rerun the command that failed.',
  },
  {
    title: 'Wrong API target',
    copy: 'Confirm the CLI points to the correct hosted Vaulter environment before generating output.',
  },
];

export default function CliPage() {
  return (
    <div className="vaulter-page">
      <SiteHeader />

      <main>
        <section className="vaulter-section pb-14 md:pb-18">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:px-8">
            <div className="max-w-3xl">
              <p className="vaulter-kicker">Command-line workflows</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Use Vaulter from the terminal with less friction and clearer next steps.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">
                The CLI is designed for developers who want a clean path: install, sign in, run commands, and move back to shipping.
              </p>

              <div className="mt-10 max-w-2xl">
                <CommandPanel
                  label="Install"
                  title="Install the CLI"
                  description="Start with one global install command, then authenticate in the browser."
                  code={installCommand}
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
                  <Link href="/mcp-access">View MCP Access</Link>
                </Button>
              </div>
            </div>

            <div className="vaulter-surface p-7">
              <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Quick path</p>
              <div className="mt-6 space-y-5">
                {steps.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4 rounded-[1.25rem] border border-purple-500/10 bg-black/60 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/15 bg-purple-500/10 text-purple-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-purple-300">Step {index + 1}</p>
                        <p className="mt-2 text-lg font-medium text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-purple-200">{item.copy}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-purple-500/10 bg-purple-500/[0.03] py-5">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-6 gap-y-3 px-6 text-sm text-purple-200 lg:px-8">
            <a href="#install" className="hover:text-white">Install</a>
            <a href="#commands" className="hover:text-white">Common commands</a>
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <a href="#troubleshooting" className="hover:text-white">Troubleshooting</a>
          </div>
        </section>

        <section id="install" className="vaulter-section">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Get started"
              title="A short setup sequence that stays obvious from the first screen."
              description="Inspired by cleaner command-first product pages, the CLI flow now foregrounds the install and sign-in actions before everything else."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <CommandPanel
                label="Step 1"
                title="Install Vaulter"
                description="Make the CLI available globally so you can call it from any repo or shell session."
                code={installCommand}
              />
              <CommandPanel
                label="Step 2"
                title="Authenticate in the browser"
                description="Connect the CLI to your hosted Vaulter account once, then reuse the session for future commands."
                code={loginCommand}
              />
            </div>
          </div>
        </section>

        <section id="commands" className="vaulter-section pt-0">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Common commands"
              title="Command groups that are easier to scan and easier to remember."
              description="Instead of a crowded docs wall, the page groups the most useful commands by what you are trying to do next."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {commandGroups.map((group) => (
                <div key={group.title} className="vaulter-surface p-7">
                  <h3 className="text-2xl font-semibold text-white">{group.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-purple-200">{group.description}</p>
                  <div className="mt-6 space-y-4">
                    {group.commands.map((command) => (
                      <CommandPanel key={command.code} label={command.label} code={command.code} dense />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="vaulter-section pt-0">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="vaulter-surface p-7 md:p-8">
              <SectionHeading
                eyebrow="Typical workflow"
                title="Install, authenticate, store, and generate output in one compact loop."
                description="This section makes the first useful developer journey obvious without surrounding it with too many competing blocks."
              />
              <div className="mt-8 space-y-4">
                {workflow.map((command, index) => (
                  <CommandPanel key={command} label={`Step ${index + 1}`} code={command} dense />
                ))}
              </div>
            </div>

            <div id="troubleshooting" className="vaulter-subtle-surface p-7 md:p-8">
              <p className="vaulter-kicker">Troubleshooting</p>
              <h3 className="mt-4 text-3xl font-semibold text-white">Clear answers when something breaks.</h3>
              <div className="mt-8 space-y-4">
                {troubleshooting.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-purple-500/10 bg-black/45 p-5">
                    <p className="text-lg font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-purple-200">{item.copy}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
                  <Link href="/dashboard">Open Vault</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-purple-500/14 bg-transparent px-6 text-white hover:bg-white/[0.03]">
                  <Link href="/mcp-access">View MCP Access</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
