// Pure model for the automation figure: one order through the station, or one that needs review.
// No imports: build.mjs inlines this file into the page (with `export ` stripped), so the page and
// the build share one truth. Every run is the same illustrative example; nothing accumulates.

export const ORDERS = {
  ok: { id: 1043, units: 10, client: "Ana" },
  problem: { id: 1044, units: 150, client: "Leo" },
};
export const STOCK = 120;
export const BOX_UNITS = 10;

// Seconds from the moment the order arrives.
export const T = { gate: 1.6, lamp1: 2.0, lamp2: 2.6, pass: 3.3, acts: [3.9, 4.5, 5.1], flag: 2.9, end: { ok: 9, problem: 8 } };

export const ACTIONS = [
  { todo: "Actualizar stock", done: "Stock actualizado", short: "Stock" },
  { todo: "Emitir factura", done: "Factura emitida", short: "Factura" },
  { todo: "Avisar al depósito", done: "Depósito avisado", short: "Depósito" },
];

export const orderLine = (kind) => {
  const o = ORDERS[kind];
  return { id: `Pedido #${o.id}`, rest: `${o.units} unidades · Cliente ${o.client}` };
};

export function detailOf(index, kind, done) {
  const o = ORDERS[kind];
  if (index === 0) return done ? `${STOCK} → ${STOCK - o.units} u.` : `${STOCK} u. en estante`;
  if (index === 1) return done ? `A-0457 · ${o.client}` : "sin emitir";
  return done ? `Preparar ${o.units} u.` : "sin aviso";
}

const clamp = (v) => Math.max(0, Math.min(1, v));

// Everything the figure shows at time t of a run of `kind` ("ok" or "problem").
export function stateAt(kind, t) {
  const bad = kind === "problem";
  const end = T.end[kind];
  // Ticket: 0 at the phone, 1 under the gate, 2 at the dock past it (only when validated).
  const ticket = t < T.gate ? clamp(t / T.gate) : bad || t < T.lamp2 + 0.2 ? 1 : 1 + clamp((t - T.lamp2 - 0.2) / (T.pass - T.lamp2 - 0.2));
  const lamps = [t >= T.lamp1 ? "ok" : t >= T.gate ? "scan" : "off", t >= T.lamp2 ? (bad ? "bad" : "ok") : t >= T.lamp1 ? "scan" : "off"];
  const acts = T.acts.map((at) => !bad && t >= at);
  const pulses = T.acts.map((at) => (bad || t < T.pass - 0.1 || t >= at ? -1 : (t - (T.pass - 0.1)) / (at - (T.pass - 0.1))));
  const flag = bad && t >= T.flag;
  const done = acts.every(Boolean);
  let phase = "check";
  if (t < T.gate) phase = "enter";
  else if (flag) phase = "paused";
  else if (done) phase = "done";
  else if (t >= T.lamp2) phase = "act";
  let readout = "Revisando datos y stock…";
  if (t < T.gate) readout = `Entra el pedido #${ORDERS[kind].id}…`;
  else if (flag) readout = "Pedido en pausa: falta stock · necesita tu revisión · Ejemplo ilustrativo";
  else if (done) readout = "3 acciones completadas · Ejemplo ilustrativo";
  else if (!bad && t >= T.lamp2) readout = "Actualizando stock, factura y depósito…";
  return { kind, phase, ticket, lamps, acts, pulses, flag, done, readout, stock: acts[0] ? STOCK - ORDERS.ok.units : STOCK, over: t >= end };
}
