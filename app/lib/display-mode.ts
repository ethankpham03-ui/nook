// Lock only an installed app window; browser fullscreen should remain zoomable.
export const STANDALONE_DISPLAY_MODE_QUERY = '(display-mode: standalone)';

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
