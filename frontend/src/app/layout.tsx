import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { ModalProvider } from '@/components/modal-provider';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config';
import { AuthBootstrap } from '@/features/auth/components/auth-bootstrap';
import { AuthBootstrapper } from '@/features/auth/components/auth-bootstrapper';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
});

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <AuthBootstrap>
          <AuthBootstrapper />
          <Toaster theme="dark" richColors closeButton />
          <ModalProvider />
          {children}
        </AuthBootstrap>
      </body>
    </html>
  );
};

export default RootLayout;
