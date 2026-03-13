import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SignIn } from '@clerk/nextjs';

export const metadata = {
  title: 'Sign In | Vaulter',
  description: 'Sign in to access your Vaulter vault.'
};

export default function SignInPage() {
  return (
    <div className="vaulter-page flex min-h-screen flex-col px-4 py-5 sm:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 self-start text-purple-200 transition-colors hover:text-white sm:mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center py-4 sm:py-10">
          <div className="mb-6 flex w-full max-w-md flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
            <Image src="/assets/vaulter-logo.svg" alt="Vaulter Logo" width={56} height={56} />
            <div>
              <h1 className="font-display text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">Vaulter</h1>
              <p className="text-base text-purple-200 sm:text-lg">Secure access to your vault</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[1.75rem] border border-purple-500/12 bg-[rgba(7,7,11,0.96)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-4">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              afterSignInUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary: '#7c3aed',
                  colorBackground: '#0f172a',
                  colorInputBackground: 'rgba(255,255,255,0.08)',
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#c4b5fd',
                  colorNeutral: '#1e293b',
                  borderRadius: '0.75rem'
                },
                elements: {
                  cardBox: 'w-full max-w-none',
                  card: 'w-full border-0 bg-transparent shadow-none',
                  main: 'w-full',
                  header: 'px-0 text-center',
                  rootBox: 'w-full',
                  formButtonPrimary: 'rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-fuchsia-500 text-white',
                  formFieldRow: 'w-full',
                  footerActionLink: 'text-purple-300 hover:text-white',
                  footer: 'px-0 pb-0',
                  footerAction: 'justify-center',
                  formFieldInput: 'rounded-xl border-purple-500/10 bg-black/80 text-white',
                  formFieldLabel: 'text-purple-200',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-purple-300',
                  socialButtonsBlockButton: 'w-full justify-center rounded-xl border-purple-500/12 bg-transparent px-3 text-white hover:bg-white/[0.03]',
                  socialButtonsBlockButtonText: 'text-white'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
