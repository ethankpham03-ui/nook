---
name: Nook
description: Your day, quietly in focus.
colors:
  canvas: "#f3f0e9"
  shell: "#faf9f5"
  card: "#ffffff"
  card-secondary: "#f8f6ef"
  soft-surface: "#f0f1eb"
  ink: "#1d211c"
  charcoal: "#20231f"
  muted: "#687067"
  subtle-text: "#596056"
  line: "rgba(30, 33, 28, 0.08)"
  accent: "#dfff64"
  accent-ink: "#20231f"
  lavender: "#e7d9ff"
  tab-today: "#dfff64"
  tab-habits: "#d8c1ff"
  tab-home: "#fff1a8"
  tab-focus: "#8be3e0"
  tab-notes: "#ffc6a3"
  focus-ring: "#aa70ff"
typography:
  display:
    fontFamily: "1FTV Wolfers, Helvetica Neue, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.7rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "0.005em"
  title:
    fontFamily: "1FTV Coolvetica Condensed Rg, Geist, Helvetica Neue, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
    wordSpacing: "0.04em"
  body:
    fontFamily: "1FTV Coolvetica Condensed Rg, Geist, Helvetica Neue, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.04em"
    wordSpacing: "0.04em"
  label:
    fontFamily: "1FTV Coolvetica Condensed Rg, Geist, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.04em"
    wordSpacing: "0.04em"
  mono:
    fontFamily: "Nook Mono, Nook Mono Ext, Geist Mono, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "12px"
  card: "26px"
  shell: "30px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  button-focus:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.soft-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
---

# Design System: Nook

## Overview

**Creative North Star: “The Bright Private Desk”**

Nook is a calm productivity space with a cheerful pulse. Warm paper neutrals
make the interface comfortable for long sessions; botanical charcoal gives it
focus; vivid chartreuse and lavender make the workspace memorable and alive.
The result should feel friendly and tactile, never corporate or sterile.

The original visual composition is an intentional product asset. Large soft
corners, pill controls, compact eyebrow labels, the timer grid and glow, and the
full lavender Habits region belong together. Do not normalize them toward a
generic flat or desaturated dashboard.

**Key Characteristics:**

- Warm paper shell with a strong charcoal navigation and timer anchor
- One electric chartreuse accent repeated on decisive states
- One generous lavender field for the habit ritual
- A branded aperture reveal that opens into the private desk
- A compact liquid-glass dock whose moving lens previews each destination
- Direction-aware tab movement with a slower, weighted settle that preserves spatial orientation
- Soft 26–30px containers and compact pill-shaped actions
- Playful details held inside a quiet, highly usable layout
- Anonymous, specific, privacy-forward product copy

## Colors

The palette uses contrast between quiet material surfaces and two confident
accents.

### Primary

- **Botanical Charcoal:** navigation, focus timer, major controls, and ink.
- **Focus Lime:** `#dfff64`; primary focus action, active states, checks,
  selection, and small brand marks.

### Secondary

- **Habit Lavender:** `#e7d9ff`; owns the complete Habits region and is not
  reduced to a tiny chip.
- **Dock Spectrum:** Today lime, Habits lavender, Home champagne, Focus aqua,
  and Notes peach. These colors belong to navigation feedback and a restrained
  ambient wash; they do not replace the core lime/lavender product palette.
- **Violet Focus:** `#aa70ff`; keyboard focus indication only.

### Neutral

- **Warm Canvas:** frames the product.
- **Paper Shell:** holds the daily workspace.
- **Clear Card:** carries tasks and notes.
- **Accessible Olive Gray:** supports general secondary copy.
- **Contrast Olive:** carries placeholders and inactive navigation labels at
  full opacity; its semantic dark-theme counterpart becomes a light olive.

**The Quiet Legibility Rule.** Quiet text must remain text, not become
transparency. Placeholders and inactive navigation labels use the semantic
subtle-text role at full opacity in both themes.

**The Two-Color Spark Rule.** Lime is small, bright, and action-oriented;
lavender is broad, soft, and atmospheric. Preserve that difference in dosage.
The floating dock is the deliberate exception: its five destination colors
behave as wayfinding light, not as five competing page themes.

## Typography

**Display Font:** 1FTV Wolfers
**Body Font:** 1FTV Coolvetica Condensed Rg
**Measured Font:** Geist Mono

Wolfers is reserved for true display moments: primary view titles, onboarding,
dialog titles, and the quiet next-move statement. It stays at its native 400
weight with neutral tracking so Vietnamese letters and diacritics retain room.
The comparison branch uses Coolvetica Condensed for body copy, section headings,
labels, buttons, and navigation. Its single 400 face keeps Geist immediately
behind it as a fallback for unsupported Vietnamese glyphs such as `Ỵ`; heavier
UI roles are synthetic in this branch. Mono belongs to timer numerals, Markdown,
shortcuts, and measured data.

## Layout

Nook is a centered application shell with one independently scrolling work
surface and five hash-backed destinations: Today, Habits, Home, Focus, and
Notes. Home is the centered launchpad; Today owns task capture; Habits owns the
full lavender ritual; Focus combines Deep Focus with Focus Rhythm; Notes owns
the daily Markdown surface and local backup. The fixed bottom dock keeps Home
in the middle, with Today/Habits to its left and Focus/Notes to its right.
Mobile preserves the same order and reserves safe-area clearance for the dock.
English is the default interface language; English and Vietnamese share the
same layouts, hierarchy, and controls. Containers must absorb translated copy
without truncating actions or changing the five-view order.

**Five Rooms, Five Grammars.** Cards are components, not the page scaffold.
Each destination must be recognizable from its spatial landmarks before its
copy is read: Home is a station journey beside one directional beacon; Today
is a vertical dayline with three priority stops; Habits is one lavender field
of circular orbits; Focus is one continuous charcoal instrument chamber; and
Notes is an open paper spread with a visible archive spine and a ruled template
index. Shared controls keep their behavior, but the five views must not be
normalized back into the same grid of rounded rectangles.

**The Home First-Viewport Rule.** At phone widths, compress the factual Day Arc
to a two-by-two summary so the complete next quiet move and its action remain
visible above the dock at the 390×844 reference viewport. Supporting Day Arc
description may recede; its current states and labels may not. Each Day Arc
stage keeps its directional arrow beside the stage label so the action reads as
one unit at every breakpoint.

## Elevation & Depth

The outer shell uses one wide ambient shadow. Most cards remain flat, relying
on color and borders for separation. The dock uses one translucent 16px blur
track and one bright circular lens; avoid stacking extra backdrop blurs inside
the lens. Dialogs and toasts may use a stronger soft shadow because they float
over the current context. The timer’s faint grid and single lime glow are
deliberate signature details, not a reusable background effect.

## Motion cadence

Nook responds immediately, then settles slowly enough to feel tactile. Motion
must never begin with an artificial pause after input. Routine control feedback
uses 180ms; state changes use 280ms; destination content settles over 480ms;
major blocks use 500–520ms with 45ms hierarchy offsets capped below 180ms; and
grouped elements use 420ms with 28ms offsets. The dock lens follows a committed
destination over 460ms. Arrivals use `cubic-bezier(0.16, 1, 0.3, 1)` and exits
remain shorter than entrances.

The launch aperture is Nook's one authored focal sequence. It lasts about 1.9
seconds end to end: aperture and mark, wordmark and tagline, a short readable
hold, then a 420ms exit. It remains a brand cue, not a loading claim. Top-level
views use distinct supporting choreography: Home unfolds the next move, Today
stages planning surfaces, Habits settles as one field, Focus gains weight, and
Notes opens editor and archive from their spatial relationship.

## Shapes

The outer shell uses a 30px radius. Dialogs use 22–24px. Inputs use 12px.
Primary actions, utility controls, task checks, timer presets, and status badges
use pill or circular geometry. Large authored regions may use asymmetric
28–92px corners to create landmarks; repeated content does not automatically
receive a rounded card. The softness is a core part of the product’s character.
The active dock lens remains circular at every breakpoint, including while it
is dragged between destinations.

## Components

### Buttons

- **Primary:** charcoal, white type, compact pill.
- **Focus:** focus lime, charcoal type, compact pill.
- **Utility:** circular or pill-shaped neutral controls.
- **States:** tonal hover, visible violet focus ring, subtle active response.

### Cards / Containers

- **Use cards selectively:** reserve a closed region for content that truly
  belongs together; do not wrap every section simply to create spacing.
- **Today:** tasks live on one open dayline, separated by priority stops and
  rules rather than three interchangeable cards. Capacity and the complete
  dayline appear before task creation. Task creation is progressive disclosure:
  one action directly below the dayline opens an accessible dialog instead of
  reserving a permanent page section for the form.
- **Notes:** editor and archive share one paper spread; template actions form a
  ruled insertion index with small semantic color marks, never a second card
  grid or three full-width color panels.
- **Focus:** one charcoal chamber with a faint grid and restrained lime glow.
- **Habits:** one full lavender field: circular minimum-version habit orbits
  first, followed by an open grove of seven-fruit streak trees. Each earned day
  grows one fruit; completed seven-day rhythms carry a small flame.

### Floating Navigation

- Five equal targets ordered Today, Habits, Home, Focus, Notes.
- A circular liquid lens previews the nearest target continuously on hover or
  a pointer-captured drag, commits that destination on release, then settles in
  about 460ms. Click remains direct selection.
- The lens tint and foreground follow the previewed destination. The committed
  tab remains legible off-lens in both themes while retaining its raised state.
- Labels remain visible; the selected Focus tab may show a live timer dot.
- Destination content arrives from the direction of travel: forward tabs move
  in from the right and backward tabs from the left. New content is visible in
  the first frame and settles over 480ms, never becoming a carousel or a
  gesture-only interaction.
- Arrow keys move between tabs, Home/End jump to the ends, and reduced-motion,
  reduced-transparency, and forced-color modes receive explicit fallbacks.

### Launch & Onboarding

- A cold launch opens Nook's bundled mark from a narrow charcoal aperture,
  followed by the wordmark and localized tagline. Its approximately 1.9-second
  choreography is an authored brand cue, not a simulated network-loading delay
  or progress claim.
- First-run onboarding is a focused three-step dialog. Language choice follows
  a clear value statement in step one, Skip stays available throughout, and
  the final chartreuse action opens Morning Plan. A compact, accessible loop
  diagram explains Plan, Focus, Tend, and Close without simulated data.
- The first-run handoff continues through real surfaces: Morning Plan opens
  Today with the Anchor field focused; adding that Anchor returns to Home and
  makes it the next quiet move into Focus. This cue uses real user input and
  never starts the timer automatically.
- English and Tiếng Việt remain visible as explicit choices. Replaying the
  introduction from Settings preserves current data.
- Reduced motion removes aperture and directional movement, retaining only a
  brief opacity fade for continuity.

### Inputs / Fields

Soft tonal fill, 12px radius, quiet border, and visible focus treatment. Error
and disabled states must also be explained in text.

### Icon Treatment

Use Phosphor Icons at Bold weight for navigation and shared interface symbols.
Keep the family, weight, 20–22px optical size, and alignment consistent; do not
recreate library icons with CSS primitives. Every symbol control retains an
accessible label and is never the only carrier of meaning.

## Do’s and Don’ts

### Do:

- **Do** preserve the original lime, lavender, soft geometry, timer texture,
  glow, pills, and card hierarchy.
- **Do** keep anonymous greeting and honest empty/zero first-run data.
- **Do** retain the stronger accessible secondary-text contrast.
- **Do** verify light/dark, mobile, keyboard, and reduced-motion behavior.
- **Do** test English and Vietnamese copy, date/number formatting, focus order,
  and translated action wrapping at desktop and phone widths.
- **Do** keep Home as a concise launchpad rather than a duplicate dashboard.
- **Do** preserve a distinct spatial landmark and layout grammar for every tab.

### Don’t:

- **Don’t** desaturate the accent into sage or reduce lavender to tiny chips.
- **Don’t** square the cards and controls in pursuit of generic minimalism.
- **Don’t** remove eyebrow rhythm, timer texture, or the single glow merely to
  satisfy a generic design rule.
- **Don’t** fabricate activity, progress, endorsements, or personal identity.
- **Don’t** add remote assets or dependencies merely for decoration.
- **Don’t** force existing users through onboarding or use launch motion to
  imply remote loading, synchronization, or account setup.
- **Don’t** place all five primary functions back into one scrolling page.
- **Don’t** use the same rounded-card grid as the default composition for every
  destination.
