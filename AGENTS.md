# Agent instructions

## UI rules

Every UI change (landing, `hablemos.html`, figures, designs under `design/`) follows these rules:

- **Responsive**: design and check at 375px, 768px and 1280px+. Adapt layout per breakpoint; never just scale the desktop version down.
- **Hierarchy**: less text, a clearly emphasized CTA, easy to scan.
- **Tokens**: both pages load `styles/landing.css`; use its `:root` custom properties for colors and fonts (`--surface`, `--terra-tint`, `--river-tint` for fills) and keep spacing, radii and shadows consistent. Add a token instead of hard-coding a new value.
- **Consistency**: buttons, cards, inputs and modals look and behave the same everywhere (reuse `.btn`, `.btn-primary`, `.btn-ghost`). Dark mode is the nav toggle (`.theme-toggle`, `src/theme.mjs`) that sets `data-theme` on `<html>`; the `:root[data-theme="dark"]` token block restyles everything, light is the default and the inline `<head>` script only applies a saved dark choice; illustrations (`.figure`, `.svc-card`) keep the light palette; the hero bridge (`.hero-dots`, `src/hero-dots.mjs`) is drawn as dots in the theme's `--terra`, `--terra-ink` and `--river-ink`; it builds once per page load, then only breathes, glitches, carries pulses along the deck and (fine pointers only) follows the cursor, keeps the copy zone free of dots, pauses off screen and when the tab is hidden, and under reduced motion is the finished bridge drawn once. On accent fills use `var(--cream)` for text so it flips with the fill.
- **Accessibility**: meaningful `alt` on images, `aria-label` on icon-only controls, sufficient contrast (WCAG AA), visible focus.
- **States**: implement empty, error, success and loading states, not only the happy path.
