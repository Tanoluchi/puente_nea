const form = document.querySelector('#contact-form');
const steps = [...form.querySelectorAll('.contact-step')];
const progress = [...document.querySelectorAll('.contact-progress li')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const count = document.querySelector('#step-count');
const notice = document.querySelector('#delivery-notice');
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
  next.textContent = index === steps.length - 1 ? 'Revisar consulta →' : 'Siguiente →';
  count.textContent = `Paso ${index + 1} de ${steps.length}`;
  steps[index].querySelector('legend').focus();
  notice.hidden = true;
}

function advance() {
  const fields = [...steps[current].querySelectorAll('[required]')];
  const invalid = fields.filter(field => !validate(field));
  if (invalid.length) return invalid[0].focus();
  if (current < steps.length - 1) showStep(current + 1);
  else notice.hidden = false;
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
  if (current === steps.length - 1) notice.hidden = true;
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
