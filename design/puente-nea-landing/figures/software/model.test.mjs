// Run: node figures/software/model.test.mjs
import assert from "node:assert/strict";
import { TOTAL, CHIPS, readoutOf } from "./model.mjs";

assert.equal(TOTAL, 212);
assert.equal(CHIPS.before, "6 planillas · 3 números distintos");
assert.equal(readoutOf(0), "Antes: 6 planillas con números distintos · Ejemplo ilustrativo");
assert.equal(readoutOf(1), "Con tu sistema: 212 u. de Yerba 1 kg en 2 depósitos · Ejemplo ilustrativo");
assert.equal(readoutOf(1, 1), "Depósito Norte: 48 u. de Yerba 1 kg · Ejemplo ilustrativo");
assert.equal(readoutOf(1, 2), readoutOf(1));
console.log("model ok");
