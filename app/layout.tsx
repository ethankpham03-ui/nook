import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  NOOK_APP_CHROME_COLORS,
  createAppearanceBootstrap,
  createStandaloneViewportBootstrap,
} from './lib/display-mode';

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
const standaloneViewportBootstrap = createStandaloneViewportBootstrap();
const appearanceBootstrap = createAppearanceBootstrap();

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: 'Nook — Your day, quietly in focus',
  description: 'A private, local-first place for tasks, focus sessions, habits, and daily notes.',
  applicationName: 'Nook',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Nook',
    statusBarStyle: 'default',
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
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: NOOK_APP_CHROME_COLORS.light,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: standaloneViewportBootstrap }} />
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
