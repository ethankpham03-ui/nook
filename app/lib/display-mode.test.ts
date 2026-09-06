import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

import {
  NOOK_APP_CHROME_COLORS,
  STANDALONE_VIEWPORT_CONTENT,
  createAppearanceBootstrap,
  createStandaloneViewportBootstrap,
  syncNookAppChrome,
// @ts-expect-error Node's --experimental-strip-types ESM loader requires the explicit .ts extension.
} from './display-mode.ts';

const BROWSER_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, viewport-fit=cover';

function runBootstrap({
  appleStandalone = false,
  hasViewport = true,
  standaloneDisplayMode = false,
} = {}) {
  const root = { dataset: {} as Record<string, string> };
  const viewport = hasViewport
    ? {
        content: BROWSER_VIEWPORT_CONTENT,
        setAttribute(name: string, value: string) {
          assert.equal(name, 'content');
          this.content = value;
        },
      }
    : null;

  runInNewContext(createStandaloneViewportBootstrap(), {
    document: {
      documentElement: root,
      querySelector(selector: string) {
        assert.equal(selector, 'meta[name="viewport"]');
        return viewport;
      },
    },
    window: {
      matchMedia(query: string) {
        assert.equal(query, '(display-mode: standalone)');
        return { matches: standaloneDisplayMode };
      },
      navigator: { standalone: appleStandalone },
    },
  });

  return { mode: root.dataset.nookDisplayMode, viewportContent: viewport?.content };
}

function runAppearanceBootstrap({
  prefersDark = false,
  storedValue,
} : {
  prefersDark?: boolean;
  storedValue?: unknown;
} = {}) {
  const root = {
    dataset: {} as Record<string, string>,
    lang: 'en',
    style: {} as Record<string, string>,
  };
  const attributes: Record<string, string> = {
    content: NOOK_APP_CHROME_COLORS.light,
    media: '(prefers-color-scheme: light)',
  };
  const themeColor = {
    removeAttribute(name: string) {
      delete attributes[name];
    },
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
  };

  runInNewContext(createAppearanceBootstrap(), {
    document: {
      documentElement: root,
      querySelector(selector: string) {
        assert.equal(selector, 'meta[name="theme-color"]');
        return themeColor;
      },
    },
    localStorage: {
      getItem(key: string) {
        if (key !== 'nook.local.v2' || storedValue === undefined) return null;
        return typeof storedValue === 'string' ? storedValue : JSON.stringify(storedValue);
      },
    },
    window: {
      matchMedia(query: string) {
        assert.equal(query, '(prefers-color-scheme: dark)');
        return { matches: prefersDark };
      },
    },
  });

  return { attributes, root };
}

test('keeps the browser viewport permissive', () => {
  const result = runBootstrap();

  assert.equal(result.mode, 'browser');
  assert.equal(result.viewportContent, BROWSER_VIEWPORT_CONTENT);
});

test('locks the viewport in manifest standalone mode', () => {
  const result = runBootstrap({ standaloneDisplayMode: true });

  assert.equal(result.mode, 'standalone');
  assert.equal(result.viewportContent, STANDALONE_VIEWPORT_CONTENT);
});

test('locks the viewport for an iOS Home Screen web app', () => {
  const result = runBootstrap({ appleStandalone: true });

  assert.equal(result.mode, 'standalone');
  assert.equal(result.viewportContent, STANDALONE_VIEWPORT_CONTENT);
});

test('does not create a duplicate viewport when metadata is unavailable', () => {
  const result = runBootstrap({ hasViewport: false, standaloneDisplayMode: true });

  assert.equal(result.mode, 'standalone');
  assert.equal(result.viewportContent, undefined);
});

test('uses the system appearance before a Nook preference has been saved', () => {
  const result = runAppearanceBootstrap({ prefersDark: true });

  assert.equal(result.root.dataset.nookTheme, 'dark');
  assert.equal(result.root.dataset.nookChrome, 'dark');
  assert.equal(result.root.style.colorScheme, 'dark');
  assert.equal(result.root.style.backgroundColor, NOOK_APP_CHROME_COLORS.dark);
  assert.equal(result.attributes.content, NOOK_APP_CHROME_COLORS.dark);
  assert.equal(result.attributes.media, undefined);
});

test('lets the saved Nook theme override the operating-system theme before first paint', () => {
  const result = runAppearanceBootstrap({
    prefersDark: true,
    storedValue: {
      snapshot: {
        settings: { dark: false, language: 'vi' },
      },
    },
  });

  assert.equal(result.root.dataset.nookTheme, 'light');
  assert.equal(result.root.dataset.nookChrome, 'light');
  assert.equal(result.root.style.colorScheme, 'light');
  assert.equal(result.root.style.backgroundColor, NOOK_APP_CHROME_COLORS.light);
  assert.equal(result.root.lang, 'vi');
  assert.equal(result.attributes.content, NOOK_APP_CHROME_COLORS.light);
  assert.equal(result.attributes.media, undefined);
});

test('falls back to the system appearance when saved data is invalid', () => {
  const result = runAppearanceBootstrap({ prefersDark: false, storedValue: '{broken' });

  assert.equal(result.root.dataset.nookTheme, 'light');
  assert.equal(result.root.dataset.nookChrome, 'light');
  assert.equal(result.root.style.backgroundColor, NOOK_APP_CHROME_COLORS.light);
  assert.equal(result.attributes.content, NOOK_APP_CHROME_COLORS.light);
});

test('syncs every app-chrome surface when Focus Room changes appearance', () => {
  const originalDocument = globalThis.document;
  const root = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
  };
  const themeColors = Array.from({ length: 2 }, () => {
    const attributes: Record<string, string> = { media: 'all' };
    return {
      attributes,
      removeAttribute(name: string) {
        delete attributes[name];
      },
      setAttribute(name: string, value: string) {
        attributes[name] = value;
      },
    };
  });

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      documentElement: root,
      querySelectorAll(selector: string) {
        assert.equal(selector, 'meta[name="theme-color"]');
        return themeColors;
      },
    },
  });

  try {
    syncNookAppChrome(true);
    assert.equal(root.dataset.nookChrome, 'dark');
    assert.equal(root.style.backgroundColor, NOOK_APP_CHROME_COLORS.dark);
    themeColors.forEach(({ attributes }) => {
      assert.equal(attributes.content, NOOK_APP_CHROME_COLORS.dark);
      assert.equal(attributes.media, undefined);
    });

    syncNookAppChrome(false);
    assert.equal(root.dataset.nookChrome, 'light');
    assert.equal(root.style.backgroundColor, NOOK_APP_CHROME_COLORS.light);
    themeColors.forEach(({ attributes }) => {
      assert.equal(attributes.content, NOOK_APP_CHROME_COLORS.light);
    });
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  }
});
