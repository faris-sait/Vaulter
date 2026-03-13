import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Syne, Space_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });
const displayFont = Syne({ subsets: ['latin'], variable: '--font-display' });
const monoFont = Space_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '700'] });

export const metadata = {
  title: {
    default: 'Vaulter',
    template: '%s'
  },
  description: 'Your keys. Your vault. Your control. Securely manage API keys with AES-256 encryption',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#9333ea',
          colorBackground: '#07070b',
          colorInputBackground: '#09090f',
          colorInputText: '#ffffff',
          colorTextOnPrimaryBackground: '#ffffff',
          colorTextSecondary: '#c4b5fd',
          colorText: '#ffffff',
          borderRadius: '1rem',
        },
        elements: {
          card: 'bg-[rgba(7,7,11,0.96)] border border-purple-500/14 shadow-none',
          headerTitle: 'text-white',
          headerSubtitle: 'text-purple-300',
          formButtonPrimary:
            'rounded-xl bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-fuchsia-500 text-white font-display font-semibold',
          socialButtonsBlockButton:
            'rounded-xl bg-transparent border border-purple-500/12 text-white hover:bg-white/[0.03]',
          socialButtonsBlockButtonText: 'text-white font-medium',
          formFieldLabel: 'text-purple-200',
          formFieldInput:
            'rounded-xl bg-black/80 border border-purple-500/10 text-white',
          footerActionText: 'text-purple-300',
          footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium',
          dividerLine: 'bg-purple-500/30',
          dividerText: 'text-purple-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-purple-400 hover:text-purple-300',
          formFieldInputShowPasswordButton: 'text-purple-400',
          modalBackdrop: 'bg-black/60 backdrop-blur-sm',
          // UserButton dropdown styling
          userButtonPopoverCard: 'bg-slate-900 border border-purple-500/30',
          userButtonPopoverActionButton: 'text-white hover:bg-white/10',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverActionButtonIcon: 'text-purple-400',
          userButtonPopoverFooter: 'hidden',
          userPreviewMainIdentifier: 'text-white',
          userPreviewSecondaryIdentifier: 'text-purple-300',
          // Hide development mode badge
          badge: 'hidden',
          userButtonPopoverFooter: 'hidden',
        },
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html lang="en">
        <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
