import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

import {
  STANDALONE_VIEWPORT_CONTENT,
  createStandaloneViewportBootstrap,
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
