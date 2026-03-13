import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SignUp } from '@clerk/nextjs';

export const metadata = {
  title: 'Sign Up | Vaulter',
  description: 'Create your Vaulter account.'
};

export default function SignUpPage() {
  return (
    <div className="vaulter-page flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-purple-200 transition-colors hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex flex-col items-center justify-center py-10">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/assets/vaulter-logo.svg" alt="Vaulter Logo" width={56} height={56} className="vaulter-logo-spin" />
            <div>
              <h1 className="font-display text-5xl font-bold tracking-[-0.06em] text-white">Vaulter</h1>
              <p className="text-purple-200">Create your secure vault account</p>
            </div>
          </div>

          <div className="w-full max-w-md rounded-[1.75rem] border border-purple-500/12 bg-[rgba(7,7,11,0.96)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl="/dashboard"
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
                  card: 'bg-transparent shadow-none',
                  rootBox: 'w-full',
                  formButtonPrimary: 'rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-fuchsia-500 text-white',
                  footerActionLink: 'text-purple-300 hover:text-white',
                  formFieldInput: 'rounded-xl border-purple-500/10 bg-black/80 text-white',
                  formFieldLabel: 'text-purple-200',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-purple-300',
                  socialButtonsBlockButton: 'rounded-xl border-purple-500/12 bg-transparent text-white hover:bg-white/[0.03]',
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
