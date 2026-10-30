// Run: node --test figures/auto/model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { stateAt, T, STOCK } from "./model.mjs";

test("an ok order is validated, then the three actions light in order", () => {
  assert.equal(stateAt("ok", 0).phase, "enter");
  assert.deepEqual(stateAt("ok", T.lamp2).lamps, ["ok", "ok"]);
  assert.deepEqual(stateAt("ok", T.acts[0]).acts, [true, false, false]);
  const end = stateAt("ok", T.acts[2]);
  assert.deepEqual(end.acts, [true, true, true]);
  assert.equal(end.stock, STOCK - 10);
  assert.equal(end.readout, "3 acciones completadas · Ejemplo ilustrativo");
});

test("a problem order stops at the gate and asks for review", () => {
  const s = stateAt("problem", T.end.problem);
  assert.deepEqual(s.lamps, ["ok", "bad"]);
  assert.deepEqual(s.acts, [false, false, false]);
  assert.equal(s.ticket, 1);
  assert.equal(s.flag, true);
  assert.equal(s.stock, STOCK);
  assert.equal(s.readout, "Pedido en pausa: falta stock · necesita tu revisión · Ejemplo ilustrativo");
});
