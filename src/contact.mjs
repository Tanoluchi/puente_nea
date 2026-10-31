import { CONTACT, mailtoHref, payloadOf } from './contact-message.mjs';

const form = document.querySelector('#contact-form');
const steps = [...form.querySelectorAll('.contact-step')];
const progress = [...document.querySelectorAll('.contact-progress li')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const count = document.querySelector('#step-count');
const [noticeMail, noticeSent, noticeError] = ['notice-mail', 'notice-sent', 'notice-error'].map(id => document.getElementById(id));
const notices = [noticeMail, noticeSent, noticeError];
const SEND_LABEL = 'Enviar consulta →';
const contact = form.elements.contact;
let current = 0;

function validate(field) {
  const value = field.value.trim();
  let message = '';
  if (field.name === 'name' && value.length < 2) message = 'Escribí tu nombre.';
  if (field.name === 'contact') {
    message = form.elements.channel.value === 'email'
      ? (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Revisá el email (ej.: nombre@negocio.com).')
      : (value.replace(/\D/g, '').length >= 10 ? '' : 'Escribí tu WhatsApp con código de área.');
  }
  if (field.name === 'problem' && value.length < 15) message = 'Contanos un poco más (al menos una oración).';
  field.setAttribute('aria-invalid', String(Boolean(message)));
  document.getElementById(`${field.id}-error`).textContent = message;
  return !message;
}

function showStep(index) {
  current = index;
  steps.forEach((step, i) => { step.hidden = i !== index; });
  progress.forEach((item, i) => {
    if (i === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.classList.toggle('done', i < index);
  });
  previous.hidden = index === 0;
  next.textContent = index === steps.length - 1 ? SEND_LABEL : 'Siguiente →';
  count.textContent = `Paso ${index + 1} de ${steps.length}`;
  steps[index].querySelector('legend').focus();
  showNotice(null);
}

function showNotice(el) {
  notices.forEach(n => { n.hidden = n !== el; });
  el?.focus();
}

function advance() {
  const fields = [...steps[current].querySelectorAll('[required]')];
  const invalid = fields.filter(field => !validate(field));
  if (invalid.length) return invalid[0].focus();
  if (current < steps.length - 1) showStep(current + 1);
  else send();
}

const formData = () => ({
  name: form.elements.name.value,
  business: form.elements.business.value,
  channel: form.elements.channel.value,
  contact: contact.value,
  topics: [...form.querySelectorAll('[name=topic]:checked')].map(input => input.value),
  problem: form.elements.problem.value,
  website: form.elements.website.value,
});

async function send() {
  const data = formData();
  // No backend yet: hand a prefilled email to the visitor's mail app
  if (!CONTACT.endpoint) {
    document.getElementById('mail-link').href = mailtoHref(data);
    return showNotice(noticeMail);
  }
  next.disabled = true;
  next.setAttribute('aria-busy', 'true');
  next.textContent = 'Enviando…';
  try {
    const response = await fetch(CONTACT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadOf(data)),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    document.getElementById('sent-channel').textContent = data.channel === 'whatsapp' ? 'WhatsApp' : 'email';
    form.querySelectorAll('.contact-step, .contact-actions').forEach(el => { el.hidden = true; });
    showNotice(noticeSent);
  } catch {
    // keep everything typed so the visitor can retry or write by email
    showNotice(noticeError);
  } finally {
    next.disabled = false;
    next.removeAttribute('aria-busy');
    next.textContent = SEND_LABEL;
  }
}

form.addEventListener('submit', event => { event.preventDefault(); advance(); });
next.addEventListener('click', advance);
previous.addEventListener('click', () => { if (current > 0) showStep(current - 1); });
form.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('input:not([type=radio]):not([type=checkbox])')) {
    event.preventDefault(); advance();
  }
});
form.addEventListener('input', event => {
  if (event.target.matches('[required]') && event.target.getAttribute('aria-invalid') === 'true') validate(event.target);
  if (current === steps.length - 1) showNotice(null);
});
form.addEventListener('change', event => {
  if (event.target.name !== 'channel') return;
  const whatsapp = event.target.value === 'whatsapp';
  contact.type = whatsapp ? 'tel' : 'email';
  contact.inputMode = whatsapp ? 'tel' : 'email';
  contact.autocomplete = whatsapp ? 'tel' : 'email';
  contact.placeholder = whatsapp ? '379 412-3456' : 'nombre@negocio.com';
  document.querySelector('#contact-label').textContent = whatsapp ? 'Tu WhatsApp' : 'Tu email';
  contact.value = '';
  contact.removeAttribute('aria-invalid');
  document.querySelector('#contact-error').textContent = '';
});
