import { assistantView } from '../demos.mjs';

// IA para pymes: a customer message and the assistant's concrete reply, with the source it used
export function initAi() {
  const fig = document.getElementById('fig-bot');
  const root = fig && fig.querySelector('.pi-br');
  if (!root) return;
  const TYPES = ['precio', 'turno', 'pedido', 'reclamo'];
  const NOTE = ' · Ejemplo ilustrativo';
  const LOOK_AT = 800, REPLY_AT = 2200, HOLD = 4800;

  const nextOf = (type) => TYPES[(TYPES.indexOf(type) + 1) % TYPES.length];
  const readoutOf = (type, phase) => {
    const m = assistantView(type);
    return phase === 'ask' ? 'Entra un mensaje de un cliente…'
      : phase === 'look' ? (type === 'reclamo' ? 'Avisa a una persona del equipo…' : `Busca en ${m.source}…`)
      : m.readout + NOTE;
  };
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s) => fig.querySelector(s);
  const ask = $('[data-ask]'), askText = $('[data-ask-text]'), reply = $('[data-reply]'), replyText = $('[data-reply-text]'), srcText = $('[data-src-text]');
  const cardTitle = $('[data-card-title]'), cardRows = $('[data-card-rows]');
  const readout = $('[data-readout]'), button = $('[data-send]'), robotHit = $('[data-hit-robot]');
  const kinds = [...fig.querySelectorAll('.pi-kind')];
  let current = 'precio', timers = [], tour = 0, idle = 0, touring = true, visible = false, started = false;

  const say = (text) => { if (readout.textContent !== text) readout.textContent = text; };
  const pop = (el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };
  const set = (phase) => {
    root.dataset.kind = current;
    root.dataset.phase = phase;
    say(readoutOf(current, phase));
    if (phase === 'reply') { pop(reply); afterReply(); }
  };
  const fill = (type) => {
    const m = assistantView(type);
    askText.textContent = m.question;
    replyText.textContent = m.answer;
    srcText.textContent = m.sourceNote;
    cardTitle.textContent = m.card.title;
    cardRows.replaceChildren(...m.card.rows.map(([k, v]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; row.append(dt, dd);
      return row;
    }));
  };
  const play = (type) => {
    timers.forEach(clearTimeout);
    clearTimeout(tour);
    current = type;
    kinds.forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.kind === type)));
    fill(type);
    pop(ask);
    set('ask');
    if (still.matches) return set('reply');
    timers = [setTimeout(() => set('look'), LOOK_AT), setTimeout(() => set('reply'), REPLY_AT)];
  };
  const schedule = () => { clearTimeout(tour); if (touring && visible && !still.matches) tour = setTimeout(() => play(nextOf(current)), HOLD); };
  function afterReply() {
    if (touring) return schedule();
    clearTimeout(idle);
    idle = setTimeout(() => { touring = true; readout.setAttribute('aria-live', 'off'); schedule(); }, 8000);
  }
  const act = (type) => { touring = false; clearTimeout(idle); readout.setAttribute('aria-live', 'polite'); play(type); };
  kinds.forEach((el) => el.addEventListener('click', () => act(el.dataset.kind)));
  button.addEventListener('click', () => act(nextOf(current)));
  robotHit.addEventListener('click', () => act(nextOf(current)));
  if (!still.matches) readout.setAttribute('aria-live', 'off');
  still.addEventListener('change', schedule);
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    root.toggleAttribute('data-off', !visible);
    if (!visible) return clearTimeout(tour);
    // First time on screen, replay the first exchange from the start; afterwards keep touring.
    if (!started && touring && !still.matches) { started = true; tour = setTimeout(() => play(current), 700); }
    else if (root.dataset.phase === 'reply') schedule();
  }, { rootMargin: '0px 0px -10% 0px' }).observe(root);
}
