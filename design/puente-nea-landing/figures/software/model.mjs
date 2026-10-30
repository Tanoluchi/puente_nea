// Pure data model for the "Software a medida" figure (one product, two depósitos). No imports:
// build.mjs inlines this file into the page (with `export ` stripped), so page and build share one truth.

export const PRODUCT = "Yerba 1 kg";
export const DEPOSITS = [["Depósito Centro", 164], ["Depósito Norte", 48]];
export const TOTAL = DEPOSITS.reduce((sum, [, units]) => sum + units, 0);

// What the loose sheets say for the same product; the other two sheets lie under them.
export const SHEET_TAGS = ["164 u.", "152 u.", "170 u.", "¿?"];
export const SHEET_COUNT = 6;
export const distinctOf = (tags) => new Set(tags.filter((tag) => /\d/.test(tag))).size;

export const CHIPS = {
  before: `${SHEET_COUNT} planillas · ${distinctOf(SHEET_TAGS)} números distintos`,
  after: "1 sistema · el mismo dato en la compu y en el celular",
  toAfter: "Pasando las planillas al sistema…",
  toBefore: "Volviendo a las planillas…",
};

export function readoutOf(state, row = -1) {
  const tail = " · Ejemplo ilustrativo";
  if (!state) return `Antes: ${SHEET_COUNT} planillas con números distintos${tail}`;
  if (row >= 0 && row < DEPOSITS.length) return `${DEPOSITS[row][0]}: ${DEPOSITS[row][1]} u. de ${PRODUCT}${tail}`;
  return `Con tu sistema: ${TOTAL} u. de ${PRODUCT} en ${DEPOSITS.length} depósitos${tail}`;
}
