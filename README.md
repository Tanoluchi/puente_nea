# Puente NEA

Landing estática de Puente NEA: software a medida, automatización e IA para pymes. Las tres demostraciones son **ilustrativas**; no modifican pedidos ni datos reales.

## Verla en local

```bash
python3 -m http.server 8000
```

Abrí [http://localhost:8000](http://localhost:8000). No necesita instalar dependencias. Para los tests de los ejemplos y la estructura: `node --test tests/*.test.mjs`.

Las dos páginas comparten `styles/landing.css`: tokens, botones, nav y footer. El modo oscuro se activa con el botón del nav y la elección se guarda en el navegador; por defecto se ve en modo claro. Las ilustraciones conservan su paleta clara. Las reglas de UI están en `AGENTS.md`.

La portada se genera desde `src/landing.template.html` y los tres módulos en `src/figures/` con `node scripts/build-landing.mjs`. Editá esas fuentes y regenerá `index.html`; el sitio publicado solo necesita los archivos estáticos, no el directorio `design/`.

## Antes de publicarla

El sitio se publica en GitHub Pages: https://tanoluchi.github.io/puente_nea/ (lo usan `canonical`, `og:url` y `sitemap.xml`).

Los enlaces «Hablemos» llevan a `hablemos.html`, un formulario de tres pasos. Los destinos de contacto están en `src/contact-message.mjs`:

- `email`: holapuentenea@gmail.com.
- `whatsapp`: **número de ejemplo** (+54 9 379 000-0000). Cambialo antes de publicar, en ese archivo y en `hablemos.html`; la home lo toma de ahí al correr `node scripts/build-landing.mjs`.
- `endpoint`: URL del backend propio. Vacío, el último paso abre el correo del visitante con la consulta armada. Con una URL, el formulario hace `POST` en JSON con `name`, `business`, `channel`, `contact`, `topics`, `problem` y `website`; el backend debe descartar los envíos con `website` completo (es una trampa para bots) y permitir el origen `https://tanoluchi.github.io` (CORS).

La política de privacidad está en `privacidad.html`; conviene que la revise alguien con formación legal. Las identidades/fotos del equipo tampoco están confirmadas: las tarjetas de «Quiénes somos» van sin foto; para sumar una, seguí el comentario HTML sobre `.team-wrap` (clase `has-photo` + `<figure class="portrait">`). Las imágenes del puente y el taller están copiadas desde `design/puente-nea-landing/assets/` a `assets/` para que la web no dependa del directorio de diseño.
