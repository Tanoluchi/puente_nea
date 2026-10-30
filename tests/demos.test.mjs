import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softwareView, orderView, assistantView } from '../src/demos.mjs';

test('software unifies stock and removes repeated order entry without invented time savings', () => {
  const before = softwareView(false), after = softwareView(true);
  assert.match(before.steps.join(' '), /planillas.*WhatsApp.*cargar/i);
  assert.deepEqual(after.steps, ['Registrar pedido desde el celular', 'Stock compartido al día', 'Depósito ve qué preparar']);
  assert.match(after.readout, /sin volver a cargar/i);
  assert.doesNotMatch(after.readout, /\d+\s*(minutos|horas)/i);
});

test('normal order activates three actions; unavailable stock activates none', () => {
  const ok = orderView(false), blocked = orderView(true);
  assert.deepEqual(ok.active, [true, true, true]);
  assert.match(ok.readout, /3 acciones/);
  assert.deepEqual(blocked.active, [false, false, false]);
  assert.equal(blocked.stock, 120);
  assert.match(blocked.readout, /revisión/);
});

test('assistant uses company sources and escalates complaints', () => {
  assert.match(assistantView('precio').source, /Precios/);
  assert.match(assistantView('turno').question, /Agendame/);
  assert.match(assistantView('turno').answer, /agendé/);
  assert.match(assistantView('pedido').source, /Pedidos/);
  const complaint = assistantView('reclamo');
  assert.equal(complaint.source, 'Persona del equipo');
  assert.match(complaint.answer, /persona/);
});
