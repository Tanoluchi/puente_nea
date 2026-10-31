import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONTACT, whatsappHref } from '../src/contact-message.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(root, 'src/landing.template.html'), 'utf8');
for (const name of ['software', 'auto', 'ai']) {
  const marker = `<!-- FIGURE_${name.toUpperCase()} -->`;
  if (!html.includes(marker)) throw new Error(`Missing ${marker}`);
  html = html.replace(marker, readFileSync(join(root, `src/figures/${name}.html`), 'utf8'));
}
// Contact destinations come from the same config the form uses
const values = {
  CONTACT_EMAIL: CONTACT.email,
  WHATSAPP_HREF: whatsappHref('Hola, quiero hacer una consulta'),
};
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Unknown placeholder {{${key}}}`);
  return values[key];
});
writeFileSync(join(root, 'index.html'), html);
