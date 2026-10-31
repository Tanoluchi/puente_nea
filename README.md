# Puente NEA

Landing estática de Puente NEA: software a medida, automatización e IA para pymes. Las tres demostraciones son **ilustrativas**; no modifican pedidos ni datos reales.

## Verla en local

```bash
python3 -m http.server 8000
```

Abrí [http://localhost:8000](http://localhost:8000). No necesita instalar dependencias. Para los tests de los ejemplos y la estructura: `node --test tests/*.test.mjs`.

Todas las páginas comparten `styles/landing.css`: tokens, botones, nav y footer. El modo oscuro se activa con el botón del nav y la elección se guarda en el navegador; por defecto se ve en modo claro. Las ilustraciones conservan su paleta clara. Las reglas de UI están en `AGENTS.md`.

Las páginas se generan desde `src/pages/`, con el encabezado, el nav, el isotipo y el footer en `src/partials/` y las tres ilustraciones en `src/figures/`. `node scripts/build-pages.mjs` escribe `index.html`, `contacto/index.html`, `privacidad.html` y `sitemap.xml`: editá las fuentes y regenerá; el sitio publicado solo necesita los archivos estáticos, no el directorio `design/`.

Cada archivo de `src/pages/` arranca con un bloque `<!-- page {...} -->` que fija su título, su descripción, su carpeta de salida y, si hace falta, sus estilos y módulos. El armador resuelve las rutas relativas según la profundidad de la página, así que una página nueva en una subcarpeta no necesita `../` a mano.

## Publicación

GitHub Pages publica solo el sitio, no el repositorio: `.github/workflows/pages.yml` corre los tests y, si pasan, arma `_site/` con `node scripts/build-site.mjs` y lo publica. Quedan afuera `design/`, `odd/`, los tests, los scripts, las fuentes de `src/` (solo se publican los módulos del navegador) y los archivos internos.

- Se ejecuta en cada push a `master` o a mano desde la pestaña Actions.
- Configuración necesaria una sola vez: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- Para ver lo que se publicaría: `node scripts/build-site.mjs` y servir `_site/` (`python3 -m http.server 8000 -d _site`). El script se niega a escribir en el repositorio o en una carpeta que lo contenga, porque borra la carpeta de salida antes de copiar.

## Antes de publicarla

El sitio se publica en GitHub Pages: https://tanoluchi.github.io/puente_nea/ (lo usan `canonical`, `og:url` y `sitemap.xml`).

Los enlaces «Hablemos» llevan a `contacto/`, un formulario de tres pasos; `hablemos.html` quedó como redirección para los enlaces ya compartidos. Los destinos de contacto están en `src/contact-message.mjs`:

- `email`: holapuentenea@gmail.com.
- `whatsapp`: **número de ejemplo** (+54 9 379 000-0000). Cambialo antes de publicar, en ese archivo y en `src/pages/contacto.html`; las páginas lo toman de ahí al correr `node scripts/build-pages.mjs`.
- `endpoint`: URL del backend propio. Vacío, el último paso abre el correo del visitante con la consulta armada. Con una URL, el formulario hace `POST` en JSON con `name`, `business`, `channel`, `contact`, `topics`, `problem` y `website`; el backend debe descartar los envíos con `website` completo (es una trampa para bots) y permitir el origen `https://tanoluchi.github.io` (CORS).

La política de privacidad está en `privacidad.html`; conviene que la revise alguien con formación legal. Las identidades/fotos del equipo tampoco están confirmadas: las tarjetas de «Quiénes somos» van sin foto; para sumar una, seguí el comentario HTML sobre `.team-wrap` (clase `has-photo` + `<figure class="portrait">`). Las imágenes del puente y el taller están copiadas desde `design/puente-nea-landing/assets/` a `assets/` para que la web no dependa del directorio de diseño.
