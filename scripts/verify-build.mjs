import assert from 'node:assert/strict';

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

assert.equal(viewportTags.length, 1, 'Production HTML must contain exactly one viewport meta tag.');
assert.doesNotMatch(
  viewportTags[0],
  /maximum-scale|minimum-scale|user-scalable/i,
  'The server-rendered viewport must remain zoom-friendly for browser tabs.',
);

const viewportIndex = html.indexOf('name="viewport"');
const bootstrapIndex = html.indexOf('nookDisplayMode');
const bodyIndex = html.indexOf('<body');

assert.ok(viewportIndex >= 0, 'The viewport meta tag must be rendered.');
assert.ok(bootstrapIndex > viewportIndex, 'The standalone bootstrap must run after the viewport meta tag.');
assert.ok(bodyIndex > bootstrapIndex, 'The standalone bootstrap must run before the document body.');

console.log('Production viewport order verified.');
