import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gerçek Zamanlı Ulaşım Platformu',
  description: 'Gerçek zamanlı toplu taşıma, araç paylaşımı ve konum tabanlı tavsiyeler',
  keywords: ['ankara', 'ulaşım', 'toplu taşıma', 'taksi', 'uber', 'bolt', 'metro', 'otobüs'],
  authors: [{ name: 'Gerçek Zamanlı Ulaşım Platformu' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#1E3A5F',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://gercek-zamanli-ulasim.app',
    siteName: 'Gerçek Zamanlı Ulaşım Platformu',
    title: 'Gerçek Zamanlı Ulaşım Platformu',
    description: 'Gerçek zamanlı toplu taşıma, araç paylaşımı ve konum tabanlı tavsiyeler',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={cn(inter.className, 'antialiased bg-neutral-100')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
