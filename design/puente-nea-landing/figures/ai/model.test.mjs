// Run: node --test figures/ai/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, ASK, REPLY, LOOK_AT, REPLY_AT, phaseAt, nextOf, sourceOf, poseOf, readoutOf } from "./model.mjs";

test("phases follow the timeline", () => {
  assert.deepEqual([0, LOOK_AT - 1, LOOK_AT, REPLY_AT - 1, REPLY_AT, 99999].map(phaseAt), ["ask", "ask", "look", "look", "reply", "reply"]);
});

test("messages cycle in order", () => {
  assert.deepEqual(TYPES.map(nextOf), ["turno", "pedido", "reclamo", "precio"]);
});

test("each answer names the business data it used, or the person", () => {
  assert.equal(sourceOf("precio"), "Usó tu info: Precios");
  assert.equal(sourceOf("pedido"), "Usó tu info: Pedidos");
  assert.equal(sourceOf("reclamo"), "Lo deriva a: Persona del equipo");
  assert.deepEqual(TYPES.map(poseOf), ["shelf0", "shelf1", "shelf2", "bell"]);
});

test("booking is requested before the assistant confirms it", () => {
  assert.match(ASK.turno, /agend[aá]me/i);
  assert.match(REPLY.turno, /agend[eé]/i);
  assert.match(readoutOf("turno", "reply"), /agendado/i);
});

test("readouts describe what happened and mark data as illustrative", () => {
  assert.equal(readoutOf("turno", "look"), "Busca en Agenda…");
  assert.equal(readoutOf("precio", "reply"), "Respondido con tu lista de precios · Ejemplo ilustrativo");
  assert.equal(readoutOf("reclamo", "reply"), "Derivado a una persona del equipo · Ejemplo ilustrativo");
});
