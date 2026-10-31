# Apply UI rules to the site
Branch: `feat/ui-rules` · Runner: `node --test tests/*.test.mjs` + playwright-cli audit (`.checks/audit.js`) at 375/768/1280, light and dark.
Objective: make `index.html` and `hablemos.html` follow the rules in `AGENTS.md` without changing the canvas design of page one.

## Specs
S1. "Responsive: 375/768/1280px+. No solo escalar desktop." Check: no horizontal overflow at 375/768/1280 on both pages, light and dark.
S2. "Jerarquía: menos texto, destaca CTA, fácil escanear." Check: CTA keeps the strongest emphasis; copy unchanged because the landing must match the canvas ("No cambies diseños analiza todo el diseño de la pagina 1 del canvas y igualalo").
S3. "Tokens: colores, tipografías, espaciados, bordes, sombras consistentes." Check: one token set shared by both pages; no second palette.
S4. "Consistencia: botones, cards, inputs, modales iguales. Dark mode ok."; "Cambia el dark mode de automatico a un toogle". Check: hablemos uses the landing nav, buttons and footer; dark mode is a nav toggle on both pages, remembered across reloads and pages; "Por defecto debe ser el light mode": first visit is light regardless of the OS.
S5. "Accesibilidad: alt, aria-labels, contraste bueno." Check: audit reports no missing alt/names/labels and no text under WCAG AA in either scheme.
S6. "Estados: empty, error, success, loading. No solo ideal." Check: form keeps field errors, status notice and honest "sending disabled" state.

## Tasks
T1 [S3,S4] route=parent status=done commit=40cb215: hablemos on the landing tokens and components; remove `styles/site.css`.
T2 [S5] route=parent status=done commit=40cb215: white-on-terra figure chips (3.93:1) to AA.
T3 [S4,S5] route=parent status=done commit=40cb215: automatic dark mode via tokens; hard-coded surface/text colors to tokens.
T4 [S1-S6] route=parent status=done commit=40cb215: tests, README/AGENTS.md, audit at 3 widths × 2 schemes.
T5 [S1,S4,S5] route=parent status=done commit=9cc37f8: dark mode toggle replaces automatic mode.

## Log
L1 (2026-10-31) User: "Aplica las reglas en el proyecto" (rules as in AGENTS.md: responsive 375/768/1280, hierarchy, tokens, consistency + dark mode, accessibility, states).
L2: Audit (master @216ca2d): no overflow, no missing alt/names/labels on both pages at 375/768/1280. Failures: hablemos uses `styles/site.css` (different palette, fonts, `.button`) while landing uses `styles/landing.css` (`.btn`); `.pa-tick[data-on]`, `.pi-src`, `.pi-tag-drawer` white on #D9572B = 3.93:1; no dark mode.
L3 User chose: "Dark mode automático (recomendado)" — follow prefers-color-scheme, no toggle, dark palette derived from current tokens.
L4: T1 RED was the base itself (hablemos linked styles/site.css); T2 RED `figures/auto.css: { background: var(--terra); color: #fff; }` (test also caught hidden `.pa-check-flag`); T3 RED `landing.css needs a prefers-color-scheme: dark :root block`. All GREEN: node tests 9/9.
L5: Audit (.checks/audit.js) on index.html and hablemos.html at 375/768/1280, light and dark: scrollWidth = viewport, 0 missing alt/names/labels, 0 contrast failures. Dark-mode fixes found by audit: process-banner button text and pains tag. Hero headline overlapped the light hero art in dark, so the dark block removes the -40px overlap. S2 copy unchanged by design (canvas lock). S6 form states unchanged: field errors, aria-live step count, role=status notice.
L6: Committed 40cb215 on feat/ui-rules (not pushed).
L7 (2026-10-31) User: "Cambia el dark mode de automatico a un toogle". Supersedes L3.
L8: Toggle in nav (`.theme-toggle`, aria-pressed, aria-label "Modo oscuro") on both pages; `src/theme.mjs` stores `theme` in localStorage; inline <head> script sets data-theme before paint (saved choice, else OS). RED `landing.css needs a :root[data-theme="dark"] token block`, GREEN 9/9. Browser: first visit OS light → light; click → dark + stored; reload and hablemos keep dark; OS dark first visit → dark; toggle keyboard-focusable. Fixed `.sun` class collision with team sun (icons renamed icon-sun/icon-moon); nav fits 320/375 (icon-only brand ≤400px, "← Inicio" ≤600px on hablemos). Audit light/dark × 375/768/1280 × both pages: no overflow, 0 alt/name/label/contrast failures.
L9 (2026-10-31) User: "Por defecto debe ser el light mode". Supersedes the OS-based first visit from L8: the <head> script only applies a saved 'dark'; theme-color meta is the light color only.
