import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/cli', label: 'CLI' },
  { href: '/mcp-access', label: 'MCP Access' },
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
];

export default function SiteHeader({ ctaHref = '/dashboard', ctaLabel = 'Open Vault' }) {
  return (
    <header className="sticky top-0 z-40 border-b border-purple-500/10 bg-[rgba(4,4,6,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/16 bg-purple-500/10">
            <Image src="/assets/vaulter-logo.svg" alt="Vaulter Logo" width={30} height={30} className="vaulter-logo-spin" />
          </div>
          <div>
            <p className="font-display text-[1.8rem] font-bold leading-none tracking-[-0.06em]">Vaulter</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-base text-purple-200/80 transition-colors hover:bg-white/[0.03] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="hidden rounded-xl border-purple-500/14 bg-transparent px-5 text-purple-200 hover:bg-white/[0.03] hover:text-white md:inline-flex">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild className="rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 px-6 text-white hover:from-purple-600 hover:to-fuchsia-500">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
