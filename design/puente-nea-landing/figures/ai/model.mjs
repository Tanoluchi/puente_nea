// Pure model for the assistant figure: four customer messages and how the robot handles each.
// No imports: build.mjs inlines this file into the page (with `export ` stripped).

export const TYPES = ["precio", "turno", "pedido", "reclamo"];
export const DRAWERS = ["Precios", "Agenda", "Pedidos"];
export const PERSON = "Persona del equipo";

// Footer chip, customer message, assistant reply, and where the answer comes from (-1: a person).
export const CHIP = { precio: "Precio", turno: "Turno", pedido: "Pedido", reclamo: "Reclamo" };
export const ASK = { precio: "¿Cuánto sale el taladro 650W?", turno: "Agendame el jueves a las 10 h.", pedido: "Quiero 10 bultos de yerba", reclamo: "Tengo un reclamo" };
export const REPLY = { precio: "Sale $ 89.900. ¿Te lo reservo?", turno: "Listo, te agendé el jueves a las 10 h.", pedido: "Listo, pedido cargado para mañana.", reclamo: "Te paso con una persona del equipo." };
export const SOURCE = { precio: 0, turno: 1, pedido: 2, reclamo: -1 };
const DONE = { precio: "Respondido con tu lista de precios", turno: "Turno agendado en tu agenda", pedido: "Pedido cargado en tus pedidos", reclamo: "Derivado a una persona del equipo" };
export const NOTE = " · Ejemplo ilustrativo";

// Timeline of one message (ms): the customer writes, the robot looks it up, then it answers.
export const LOOK_AT = 800;
export const REPLY_AT = 2200;
export const HOLD = 3600;
export const phaseAt = (ms) => (ms < LOOK_AT ? "ask" : ms < REPLY_AT ? "look" : "reply");

export const nextOf = (type) => TYPES[(TYPES.indexOf(type) + 1) % TYPES.length];
export const sourceOf = (type) => (SOURCE[type] < 0 ? `Lo deriva a: ${PERSON}` : `Usó tu info: ${DRAWERS[SOURCE[type]]}`);
export const poseOf = (type) => (SOURCE[type] < 0 ? "bell" : `shelf${SOURCE[type]}`);
export const readoutOf = (type, phase) =>
  phase === "ask" ? "Entra un mensaje de un cliente…"
  : phase === "look" ? (SOURCE[type] < 0 ? "Toca el timbre para llamar a alguien del equipo…" : `Busca en ${DRAWERS[SOURCE[type]]}…`)
  : DONE[type] + NOTE;
