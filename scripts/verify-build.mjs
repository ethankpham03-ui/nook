import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { default: worker } = await import('../dist/server/index.js');
const response = await worker.fetch(
  new Request('http://localhost/'),
  {
    ASSETS: {
      fetch: async () => new Response('Not found', { status: 404 }),
    },
  },
  { waitUntil() {} },
);

assert.equal(response.status, 200, 'The production root route must render successfully.');
const html = await response.text();
const viewportTags = html.match(/<meta(?=[^>]*\bname="viewport")[^>]*>/gi) ?? [];
const themeColorTags = html.match(/<meta(?=[^>]*\bname="theme-color")[^>]*>/gi) ?? [];
const appleStatusBarTags = html.match(/<meta(?=[^>]*\bname="apple-mobile-web-app-status-bar-style")[^>]*>/gi) ?? [];

assert.equal(viewportTags.length, 1, 'Production HTML must contain exactly one viewport meta tag.');
assert.doesNotMatch(
  viewportTags[0],
  /maximum-scale|minimum-scale|user-scalable/i,
  'The server-rendered viewport must remain zoom-friendly for browser tabs.',
);

assert.equal(themeColorTags.length, 1, 'Production HTML must contain one unambiguous app chrome color.');
assert.match(
  themeColorTags[0],
  /content="#faf9f5"/i,
  'The initial app chrome must match Nook\'s light paper shell.',
);
assert.doesNotMatch(
  themeColorTags[0],
  /\bmedia=/i,
  'The app chrome must follow Nook\'s stored theme rather than the operating-system theme.',
);
assert.equal(appleStatusBarTags.length, 1, 'Production HTML must contain one Apple status bar tag.');
assert.match(
  appleStatusBarTags[0],
  /content="default"/i,
  'The iOS Home Screen status bar must use the normal light-background treatment.',
);

const viewportIndex = html.indexOf('name="viewport"');
const themeColorIndex = html.indexOf('name="theme-color"');
const bootstrapIndex = html.indexOf('nookDisplayMode');
const appearanceBootstrapIndex = html.indexOf('storedDark');
const bodyIndex = html.indexOf('<body');

assert.ok(viewportIndex >= 0, 'The viewport meta tag must be rendered.');
assert.ok(bootstrapIndex > viewportIndex, 'The standalone bootstrap must run after the viewport meta tag.');
assert.ok(
  appearanceBootstrapIndex > themeColorIndex,
  'The saved Nook appearance must update the app chrome after its meta tag exists.',
);
assert.ok(
  bodyIndex > appearanceBootstrapIndex,
  'The saved Nook appearance must update the app chrome before the first body paint.',
);
assert.ok(bodyIndex > bootstrapIndex, 'The standalone bootstrap must run before the document body.');

const manifest = JSON.parse(
  await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
);
assert.equal(manifest.theme_color, '#faf9f5', 'The install theme must match Nook\'s light paper shell.');
assert.equal(manifest.background_color, '#faf9f5', 'The launch surface must match Nook\'s light paper shell.');

console.log('Production viewport and app chrome verified.');
