const software = {
  before: {
    heading: 'Antes · 6 planillas, 3 respuestas',
    steps: ['Buscar entre planillas', 'Preguntar por WhatsApp', 'Volver a cargar el pedido'],
    readout: 'Antes: buscar, preguntar y cargar de nuevo · Ejemplo ilustrativo',
  },
  after: {
    heading: 'Con tu sistema · un dato, menos pasos',
    steps: ['Registrar pedido desde el celular', 'Stock compartido al día', 'Depósito ve qué preparar'],
    readout: 'Con tu sistema: ventas y depósito ven el mismo pedido, sin volver a cargarlo · Ejemplo ilustrativo',
  },
};
export const softwareView = after => software[after ? 'after' : 'before'];

const order = {
  normal: {
    label: 'Pedido #1043 · 10 unidades · Ana', status: 'Datos completos · Stock disponible',
    active: [true, true, true], stock: 110, invoice: 'A–0457 · Ana', depot: 'Preparar 10 u.',
    readout: '3 acciones completadas: stock, factura y depósito · Ejemplo ilustrativo',
  },
  problem: {
    label: 'Pedido #1044 · 150 unidades · Leo', status: 'Falta stock: hay 120, pide 150',
    active: [false, false, false], stock: 120, invoice: 'Sin emitir', depot: 'Sin aviso',
    readout: 'Pedido en pausa: falta stock, necesita tu revisión · Ejemplo ilustrativo',
  },
};
export const orderView = problem => order[problem ? 'problem' : 'normal'];

const messages = {
  precio: { question: '¿Cuánto sale el taladro 650W?', answer: 'Sale $ 89.900. ¿Te lo reservo?', source: 'Precios', readout: 'Respondido con tu lista de precios' },
  turno: { question: 'Agendame el jueves a las 10 h.', answer: 'Listo, te agendé el jueves a las 10 h.', source: 'Agenda', readout: 'Turno agendado en tu agenda' },
  pedido: { question: 'Quiero 10 bultos de yerba', answer: 'Listo, pedido cargado para mañana.', source: 'Pedidos', readout: 'Pedido cargado en tus pedidos' },
  reclamo: { question: 'Tengo un reclamo', answer: 'Te paso con una persona del equipo.', source: 'Persona del equipo', readout: 'Derivado a una persona del equipo' },
};
export const assistantView = type => messages[type];

export function attachDemos(doc) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = doc.querySelector('.software-scene');
  const toggle = doc.querySelector('#software-toggle');
  let after = false;
  toggle.addEventListener('click', () => {
    after = !after;
    const view = softwareView(after);
    scene.dataset.view = after ? 'after' : 'before';
    doc.querySelector('#software-heading').textContent = view.heading;
    view.steps.forEach((step, i) => { doc.querySelector(`#sw-step-${i + 1}`).textContent = step; });
    doc.querySelector('#software-readout').textContent = view.readout;
    toggle.innerHTML = after ? 'Ver antes <span aria-hidden="true">→</span>' : 'Ver con tu sistema <span aria-hidden="true">→</span>';
  });

  const stations = [...doc.querySelectorAll('.station')];
  const orderButton = doc.querySelector('#auto-order');
  const problemButton = doc.querySelector('#auto-problem');
  let run = 0;
  function renderOrder(view, blocked) {
    const ticket = ++run;
    doc.querySelector('#order-label').textContent = view.label;
    doc.querySelector('#order-status').textContent = view.status;
    doc.querySelector('#stock-value').textContent = `${view.stock} u. ${blocked ? 'en estante' : 'restantes'}`;
    doc.querySelector('#invoice-value').textContent = view.invoice;
    doc.querySelector('#depot-value').textContent = view.depot;
    doc.querySelector('#auto-readout').textContent = view.readout;
    stations.forEach(station => station.classList.remove('active', 'stopped'));
    if (blocked) { stations[0].classList.add('stopped'); return; }
    stations.forEach((station, i) => {
      setTimeout(() => { if (run === ticket) station.classList.add('active'); }, reduce.matches ? 0 : 220 * (i + 1));
    });
  }
  orderButton.addEventListener('click', () => renderOrder(orderView(false), false));
  problemButton.addEventListener('click', () => renderOrder(orderView(true), true));

  const question = doc.querySelector('#ai-question'), answer = doc.querySelector('#ai-answer');
  const source = doc.querySelector('#ai-source'), readout = doc.querySelector('#ai-readout');
  const choices = [...doc.querySelectorAll('[data-message]')];
  let selected = 'precio', messageRun = 0;
  function send(type) {
    const message = assistantView(type), ticket = ++messageRun;
    question.textContent = message.question;
    answer.textContent = 'Consultando tu información…';
    source.textContent = '';
    readout.textContent = `Buscando en ${message.source}…`;
    doc.querySelectorAll('.knowledge span, .human').forEach(el => el.classList.remove('active'));
    const destination = type === 'reclamo' ? doc.querySelector('#ai-human') : doc.querySelector(`#knowledge-${['precio', 'turno', 'pedido'].indexOf(type)}`);
    destination.classList.add('active');
    setTimeout(() => {
      if (ticket !== messageRun) return;
      answer.textContent = message.answer;
      source.textContent = type === 'reclamo' ? 'Derivado a una persona' : `Usó tu info: ${message.source}`;
      readout.textContent = `${message.readout} · Ejemplo ilustrativo`;
    }, reduce.matches ? 0 : 650);
  }
  choices.forEach(choice => choice.addEventListener('click', () => {
    selected = choice.dataset.message;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    send(selected);
  }));
  doc.querySelector('#ai-send').addEventListener('click', () => send(selected));
}
