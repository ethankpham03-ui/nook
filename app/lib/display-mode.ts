// Lock only an installed app window; browser fullscreen should remain zoomable.
export const STANDALONE_DISPLAY_MODE_QUERY = '(display-mode: standalone)';

export const NOOK_APP_CHROME_COLORS = {
  light: '#faf9f5',
  dark: '#171a16',
} as const;

export const STANDALONE_VIEWPORT_CONTENT = [
  'width=device-width',
  'initial-scale=1',
  'minimum-scale=1',
  'maximum-scale=1',
  'user-scalable=no',
  'viewport-fit=cover',
].join(', ');

type AppleNavigator = Navigator & { standalone?: boolean };

export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return window.matchMedia(STANDALONE_DISPLAY_MODE_QUERY).matches
    || (navigator as AppleNavigator).standalone === true;
}

export function syncStandaloneViewport() {
  const standalone = isStandaloneDisplayMode();
  if (typeof document === 'undefined') return standalone;

  document.documentElement.dataset.nookDisplayMode = standalone ? 'standalone' : 'browser';
  if (!standalone) return false;

  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  viewport?.setAttribute('content', STANDALONE_VIEWPORT_CONTENT);
  return true;
}

export function syncNookAppChrome(isDark: boolean) {
  if (typeof document === 'undefined') return;

  const color = isDark ? NOOK_APP_CHROME_COLORS.dark : NOOK_APP_CHROME_COLORS.light;
  document.documentElement.style.backgroundColor = color;

  const themeColors = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  themeColors.forEach((meta) => {
    meta.removeAttribute('media');
    meta.setAttribute('content', color);
  });
}

export function createAppearanceBootstrap() {
  const light = JSON.stringify(NOOK_APP_CHROME_COLORS.light);
  const dark = JSON.stringify(NOOK_APP_CHROME_COLORS.dark);

  return `(() => {
  const root = document.documentElement;
  let isDark = false;
  let language = null;

  try {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {}

  try {
    const raw = localStorage.getItem('nook.local.v2') || localStorage.getItem('nook.local.v1');
    if (raw) {
      const payload = JSON.parse(raw);
      const snapshot = payload && typeof payload === 'object' && payload.snapshot ? payload.snapshot : payload;
      const settings = snapshot && typeof snapshot === 'object' ? snapshot.settings : null;
      const storedDark = settings && typeof settings.dark === 'boolean'
        ? settings.dark
        : snapshot && typeof snapshot.dark === 'boolean'
          ? snapshot.dark
          : null;
      if (storedDark !== null) isDark = storedDark;
      if (settings && (settings.language === 'en' || settings.language === 'vi')) {
        language = settings.language;
      }
    }
  } catch {}

  const appChromeColor = isDark ? ${dark} : ${light};
  root.dataset.nookTheme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = appChromeColor;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.removeAttribute('media');
    themeColor.setAttribute('content', appChromeColor);
  }
  if (language) root.lang = language;
})();`;
}

export function createStandaloneViewportBootstrap() {
  const query = JSON.stringify(STANDALONE_DISPLAY_MODE_QUERY);
  const viewportContent = JSON.stringify(STANDALONE_VIEWPORT_CONTENT);

  return `(() => {
  try {
    const standalone = window.matchMedia(${query}).matches
      || window.navigator.standalone === true;
    document.documentElement.dataset.nookDisplayMode = standalone ? 'standalone' : 'browser';
    if (!standalone) return;
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute('content', ${viewportContent});
  } catch {}
})();`;
}
