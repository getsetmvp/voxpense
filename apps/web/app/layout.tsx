import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { site } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: 'Yash Gupta', url: site.url }],
  keywords: [
    'voice expense tracker',
    'AI expense tracker',
    'budget app',
    'personal finance India',
    'speak expenses',
    'expense management',
    'receipt scan',
    'voxpense',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [site.ogImage],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="min-h-dvh bg-paper text-ink antialiased dark:bg-night dark:text-ink-inverse">
        {children}
      </body>
    </html>
  );
}
