import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Vault' },
  { href: '/cli', label: 'CLI' },
  { href: '/mcp-access', label: 'MCP Access' },
  { href: '/sign-in', label: 'Sign In' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-purple-500/10">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-display text-2xl font-bold tracking-[-0.05em] text-white">Vaulter</p>
          <p className="mt-2 text-sm text-purple-300">Secure key workflows across the vault, CLI, and MCP access.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-purple-300/90 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
