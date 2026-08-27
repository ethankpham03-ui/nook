# Product

## Release Scope

This repository contains **Nook v2, Wave 1**: a responsive web app that expands
the daily workflow before native Android and iOS work begins. The current build
is an owner preview. It includes working Premium Preview surfaces for product
evaluation, but it has no billing, entitlement, account, or paywall system.

## Users

Nook is for individuals who want to shape a believable day, focus on the next
meaningful task, maintain small habits, and keep a lightweight daily record
without creating an account or sending personal data to a cloud service.

## Product Purpose

Nook is a quiet, local-first daily operating system: **a calm day that learns
locally**. Success means a person can move from intention to focused work, tend
small routines, and close the day with very little setup or noise.

## Nook Arc

The product follows a recurring daily loop rather than presenting five
unrelated utilities:

1. **Open** — record morning energy and available capacity.
2. **Shape** — place work into Anchor, Support, and Optional lanes.
3. **Focus** — protect one intention and record completed session time.
4. **Tend** — complete the minimum honest version of a habit.
5. **Close** — record closing energy and leave a short reflection.
6. **Weekly Compass** — review factual seven-day patterns after enough real
   local activity exists.

Home is the concise launchpad for this arc. It shows the Day Arc and the next
quiet move without duplicating the full tools in the other views.

## Five-view Architecture

The primary hash-backed navigation and its order are fixed:

1. **Today** — daily capacity, quick task capture, and the Anchor, Support, and
   Optional lanes. Tasks include a category, estimate, completion state, lane,
   and a path into Focus. Only one active Anchor is kept for a day.
2. **Habits** — minimum versions, today's check-ins, habit capture, and an
   honest seven-day rhythm without streak loss or invented history.
3. **Home** — centered in navigation; Morning Plan, Close Day, Day Arc, the
   next quiet move, and Weekly Compass.
4. **Focus** — Deep Focus and Focus Rhythm together: a timestamp-based timer,
   intention, distraction pad, session note, presets, and real seven-day
   completed-session history.
5. **Notes** — one Markdown-friendly note per date, date selection, archive,
   search, and local note templates.

## Free Foundation

The intended free product remains useful on its own:

- Morning planning, daily capacity, task capture, lanes, completion, deletion,
  and intentional task-to-focus handoff.
- Habit creation with a minimum version, daily check-ins, and seven-day rhythm.
- Home's Day Arc, next quiet move, Morning Plan, and Close Day rituals.
- Focus intention, start/pause/resume/reset, distraction capture, session note,
  and factual completed-session history.
- Dated private notes, archive search, theme preference, quick actions, and
  manual JSON export/import.

The checked-in owner-preview build does not enforce this product boundary; all
preview modules are available locally so they can be evaluated together.

## Premium Preview

These working local modules are labeled **Premium preview · local**:

- **Local Replan** explains capacity overload and moves Optional work first,
  then Support work, while leaving the Anchor in place. The action is undoable.
- **Routine Designer** edits the minimum version of each active habit.
- **Focus Profiles** provide named 15-, 25-, 50-, and 90-minute modes.
- **Weekly Compass** summarizes only recorded tasks, focus, habits, and note
  days; it waits for at least three observed days instead of inventing insight.
- **Note Templates** add local structure for a morning plan, day close, or
  weekly reflection without generating or uploading content.

This preview is not a commercial subscription implementation. A future release
is intended to offer **monthly, yearly, and lifetime** purchase options. Prices,
checkout, App Store or Play billing, receipt validation, entitlement restore,
and paywall behavior do not exist in Wave 1 and must not be implied by product
copy.

## Local Data and Migration

- The v2 snapshot is stored under `nook.local.v2` in browser storage. It covers
  tasks, habits, dated habit logs, dated notes, daily records, focus sessions,
  active timer state, selected task, and theme preference.
- If no v2 snapshot exists, Nook recognizes `nook.local.v1`, safely normalizes
  its current values into schema v2, and writes future changes to the v2 key.
  The migration preserves undated v1 aggregates as legacy values rather than
  fabricating habit logs or focus sessions.
- Export creates a validated, versioned `nook-backup` JSON envelope. Import
  validates the file and asks for confirmation before replacing local data.
- Before a confirmed import or reset, Nook writes a recovery copy to
  `nook.rollback.v2` and offers a brief in-app undo. A user-controlled exported
  file remains the durable backup and device-transfer mechanism.

## Privacy and Operating Constraints

- There are no application accounts, analytics, telemetry, remote database, or
  automatic multi-device synchronization.
- Product data, Premium Preview calculations, and insights stay on the current
  device. No seeded or simulated activity may be presented as the user's data.
- Product behavior remains useful without a network after the first production
  visit. Runtime UI must not depend on remote fonts, images, or APIs.
- Backup, export, data ownership, accessibility, and the core daily loop must
  not become Premium-only capabilities.

## Brand Commitments

The product name is **Nook** and the tagline is **“Your day, quietly in focus.”**
Its voice is concise, calm, specific, and privacy-forward. Public-facing copy,
fixtures, metadata, and screenshots remain anonymous and must not expose a
personal owner or author name.

## Product Principles

- Quiet by default: show the next useful action without turning progress into a
  competition.
- Local ownership: make storage behavior and manual backup understandable.
- Zero-account immediacy: core work starts without registration or onboarding.
- Gentle progress: encourage focus and consistency without guilt or streak
  pressure.
- Honest state: use recorded facts and wait when there is not enough evidence
  for a meaningful pattern.

## Accessibility and Inclusion

Preserve keyboard operation, visible focus states, semantic labels, responsive
layouts, reduced-motion support, reduced-transparency handling, and forced-color
compatibility. Subscription design must never reduce access to these basics.

## Evidence on Hand

The repository contains the working Wave 1 single-page implementation, schema
and migration tests, manifest, service worker, social preview, and product
documentation. It contains no verified testimonials, customer logos,
benchmarks, pricing claims, purchase flow, or third-party endorsements; future
work must not fabricate them.
