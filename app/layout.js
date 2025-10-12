import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'VAULTER - Secure API Key Manager',
  description: 'Your keys. Your vault. Your control. Securely manage API keys with AES-256 encryption',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
