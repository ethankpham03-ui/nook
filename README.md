# Nook

> Your day, quietly in focus.

Nook is a calm, local-first productivity app for daily planning, habits,
deep-focus sessions, and private Markdown notes. It works without an account,
cloud database, or tracking, and keeps personal data in the current browser.

![Nook social preview](public/og.png)

## Highlights

- Task capture, completion, deletion, estimates, and focus selection
- 25- and 50-minute focus timer with weekly progress
- One-tap habit tracking
- Autosaved Markdown daily note
- Light and dark themes
- Keyboard command menu with `Ctrl/⌘ + K`
- Private JSON export and import
- Offline app shell after the first production visit
- Responsive, accessible interface

## Getting started

Requirements: Node.js 22.13 or newer (with npm).

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run check
```

This runs linting, TypeScript checks, and a production build.

## Production

```bash
npm run build
npm run start
```

Set `SITE_ORIGIN` to the app's absolute public URL in the deployment
environment (for example, `https://nook.example.com`). Nook uses it to emit
correct Open Graph and Twitter image URLs. Local development does not require
this variable.

## Privacy model

Nook has no application account, analytics, or remote database. Tasks, habits,
notes, preferences, and timer state are stored under `nook.local.v1` in browser
storage. Export a JSON backup before clearing browser data or moving devices.

## Stack

React 19, TypeScript, Vinext, Vite, Tailwind CSS, and the browser Storage and
Service Worker APIs. Interface icons are provided by Phosphor Icons.

## Product documentation

- [Product specification](PRODUCT.md)
- [Design direction](DESIGN.md)

## License

MIT — see [LICENSE](LICENSE).
