import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'VAULTER - Secure API Key Manager',
  description: 'Your keys. Your vault. Your control. Securely manage API keys with AES-256 encryption',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#9333ea',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e1b4b',
          colorInputText: '#ffffff',
          colorTextOnPrimaryBackground: '#ffffff',
          colorTextSecondary: '#c4b5fd',
          colorText: '#ffffff',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'bg-slate-900 border border-purple-500/30 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-purple-300',
          formButtonPrimary:
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium',
          socialButtonsBlockButton:
            'bg-white/10 border border-white/20 text-white hover:bg-white/20',
          socialButtonsBlockButtonText: 'text-white font-medium',
          formFieldLabel: 'text-purple-200',
          formFieldInput:
            'bg-white/10 border border-white/20 text-white',
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
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
