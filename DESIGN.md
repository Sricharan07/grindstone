# Design System

## Overview

Grindstone is a dark-first training instrument for focused evening practice. The physical scene is a learner at a desk after a long day, with one hour left and an interview date that is getting close. The interface is quiet enough to reduce anxiety, dense enough to respect time, and sharp enough to keep the next rep unmistakable.

## Theme

- Strategy: restrained dark product UI with one luminous yellow-green primary and a coral status accent.
- Backgrounds are neutral rather than hue-tinted; color communicates action, progress, and state.
- Surfaces step upward in luminance without decorative shadows or glass effects.

## Color Palette

```css
:root {
  --bg: oklch(0.095 0 0);
  --surface-1: oklch(0.145 0.006 113);
  --surface-2: oklch(0.19 0.008 113);
  --surface-3: oklch(0.245 0.01 113);
  --ink: oklch(0.965 0.006 113);
  --muted: oklch(0.69 0.012 113);
  --primary: oklch(0.797 0.166 113.1);
  --primary-strong: oklch(0.72 0.16 113.1);
  --accent: oklch(0.68 0.18 28);
  --success: oklch(0.72 0.14 152);
  --warning: oklch(0.78 0.15 78);
  --danger: oklch(0.64 0.2 25);
}
```

Primary is reserved for the current selection, progress, and primary action. Coral marks clocks, gates, and pressure states. Success and warning always pair color with text or an icon.

## Typography

- Geist Sans for interface copy, labels, and data.
- Geist Mono for code, timers, scores, and compact numerical readouts.
- Fixed product scale: 12, 13, 14, 16, 18, 22, 28, 36px.
- Headings use moderate weight and zero letter spacing. Body copy tops out at 70ch.

## Layout

- Desktop: 224px persistent side navigation, a flexible main stage, and an optional 300px context rail on Today and Progress.
- Tablet: compact 72px navigation and a single main column.
- Mobile: content-first layout with a five-item bottom navigation; secondary navigation lives in an overflow menu.
- Maximum reading width is 760px. Solve and Mock intentionally use the full viewport.

## Components

- Buttons: 8px radius, 40px standard height, icons from Lucide, visible hover/focus/disabled/loading states.
- Cards: only for repeated, independently actionable items; 8px radius, surface contrast or a 1px divider, never a wide decorative shadow.
- Progress bars: 6px high with labels outside the track and a text value for accessibility.
- Segmented controls: used for learning depth, language, and practice mode.
- Tooltips: required for icon-only actions.
- Inputs: 8px radius, 44px minimum height on touch surfaces, persistent labels.

## Motion

- 160-220ms state transitions using ease-out-quart.
- Motion communicates queue progress, answer feedback, panel changes, and time pressure only.
- Reduced-motion mode removes transforms and count-up effects.

## Screen Character

- Today: command center, but never an analytics dashboard. The next session dominates.
- Learn: deliberate and sequential; the PRIMM phase line makes locked steps obvious.
- Solve: serious editor, restrained chrome, feedback next to the code.
- Mock: sparse, high-pressure, visible clock, no scaffolding or celebratory effects until debrief.
