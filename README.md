# Puente NEA

Landing estática de Puente NEA: software a medida, automatización e IA para pymes. Las tres demostraciones son **ilustrativas**; no modifican pedidos ni datos reales.

## Verla en local

```bash
python3 -m http.server 8000
```

Abrí [http://localhost:8000](http://localhost:8000). No necesita instalar dependencias. Para los tests de los ejemplos y la estructura: `node --test tests/*.test.mjs`.

Las dos páginas comparten `styles/landing.css`: tokens, botones, nav y footer. El modo oscuro sigue la preferencia del sistema operativo (`prefers-color-scheme`); las ilustraciones conservan su paleta clara. Las reglas de UI están en `AGENTS.md`.

La portada se genera desde `src/landing.template.html` y los tres módulos en `src/figures/` con `node scripts/build-landing.mjs`. Editá esas fuentes y regenerá `index.html`; el sitio publicado solo necesita los archivos estáticos, no el directorio `design/`.

## Antes de publicarla

Los enlaces «Hablemos» llevan a `hablemos.html`, con un formulario de tres pasos inspirado en el artboard. Podés recorrerlo y validar los campos, pero **el envío todavía no está habilitado**: los datos no se guardan ni se transmiten. No hay dirección de correo ni proveedor de entrega confirmados. Confirmar ambos e integrar un endpoint antes de habilitar el envío o prometer una respuesta. Las identidades/fotos del equipo tampoco están confirmadas. Las imágenes del puente y el taller están copiadas desde `design/puente-nea-landing/assets/` a `assets/` para que la web no dependa del directorio de diseño.
