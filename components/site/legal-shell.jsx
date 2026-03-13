import SiteHeader from '@/components/site/site-header';
import SiteFooter from '@/components/site/site-footer';

export default function LegalShell({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="vaulter-page">
      <SiteHeader />

      <main>
        <section className="border-b border-purple-500/10 px-6 py-16 md:py-20 lg:px-8">
          <div className="mx-auto w-full max-w-[1160px]">
            <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-purple-300">Legal</p>
            <h1 className="mt-5 font-display text-5xl font-bold tracking-[-0.06em] text-white md:text-7xl md:leading-[0.98]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-200 md:text-xl">{subtitle}</p>
            <p className="mt-6 text-sm text-purple-300">Last updated: {lastUpdated}</p>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto w-full max-w-[960px] space-y-12">{children}</div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
