# Agent instructions

## UI rules

Every UI change (landing, `hablemos.html`, figures, designs under `design/`) follows these rules:

- **Responsive**: design and check at 375px, 768px and 1280px+. Adapt layout per breakpoint; never just scale the desktop version down.
- **Hierarchy**: less text, a clearly emphasized CTA, easy to scan.
- **Tokens**: both pages load `styles/landing.css`; use its `:root` custom properties for colors and fonts (`--surface`, `--terra-tint`, `--river-tint` for fills) and keep spacing, radii and shadows consistent. Add a token instead of hard-coding a new value.
- **Consistency**: buttons, cards, inputs and modals look and behave the same everywhere (reuse `.btn`, `.btn-primary`, `.btn-ghost`). Dark mode is the nav toggle (`.theme-toggle`, `src/theme.mjs`) that sets `data-theme` on `<html>`; the `:root[data-theme="dark"]` token block restyles everything, and the inline `<head>` script picks the first theme from the saved choice or the OS; illustrations (`.figure`, `.hero-stage`) keep the light palette. On accent fills use `var(--cream)` for text so it flips with the fill.
- **Accessibility**: meaningful `alt` on images, `aria-label` on icon-only controls, sufficient contrast (WCAG AA), visible focus.
- **States**: implement empty, error, success and loading states, not only the happy path.
