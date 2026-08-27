import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function getSiteOrigin() {
  const value = process.env.SITE_ORIGIN;
  if (!value) return undefined;

  try {
    return new URL(value);
  } catch {
    throw new Error('SITE_ORIGIN must be an absolute URL, such as https://nook.example.com.');
  }
}

const siteOrigin = getSiteOrigin();
const socialImage = siteOrigin ? new URL('/og.png', siteOrigin).href : undefined;

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: 'Nook — Your day, quietly in focus',
  description: 'A private, local-first place for tasks, focus sessions, habits, and daily notes.',
  applicationName: 'Nook',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Nook',
    statusBarStyle: 'black-translucent',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Nook — Your day, quietly in focus',
    description: 'Tasks, focus sessions, habits, and notes that stay on your device.',
    type: 'website',
    ...(socialImage
      ? {
          images: [
            {
              url: socialImage,
              width: 1731,
              height: 909,
              alt: 'Nook — Your day, quietly in focus.',
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nook — Your day, quietly in focus',
    description: 'Tasks, focus sessions, habits, and notes that stay on your device.',
    ...(socialImage ? { images: [socialImage] } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: '#20231f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
