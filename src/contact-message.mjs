// Where contact requests go. One place to change them.
export const CONTACT = {
  email: 'holapuentenea@gmail.com',
  // shortcut: example number (+54 9 379 000-0000) until the team picks one; also in hablemos.html
  whatsapp: '5493790000000',
  // URL of the team's backend (POST, JSON). Empty: the form hands a prefilled email to the visitor's mail app.
  endpoint: '',
};

const clean = value => String(value ?? '').trim();

export function payloadOf(data) {
  return {
    name: clean(data.name),
    business: clean(data.business),
    channel: data.channel === 'whatsapp' ? 'whatsapp' : 'email',
    contact: clean(data.contact),
    topics: (data.topics ?? []).map(clean).filter(Boolean),
    problem: clean(data.problem),
    website: clean(data.website), // honeypot: people leave it empty
  };
}

export function messageOf(data) {
  const d = payloadOf(data);
  return {
    subject: `Consulta de ${d.business || d.name}`,
    body: [
      `Nombre: ${d.name}`,
      `Negocio: ${d.business || 'Sin indicar'}`,
      `Responder por ${d.channel === 'whatsapp' ? 'WhatsApp' : 'email'}: ${d.contact}`,
      `Temas: ${d.topics.length ? d.topics.join(', ') : 'Sin marcar'}`,
      '',
      d.problem,
    ].join('\n'),
  };
}

export function mailtoHref(data, to = CONTACT.email) {
  const { subject, body } = messageOf(data);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function whatsappHref(text, number = CONTACT.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
