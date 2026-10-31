# Multipage site (Alternative B, in phases)
Branch: `feat/ui-rules` · Runner: `node --test tests/*.test.mjs` + Chrome screenshots at 375/768/1280, light and dark.
Source: the UX/UI audit approved by the user ("Si lo apruebo"). Pages are static HTML built by `scripts/build-landing.mjs`; UI copy is Spanish with voseo.

## Specs
S1. Contact that works: "Proponé una experiencia simple y accesible para que un potencial cliente pueda contarnos su necesidad. Evaluá formularios breves, contacto por WhatsApp, correo electrónico y CTA contextuales." / "La experiencia no debe exigir conocimientos técnicos ni demasiada información inicial." / "Todos los enlaces deben llevar a páginas o destinos reales. No crear navegación ficticia ni enlaces sin funcionalidad." Check: the form delivers to a confirmed destination; WhatsApp and email links use confirmed data; a privacy page exists before personal data is collected.
S2. Responsive navigation: "Navegación responsive." / "No quiero un menú sobrecargado." / "CTA principal visible." Check: below 900px a 44px menu button (aria-expanded, aria-controls) opens the section links; it closes on link click and Escape (focus back on the button); the Hablemos CTA stays visible; no horizontal overflow at 375/768/1280, light and dark.
S3. Metadata: "Metadatos por página." Check: the home has a meta description and Open Graph title/description/type/locale/site name; canonical, og:url and og:image wait for the confirmed domain.
S4. Form: "En el formulario en la parte de nombre del negocio, no debe de ser obligatorio ese campo. solamente el nombre" / "Sigue apareciendo ... no deberia de pedir el nombre del negocio". Check: no copy on the contact page implies the business name is required.
S5. Integrity: "No inventes datos empresariales." / "Evitá crear páginas vacías o con contenido artificial." / "No inventes clientes, testimonios ni resultados comerciales." Check: every new page, link and fact comes from existing site content or data the user provides.
S6. Multipage architecture (phases 1-5 of the audit): Home concise; `/servicios/` hub + `/servicios/software-a-medida/`, `/servicios/automatizaciones/`, `/servicios/inteligencia-artificial/`; `/como-trabajamos/` with "1. Nos contás tu problema o idea. 2. Analizamos tus necesidades. 3. Diseñamos una solución. 4. Desarrollamos y validamos. 5. Implementamos y acompañamos."; `/contacto/`; `/nosotros/` and `/proyectos/` only with real content; footer grouped "Empresa / Servicios / Contacto / Información" keeping its illustration. "Conservá las ilustraciones y figuras que aportan valor." "Priorizá la reutilización de componentes."

S7. Hero bridge: "Ademas la imagen del puente quiero que lo hagas motion y que sea pixelado, como este ejemplo /Users/lucianovalenzuela/Downloads/image.webp, ademas el puente quiero que quede de fondo, detras del texto principal de la landing". Reference: a dot-matrix (halftone) silhouette whose dot size follows the image, with the headline centered over it. Check: the bridge renders as dots behind the hero copy, moves, stays legible (headline contrast AA), is static under prefers-reduced-motion, pauses off-screen, works at 375/768/1280 light and dark.

## Tasks
T1 [S2] route=parent status=done commit=edfb49d: mobile menu on the home (src/nav.mjs, template nav, landing.css); drop dead src/main.mjs.
T2 [S3] route=parent status=done commit=edfb49d: home meta description + Open Graph (no domain-bound tags).
T3 [S4] route=parent status=done commit=edfb49d: contact sidebar copy no longer lists the business as required.
T4 [S1,S5] route=parent status=blocked commit=-: form delivery, WhatsApp, email, privacy page, canonical/og:url/og:image; waiting for the user's data (domain, email, WhatsApp, form receiver).
T10 [S7] route=parent status=done commit=1773f7a: dot-matrix animated bridge behind the hero copy (bridge only, no panels or hotspots).
T5 [S6] route=- status=pending commit=-: phase 1, shared head/header/footer partials in the build, `/contacto/`, sitemap and robots.
T6 [S6] route=- status=pending commit=-: phase 2, concise home (merge problems, compact demos with links, linked carousel, 5-step rail, unify CTAs, copy).
T7 [S6] route=- status=pending commit=-: phase 3, services hub + three service pages.
T8 [S6] route=- status=pending commit=-: phase 4, `/como-trabajamos/`.
T9 [S5,S6] route=- status=blocked commit=-: phase 5, `/nosotros/` and `/proyectos/`; waiting for real content from the user.

## Log
L1. User request: "Auditoría UX/UI integral y arquitectura web — Puente NEA" (full audit brief, sections 1-12, ending "Esperá mi aprobación antes de comenzar la implementación." and "La prioridad es construir una experiencia coherente y fácil de entender, no simplemente agregar más páginas o elementos visuales."). Parent delivered the audit recommending Alternative B in phases (0 blockers, 1 base multipage, 2 concise home, 3 services, 4 cómo trabajamos, 5 nosotros/proyectos with real content).
L2. User: "Si lo apruebo".
L3. Phase 0 split: T1-T3 need no business data and start now; T4 waits for the user's domain, email, WhatsApp and form receiver.
L4. T1-T3 verified in Chrome (menu at 375 light / 768 dark: opens, Escape closes and returns focus, link closes; hidden at 1280; no overflow) and committed in edfb49d. Suite 25/25.
L5. User: "Ademas la imagen del puente quiero que lo hagas motion y que sea pixelado, como este ejemplo /Users/lucianovalenzuela/Downloads/image.webp, ademas el puente quiero que quede de fondo, detras del texto principal de la landing". Both hero assets (assets/hero-puente-v2.jpg, design/puente-nea-landing/assets/hero-puente.jpg) bake the four software panels into the picture, so the panels and their four hotspots need a decision.
L6. User chose "Solo el puente en puntos (recomendado)": dots for the bridge, river and sun only; the four panels and their hotspots are removed. Source: assets/hero-puente-v2.jpg cropped from row 260 (panels sit in rows 130-250), sampled at runtime in a canvas; no new asset.
L7. T10 verified in Chrome: 1280 light/dark, 768 dark, 375 light, 375 dark reduced motion; canvas animates (frames differ) and is static under reduced motion; no ink under the copy (measured 0); no page overflow; no console errors. Suite 30/30. Commit 1773f7a.
