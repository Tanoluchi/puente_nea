# Puente NEA design system

Synced from project source (read-only). Every entry names its source. Values not found in source are not listed.
Sources read: `styles/landing.css`, `styles/figures/software.css`, `styles/figures/auto.css`, `index.html` (isotype symbol, copy). No Tailwind config, no component library, no token file.
Not a proposed starter: all values below exist in the project.

Notes from the recent polish: buttons radius 10px, tags 8px, no uppercase tracked labels, no italics (emphasis is colour only), weights 400-600 (headings 500), 4px spacing grid, no glows, no looping motion. Illustrations (`.figure`, `.hero-stage`) keep the light palette in dark mode.

## Colors (light, default)

Source for all rows: `styles/landing.css` `:root, .figure, .hero-stage`.

| Token | Value | Usage |
| --- | --- | --- |
| `--cream` | `#FCF8EF` | Page background; text on accent/ink fills |
| `--paper` | `#F5EDDE` | Alternate section background (services, pains band, help box) |
| `--line` | `#E6D9C3` | Borders and dividers |
| `--ink` | `#1E2A2F` | Body text, primary button fill, headings |
| `--ink-2` | `#4A5459` | Secondary text, leads, meta |
| `--terra` | `#D9572B` | Focus ring, accent borders, spot dots (never small text) |
| `--terra-ink` | `#A23C16` | Accent text, eyebrows, hover fill, step pins |
| `--river` | `#A8CFE3` | Declared accent; not used by a rule in `landing.css` |
| `--river-ink` | `#2B6684` | Cool accent text |
| `--petrol` | `#274B57` | Dark bands: about, process banner, footer, tag |
| `--surface` | `#FFFFFF` | Cards (`.step .card`) |
| `--terra-tint` | `#FBE6DA` | Warm fill (icon tile, `.when` pill) |
| `--river-tint` | `#E2EFF6` | Cool fill (icon tile, result strip) |

## Colors (dark, `:root[data-theme="dark"]`)

Source: `styles/landing.css`. Overrides only: `--cream #12191C`, `--paper #182327`, `--surface #1C282D`, `--line #2E3C42`, `--ink #EEE8DC`, `--ink-2 #AFB9BC`, `--terra #E8693A`, `--terra-ink #F4A47F`, `--terra-tint #3A2219`, `--river-ink #8FC3DC`, `--river-tint #18303A`, `--iso-pylon #8FB6C8`. `--river`, `--petrol` keep their light values. On accent fills use `var(--cream)` for text so it flips with the fill.

## Colors (literals on petrol surfaces and brand marks)

Hard-coded in `styles/landing.css` (not tokens); allowed only where the source uses them.

| Value | Usage |
| --- | --- |
| `#FFFFFF` | Titles on petrol (`.process-banner`, `.member h3`) |
| `#EAF1F2` | Body text on petrol (`.about`, `.footer`, `.tag`) |
| `#D5E2E5` | Role / links on petrol (`.member .role`, `.footer ul a`) |
| `#C4D4D8` | Secondary text on petrol (`.about .lead`, `.team-caption`) |
| `#F4A47F` | Accent text on petrol (`.about .eyebrow`, `.footer h4`) |
| `#F08A3A` | Isotype sun (`index.html` `--iso-sun`) |
| `#E8642F` | Isotype deck (`index.html` `--iso-deck`) |
| `#274B57` | Isotype pylon fallback (`index.html` `--iso-pylon`) |

## Typography

Source: `styles/landing.css`.

| Token / role | Value |
| --- | --- |
| `--serif` | `ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Georgia, serif` (headings, weight 500, letter-spacing -.02em) |
| `--sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (body 17px/1.6) |
| `--mono` | `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace` (eyebrow, meta, counters) |
| h1 | `clamp(44px, 6vw, 84px)` / .98 |
| h2 | `clamp(36px, 4.4vw, 56px)` / 1.05 |
| h3 | 40px (service), 30px (member), 24px (step), all line-height ~1.05-1.15 |
| Card question / summary | 22px serif, line-height 1.25-1.3 |
| `.lead` | 19px sans, `--ink-2`, max 56ch |
| Body small | 16px (buttons), 15px (card text, nav), 14px (tags, tips) |
| `.eyebrow` | mono 500 14px, `--terra-ink`, no uppercase, no tracking |
| Mono meta | 600 13px / 12px (counters, legend) |
| Min text size | 12px (mono meta) |

## Spacing

Source: `styles/landing.css`. 4px grid. Values in use: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64.
Section padding `clamp(64px, 10vw, 120px) 0`; container `.wrap` = `min(1200px, 100% - 48px)`; section head gap 48px, margin-bottom `clamp(32px, 5vw, 64px)`; card padding 24px. (`.tags li` uses 6px 12px, an off-grid exception.)

## Radius

Source: `styles/landing.css`.

| Value | Usage |
| --- | --- |
| 4px / 6px | Caption chip, `:focus-visible`, `.when` pill |
| 8px | Tags, legend chips |
| 10px | Buttons, pains chips, `.tag` |
| 12px | Portraits, tooltips |
| 16px | `.help` box |
| 20px | Cards, figures, banners, icon tiles |
| 50% / 999px | Round controls (`.theme-toggle`, `.spot button`, step pins, `.pa-tick`) |

## Shadows

| Value | Source | Usage |
| --- | --- | --- |
| `0 4px 12px rgba(30,42,47,.16)` | `styles/landing.css` | Round spot buttons |
| `0 30px 60px -40px rgba(30,42,47,.35)` | `styles/landing.css` | `.figure` |
| `0 8px 18px -14px rgba(30,42,47,.5)` | `styles/figures/auto.css` | Small white cards inside figures |
| `0 0 0 8px var(--cream)` | `styles/landing.css` | Step pin halo |

No glows. Motion: `--ease: cubic-bezier(.22,.8,.26,1)`; durations .15s-.2s for hover; one-time reveals only (`.reveal`); looping motion removed; all motion wrapped in `prefers-reduced-motion`.

## Components

Source: `styles/landing.css` unless noted.

- Focus: `:focus-visible { outline: 3px solid var(--terra); outline-offset: 3px; border-radius: 6px }`.
- `.btn`: inline-flex, gap 8px, padding 12px 24px, radius 10px, 600 16px, 1.5px border `--ink`; `:active` scale .98; `.arrow` moves 4px on hover.
- `.btn-primary`: fill `--ink`, text `--cream`; hover fill and border `--terra-ink`.
- `.btn-ghost`: transparent, text `--ink`.
- `.mini` (small button): min-height 44px, padding 8px 16px, 14px.
- Round control: 44x44 target, circle, 1.5px border `--line`, hover border `--ink` (`.theme-toggle`).
- Card (`.step .card`): `--surface`, 1px `--line`, radius 20px, hover border ink at 28%.
- Figure (`.figure`): `--cream`, 1px `--line`, radius 20px, padding 24px, shadow above.
- Tag (`.tags li`): 1px `--line`, `--cream`, radius 8px, 14px.
- Chip (`.pains-track li`): `--cream`, 1px `--line`, radius 10px, 15px 500; mobile row scrolls with `scroll-snap-type: x mandatory`.
- Pill (`.when`): mono 500 13px, `--terra-ink` on `--terra-tint`, radius 6px.
- Icon tile (`.step .ico`): 76px, radius 20px, `--terra-tint` / `--river-tint`, 1.6px round ink stroke icon.
- Section head (`.sec-head`): 2 columns, eyebrow above h2, lead right; one column under 900px.
- Dark band: `--petrol` with the petrol literals above; banner radius 20px.
- Isotype: `index.html` `<symbol id="isotipo">`, viewBox `0 -1 100 45`, brand 58x26.
- Breakpoints in use: 900px (stack columns), 640px (single column, swipe rows), 560px, 400px.
