# Product

## Platform

web

## Users

Individuals who want to plan a day, focus on the next meaningful task, maintain
small habits, and keep a lightweight daily record without creating an account or
sending personal data to a cloud service.

## Product Purpose

Nook is a calm, local-first productivity dashboard for tasks, timed focus,
weekly rhythm, habits, and Markdown daily notes. Success means a person can open
the app and move from intention to focused work with very little setup or noise.

## Positioning

Nook combines a one-day work surface and a focus ritual in the browser while
keeping the user's working data on the current device. It is deliberately not a
collaborative project-management system or an account-based cloud workspace.

## Operating Context

Nook is used in a browser, primarily as a personal desktop or laptop workspace
with a responsive mobile surface. A typical loop is to capture a task, select it
for a 25- or 50-minute focus session, mark habits, and leave a short daily note.
JSON export and import provide a manual device-local backup path.

## Capabilities and Constraints

- Tasks support capture, completion, deletion, categories, estimates, and focus
  selection.
- Focus sessions use 25- and 50-minute presets and contribute to a seven-day
  summary.
- Habit checks and the daily Markdown note are stored with the rest of the app
  state under `nook.local.v1` in browser storage.
- The app supports light and dark themes, a keyboard command menu, private JSON
  export/import, and a production service-worker app shell.
- The primary interface is split across five hash-backed views: Today for
  tasks, Habits for the daily ritual, Home for a concise launchpad, Focus for
  Deep Focus plus Focus Rhythm, and Notes for the daily note plus backup.
- There are no application accounts, analytics, telemetry, remote database, or
  automatic multi-device synchronization.
- Product behavior must remain useful without a network after the first
  production visit. Runtime UI must not depend on remote fonts, images, or APIs.

## Brand Commitments

The product name is **Nook** and the tagline is **“Your day, quietly in focus.”**
Its voice is concise, calm, specific, and privacy-forward. Public-facing copy,
fixtures, metadata, and screenshots must remain anonymous and must not expose a
personal owner or author name.

## Evidence on Hand

The repository contains a working single-page implementation, manifest,
service worker, social preview, and README. It contains no verified testimonials,
customer logos, benchmarks, pricing claims, or third-party endorsements; future
work must not fabricate them.

## Product Principles

- Quiet by default: show the next useful action without turning progress into a
  competition.
- Local ownership: make storage behavior and manual backup understandable.
- Zero-account immediacy: core work starts without registration or onboarding.
- Gentle progress: encourage focus and consistency without guilt or streak
  pressure.
- Honest state: do not present seeded or simulated activity as the user's real
  history.

## Accessibility & Inclusion

Preserve keyboard operation, visible focus states, responsive layouts, semantic
labels, and reduced-motion support. No additional product-specific accessibility
standard has been confirmed.
