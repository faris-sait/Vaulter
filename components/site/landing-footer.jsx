import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

const services = [
  'Zero-knowledge encryption',
  'Built for developers',
  'CLI, MCP & .env access',
];

const company = [{ label: 'About us', href: '/#about' }];

const legal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
];

function FooterColumn({ heading, children }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-purple-300">{heading}</p>
      <div className="mt-5 space-y-3 text-base text-purple-100">{children}</div>
    </div>
  );
}

export default function LandingFooter() {
  return (
    <footer className="border-t border-purple-500/10 bg-[rgba(3,3,5,0.96)]">
      <div className="mx-auto w-full max-w-[1160px] px-6 py-16 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-purple-300">Contact</p>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/12 bg-purple-500/[0.05] text-purple-300">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-purple-300">Email</p>
                  <a href="mailto:support@vaulter.in" className="mt-1 block font-display text-2xl font-bold tracking-[-0.05em] text-white hover:text-purple-200">
                    support@vaulter.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/12 bg-purple-500/[0.05] text-purple-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-purple-300">Location</p>
                  <p className="mt-1 text-lg text-white">Bengaluru</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <FooterColumn heading="Services">
              {services.map((item) => (
                <p key={item} className="leading-7 text-purple-100">
                  {item}
                </p>
              ))}
            </FooterColumn>

            <FooterColumn heading="Company">
              {company.map((item) => (
                <Link key={item.href} href={item.href} className="block leading-7 text-purple-100 transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
            </FooterColumn>

            <FooterColumn heading="Legal">
              {legal.map((item) => (
                <Link key={item.href} href={item.href} className="block leading-7 text-purple-100 transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
            </FooterColumn>
          </div>
        </div>

        <div className="mt-14 border-t border-purple-500/10 pt-6">
          <p className="text-sm text-purple-300">© 2026 Vaulter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
