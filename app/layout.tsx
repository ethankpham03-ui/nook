import type { Metadata, Viewport } from 'next';
import './globals.css';
import { createStandaloneViewportBootstrap } from './lib/display-mode';

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

const appearanceBootstrap = `(() => {
  try {
    const raw = localStorage.getItem('nook.local.v2') || localStorage.getItem('nook.local.v1');
    if (!raw) return;
    const payload = JSON.parse(raw);
    const snapshot = payload && typeof payload === 'object' && payload.snapshot ? payload.snapshot : payload;
    const settings = snapshot && typeof snapshot === 'object' ? snapshot.settings : null;
    const dark = settings && typeof settings.dark === 'boolean'
      ? settings.dark
      : snapshot && typeof snapshot.dark === 'boolean'
        ? snapshot.dark
        : null;
    if (dark !== null) {
      document.documentElement.dataset.nookTheme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }
    if (settings && (settings.language === 'en' || settings.language === 'vi')) {
      document.documentElement.lang = settings.language;
    }
  } catch {}
})();`;

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: 'Nook — Your day, quietly in focus',
  description: 'A private, local-first place for tasks, focus sessions, habits, and daily notes.',
  applicationName: 'Nook',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Nook',
    statusBarStyle: 'black',
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
  themeColor: '#20231f',
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
