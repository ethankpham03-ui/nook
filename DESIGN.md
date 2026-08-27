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
    fontFamily: "Geist, Helvetica Neue, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.7rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.055em"
  title:
    fontFamily: "Geist, Helvetica Neue, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Geist, Helvetica Neue, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, SFMono-Regular, monospace"
    fontSize: "0.75rem"
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
- A compact liquid-glass dock whose moving lens previews each destination
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
- **Accessible Olive Gray:** supports secondary copy without returning to the
  lower-contrast gray of the earliest prototype.

**The Two-Color Spark Rule.** Lime is small, bright, and action-oriented;
lavender is broad, soft, and atmospheric. Preserve that difference in dosage.
The floating dock is the deliberate exception: its five destination colors
behave as wayfinding light, not as five competing page themes.

## Typography

**Display Font:** Geist
**Body Font:** Geist
**Measured Font:** Geist Mono

Geist keeps the tool contemporary and direct. Tight display tracking gives the
greeting personality, while small uppercase eyebrow labels establish the
original card rhythm. Mono belongs to timer numerals, Markdown, shortcuts, and
measured data.

## Layout

Nook is a centered application shell with one independently scrolling work
surface and five hash-backed destinations: Today, Habits, Home, Focus, and
Notes. Home is the centered launchpad; Today owns task capture; Habits owns the
full lavender ritual; Focus combines Deep Focus with Focus Rhythm; Notes owns
the daily Markdown surface and local backup. The fixed bottom dock keeps Home
in the middle, with Today/Habits to its left and Focus/Notes to its right.
Mobile preserves the same order and reserves safe-area clearance for the dock.

## Elevation & Depth

The outer shell uses one wide ambient shadow. Most cards remain flat, relying
on color and borders for separation. The dock uses one translucent 16px blur
track and one bright circular lens; avoid stacking extra backdrop blurs inside
the lens. Dialogs and toasts may use a stronger soft shadow because they float
over the current context. The timer’s faint grid and single lime glow are
deliberate signature details, not a reusable background effect.

## Shapes

The outer shell uses a 30px radius. Major content cards use 26px. Dialogs use
22–24px. Inputs use 12px. Primary actions, utility controls, task checks, timer
presets, and status badges use pill or circular geometry. The softness is a
core part of the product’s character. The active dock lens remains circular at
every breakpoint, including while it is dragged between destinations.

## Components

### Buttons

- **Primary:** charcoal, white type, compact pill.
- **Focus:** focus lime, charcoal type, compact pill.
- **Utility:** circular or pill-shaped neutral controls.
- **States:** tonal hover, visible violet focus ring, subtle active response.

### Cards / Containers

- **Task / Note / Rhythm:** warm white or paper, 26px radius, quiet border.
- **Focus:** charcoal, faint grid, restrained lime glow.
- **Habits:** full lavender container with translucent white inner tiles.

### Floating Navigation

- Five equal targets ordered Today, Habits, Home, Focus, Notes.
- A circular liquid lens slides continuously on hover or drag, then settles on
  the selected tab in about 360ms.
- Labels remain visible; the selected Focus tab may show a live timer dot.
- Arrow keys move between tabs, Home/End jump to the ends, and reduced-motion,
  reduced-transparency, and forced-color modes receive explicit fallbacks.

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
- **Do** keep Home as a concise launchpad rather than a duplicate dashboard.

### Don’t:

- **Don’t** desaturate the accent into sage or reduce lavender to tiny chips.
- **Don’t** square the cards and controls in pursuit of generic minimalism.
- **Don’t** remove eyebrow rhythm, timer texture, or the single glow merely to
  satisfy a generic design rule.
- **Don’t** fabricate activity, progress, endorsements, or personal identity.
- **Don’t** add remote assets or dependencies merely for decoration.
- **Don’t** place all five primary functions back into one scrolling page.
