import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PropsWithChildren } from 'react';

import { JotaiProvider } from '@/components/jotai-provider';
import { ModalProvider } from '@/components/modal-provider';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <JotaiProvider>
          <Toaster theme="light" richColors closeButton />
          <ModalProvider />

          {children}
        </JotaiProvider>
      </body>
    </html>
  );
};

export default RootLayout;
