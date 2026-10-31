import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CONTACT, messageOf, mailtoHref, payloadOf, whatsappHref } from '../src/contact-message.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sample = { name: ' Laura Gómez ', business: '', channel: 'whatsapp', contact: '379 412-3456', topics: ['Planillas y stock'], problem: 'Llevamos el stock en tres planillas.', website: '' };

test('contact destinations: confirmed email, example WhatsApp, no backend yet', () => {
  assert.equal(CONTACT.email, 'holapuentenea@gmail.com');
  assert.match(CONTACT.whatsapp, /^549\d{10}$/);
  assert.equal(CONTACT.endpoint, '');
});

test('the message names the person when the business is left empty', () => {
  const { subject, body } = messageOf(sample);
  assert.equal(subject, 'Consulta de Laura Gómez');
  assert.match(body, /^Nombre: Laura Gómez$/m);
  assert.match(body, /^Negocio: Sin indicar$/m);
  assert.match(body, /^Responder por WhatsApp: 379 412-3456$/m);
  assert.match(body, /^Temas: Planillas y stock$/m);
  assert.match(body, /Llevamos el stock en tres planillas\.$/);
  assert.equal(messageOf({ ...sample, business: 'Ferretería del Centro', topics: [] }).subject, 'Consulta de Ferretería del Centro');
  assert.match(messageOf({ ...sample, topics: [] }).body, /^Temas: Sin marcar$/m);
});

test('mailto opens a prefilled email to the team address', () => {
  const href = mailtoHref(sample);
  assert.ok(href.startsWith('mailto:holapuentenea@gmail.com?subject='));
  const params = new URLSearchParams(href.split('?')[1]);
  assert.deepEqual({ subject: params.get('subject'), body: params.get('body') }, messageOf(sample));
});

test('the backend payload is trimmed and keeps the honeypot for the server to check', () => {
  assert.deepEqual(payloadOf(sample), { name: 'Laura Gómez', business: '', channel: 'whatsapp', contact: '379 412-3456', topics: ['Planillas y stock'], problem: 'Llevamos el stock en tres planillas.', website: '' });
});

test('whatsapp links carry a short prefilled greeting', () => {
  assert.equal(whatsappHref('Hola'), `https://wa.me/${CONTACT.whatsapp}?text=Hola`);
});

test('the contact page offers real destinations, a honeypot and the privacy policy', () => {
  const page = read('hablemos.html');
  assert.doesNotMatch(page, /envío todavía no está habilitado|todavía no se envían ni se guardan/i);
  assert.match(page, new RegExp(`href="mailto:${CONTACT.email}"`));
  assert.match(page, new RegExp(`href="https://wa\\.me/${CONTACT.whatsapp}\\?text=`));
  assert.match(page, /<input[^>]*name="website"[^>]*tabindex="-1"/);
  assert.match(page, /href="\.\/privacidad\.html"/);
  for (const id of ['notice-mail', 'notice-sent', 'notice-error']) assert.match(page, new RegExp(`id="${id}"[^>]*hidden`));
});

test('the privacy policy exists and names the law, the data and how to reach us', () => {
  assert.ok(existsSync(new URL('../privacidad.html', import.meta.url)));
  const page = read('privacidad.html');
  assert.match(page, /Ley 25\.326/);
  assert.match(page, new RegExp(CONTACT.email.replace('.', '\\.')));
  assert.match(page, /<h1[^>]*>Política de privacidad<\/h1>/);
  assert.match(page, /href="\.\/styles\/landing\.css"/);
});
