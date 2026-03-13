import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Command,
  KeyRound,
  Lock,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Upload,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/site/site-header';
import LandingFooter from '@/components/site/landing-footer';
import SectionHeading from '@/components/site/section-heading';
import CommandPanel from '@/components/site/command-panel';

export const metadata = {
  title: 'Vaulter | Secure API Key Vault',
  description: 'Store, organize, and access API keys securely with Vaulter across the vault, CLI, and MCP clients.'
};

const trustItems = ['Encrypted vault', 'CLI access', 'MCP endpoint', 'Browser auth', '.env import'];

const stats = [
  { value: 'AES-256', label: 'Encryption for every stored key and secret in your vault.' },
  { value: 'CLI + MCP', label: 'Access secrets through the web app, command line, and MCP clients.' },
  { value: '.env import', label: 'Bring existing environments into Vaulter without rebuilding your workflow.' },
];

const features = [
  {
    title: 'Encrypted vault storage',
    description: 'Store, reveal, tag, and organize API keys in one secure place without losing readability.',
    icon: Lock,
  },
  {
    title: 'Built for developer workflows',
    description: 'Move from the vault to the CLI and back again with the same account, data, and permissions.',
    icon: Terminal,
  },
  {
    title: 'Hosted MCP access',
    description: 'Guide people through setup at `/mcp-access` while agents and clients connect to `/mcp`.',
    icon: Sparkles,
  },
  {
    title: '.env import and bulk setup',
    description: 'Bring secrets into Vaulter faster instead of recreating every key manually.',
    icon: Upload,
  },
  {
    title: 'Searchable, tagged secrets',
    description: 'Find the right key quickly by name, tag, or context instead of scrolling through clutter.',
    icon: Search,
  },
  {
    title: 'Clear access paths',
    description: 'Use the vault for management, the CLI for local work, and MCP Access for agent setup.',
    icon: Workflow,
  },
];

const steps = [
  {
    step: '01',
    title: 'Open your vault',
    copy: 'Sign in and keep your secrets in one Vaulter workspace instead of spreading them across tools.',
  },
  {
    step: '02',
    title: 'Import or add secrets',
    copy: 'Create keys manually or import your existing `.env` data into the same secure vault.',
  },
  {
    step: '03',
    title: 'Access through CLI or MCP',
    copy: 'Use the CLI for local workflows or connect MCP-compatible tools through the hosted endpoint.',
  },
  {
    step: '04',
    title: 'Manage from one source of truth',
    copy: 'Search, organize, and reuse secrets through the same product without changing routes or flows.',
  },
];

const previewBullets = [
  'Search keys quickly by name or tag',
  'Keep masked secrets readable without exposing them by default',
  'Move between Vault, CLI, and MCP Access without changing the core workflow',
  'Import and organize secrets with less friction',
];

const previewRows = [
  { name: 'OPENAI_API_KEY', tag: 'ai · prod', masked: 'sk-••••••Zd8F', tone: 'bg-purple-500/10' },
  { name: 'STRIPE_SECRET_KEY', tag: 'billing · prod', masked: 'sk_live_••••••', tone: 'bg-fuchsia-500/10' },
  { name: 'DATABASE_URL', tag: 'infra · prod', masked: 'postgres://••••', tone: 'bg-violet-500/10' },
  { name: 'SENDGRID_API_KEY', tag: 'email · prod', masked: 'SG.••••••••', tone: 'bg-indigo-500/10' },
];

const aboutProblemLines = [
  'API keys unlock services.',
  'Tokens authenticate machines.',
  'Credentials move data.',
  'Environment variables quietly power entire systems.',
];

const aboutRealityLines = [
  'A forgotten .env file.',
  'A Slack message from six months ago.',
  'A note someone pasted into a private repo.',
  'Or worse - a production key sitting in plain text.',
];

const securityPoints = [
  'Unique encryption per user and credential',
  'Each API key isolated with its own encryption key',
  'Only encrypted data (ciphertext) stored in the database',
  'Decryption only happens when an authorized request needs the key',
  'No global key, so compromise impact stays isolated',
];

const securityFlows = [
  {
    label: 'Storage flow',
    value: 'Plaintext -> Encrypt -> Ciphertext stored',
  },
  {
    label: 'Usage flow',
    value: 'Ciphertext -> Decrypt -> Temporary plaintext use',
  },
];

export default function HomePage() {
  return (
    <div className="vaulter-page">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-20 md:pb-24 md:pt-24 lg:px-8">
          <div className="vaulter-hero-grid absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute left-1/2 top-28 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18)_0%,transparent_68%)]" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/[0.08] px-4 py-2 text-xs font-medium tracking-[0.22em] text-purple-300">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              Now with CLI and MCP access
            </div>

            <h1 className="mt-8 max-w-5xl text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-[78px] lg:leading-[0.98]">
              One vault.<br />
              Every secret.<br />
              Every workflow.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">
              Vaulter gives your team one secure home for API keys, CLI workflows, and MCP-compatible tools without changing how the product already works.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-7 text-white hover:from-purple-600 hover:to-fuchsia-500">
                <Link href="/dashboard">
                  Open Vault
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-purple-500/20 bg-black/20 px-7 text-purple-200 hover:bg-purple-500/10 hover:text-white">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>

            <div className="mt-10 w-full max-w-2xl">
              <CommandPanel
                label="Quick start"
                title="Use the CLI in seconds"
                description="Install once, then connect your local workflow to the same Vaulter vault."
                code="npm install -g vaulter"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-purple-500/10 bg-purple-500/[0.03] px-6 py-5 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-purple-200">
            <span className="text-purple-300 uppercase tracking-[0.2em]">Built for secure teams</span>
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-purple-500/10 overflow-hidden">
            <div className="grid gap-px bg-purple-500/10 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.value} className="bg-black/60 p-8 md:p-10">
                  <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{stat.value}</p>
                  <p className="mt-3 max-w-xs text-sm leading-7 text-purple-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="vaulter-section border-t border-purple-500/10" id="features">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="Features"
              title="Everything your team needs to manage secrets safely and keep moving."
              description="All current Vaulter capabilities remain the same. This redesign simply gives them a clearer structure and a more readable presentation."
            />

            <div className="mt-12 overflow-hidden rounded-3xl border border-purple-500/10 bg-purple-500/[0.03]">
              <div className="grid gap-px bg-purple-500/10 md:grid-cols-2 xl:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="bg-black/70 p-7 transition-colors hover:bg-zinc-950">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-500/15 bg-purple-500/10 text-purple-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-purple-200">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="vaulter-section border-t border-purple-500/10 pt-16" id="how-it-works">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="How it works"
              title="Set up your vault and start using it across web, CLI, and MCP in minutes."
              description="The flow stays the same as the current product, but the structure now makes each step easier to understand at a glance."
            />

            <div className="relative mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/[0.08] text-xs font-medium tracking-[0.25em] text-purple-300">
                    {item.step}
                  </div>
                  <p className="mt-5 text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-purple-200">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="vaulter-section border-t border-purple-500/10 pt-16">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
            <div>
              <SectionHeading
                eyebrow="Your vault"
                title="The Vaulter workspace your team can actually navigate."
                description="Search, tag, import, and access secrets without losing clarity. The feature set stays the same; the presentation becomes easier to scan."
              />

              <div className="mt-8 space-y-4">
                {previewBullets.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/[0.08] text-purple-300">
                      <Check className="h-3 w-3" />
                    </div>
                    <p className="text-sm leading-7 text-purple-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-purple-500/15 bg-black/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 border-b border-purple-500/10 bg-purple-500/[0.04] px-5 py-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <span className="ml-3 text-xs tracking-[0.22em] text-purple-300">vaulter vault</span>
              </div>

              <div className="p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-purple-500/10 bg-zinc-950 p-3 text-sm text-purple-300">
                  <Search className="h-4 w-4" />
                  Search secrets...
                </div>

                <div className="space-y-2">
                  {previewRows.map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-purple-500/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${row.tone} text-purple-200`}>
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{row.name}</p>
                          <p className="text-xs text-purple-300">{row.tag}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-purple-300">{row.masked}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="vaulter-section border-t border-purple-500/10" id="about">
          <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="vaulter-kicker">About Us</p>
              <h2 className="mt-5 font-display text-5xl font-bold tracking-[-0.06em] text-white md:text-7xl md:leading-[0.98]">
                About Vaulter
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">
                Built for teams that want secrets management to feel secure, operational, and easy to trust.
              </p>
            </div>

            <div className="mt-16 space-y-16">
              <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                <div>
                  <p className="vaulter-kicker">The Problem</p>
                  <h3 className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl md:leading-[0.98]">
                    Every modern company runs on secrets.
                  </h3>
                </div>

                <div className="vaulter-grid-frame">
                  <div className="grid gap-px bg-purple-500/10 sm:grid-cols-2">
                    {aboutProblemLines.map((line) => (
                      <div key={line} className="vaulter-grid-cell p-6 md:p-7">
                        <p className="text-base leading-8 text-purple-100 md:text-lg">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
                <div>
                  <p className="vaulter-kicker">The Reality</p>
                  <h3 className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white md:text-5xl md:leading-[1.02]">
                    Yet most of the time... those secrets live in the worst places possible.
                  </h3>
                </div>

                <div className="space-y-3">
                  {aboutRealityLines.map((line) => (
                    <div key={line} className="vaulter-subtle-surface px-6 py-5">
                      <p className="text-base leading-8 text-purple-100 md:text-lg">{line}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="vaulter-surface px-8 py-10 text-center md:px-10 md:py-12">
                <p className="font-display text-4xl font-bold tracking-[-0.06em] text-purple-100 md:text-6xl">
                  We thought that was ridiculous.
                </p>
                <p className="mt-5 font-display text-5xl font-bold tracking-[-0.06em] text-white md:text-7xl md:leading-none">
                  So we built Vaulter.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="vaulter-surface p-8 md:p-10">
                  <p className="vaulter-kicker">What Vaulter Is</p>
                  <div className="mt-6 space-y-5 text-base leading-8 text-purple-100 md:text-lg">
                    <p>
                      Vaulter is a secure vault designed for the way modern teams actually work - fast, distributed,
                      automated, and constantly evolving.
                    </p>
                    <p>
                      Instead of scattering secrets across tools and machines, Vaulter gives teams a single place to
                      store, access, and manage them safely.
                    </p>
                  </div>
                </div>

                <div className="vaulter-subtle-surface p-8 md:p-10">
                  <p className="vaulter-kicker">Philosophy</p>
                  <p className="mt-6 font-display text-3xl font-bold tracking-[-0.05em] text-white md:text-4xl md:leading-tight">
                    But we didn't just want another security tool.
                  </p>
                  <p className="mt-5 font-display text-3xl font-bold tracking-[-0.05em] text-purple-100 md:text-4xl md:leading-tight">
                    We wanted something developers would actually enjoy using.
                  </p>
                  <p className="mt-6 text-base leading-8 text-purple-100 md:text-lg">
                    That's why Vaulter is CLI-first, automation-friendly, and designed to fit naturally into real
                    workflows - whether you're deploying infrastructure, running CI pipelines, or connecting services.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div>
                  <p className="vaulter-kicker">Security</p>
                  <h3 className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white md:text-5xl md:leading-[1.02]">
                    How Vaulter Secures Your API Keys
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="vaulter-surface p-7 md:p-8">
                    <div className="space-y-4">
                      {securityPoints.map((point) => (
                        <div key={point} className="flex items-start gap-3">
                          <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/[0.08] text-purple-300">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-sm leading-7 text-purple-100 md:text-base">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {securityFlows.map((flow) => (
                      <div key={flow.label} className="vaulter-subtle-surface p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-purple-300">{flow.label}</p>
                        <p className="mt-3 font-mono text-sm leading-7 text-purple-100">{flow.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-w-4xl">
                <p className="vaulter-kicker">Closing Statement</p>
                <p className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl md:leading-[0.98]">
                  Security shouldn't feel like friction.
                </p>
                <p className="mt-3 font-display text-4xl font-bold tracking-[-0.06em] text-purple-100 md:text-6xl md:leading-[0.98]">
                  It should feel like infrastructure.
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-purple-100 md:text-lg">
                  Vaulter exists to make secrets management simple, powerful, and invisible - the way it should have
                  been from the start.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-purple-500/10 px-6 py-20 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,rgba(168,85,247,0.14)_0%,transparent_72%)]" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Stop scattering secrets across tools.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-200">
              Keep everything in Vaulter, access it through the vault, the CLI, or MCP-compatible clients, and make the product easier to navigate from the first screen.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-7 text-white hover:from-purple-600 hover:to-fuchsia-500">
                <Link href="/dashboard">Open Vault</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-purple-500/20 bg-black/20 px-7 text-purple-200 hover:bg-purple-500/10 hover:text-white">
                <Link href="/cli">View CLI</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
