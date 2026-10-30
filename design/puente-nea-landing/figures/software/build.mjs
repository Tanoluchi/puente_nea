// Builds the "Software a medida" figure (#fig-ba) of 01-puente-editorial.html: "Planillas → un sistema".
// A desk maqueta of a distribuidora on a sand base slab. The protagonist is a large monitor: before,
// it is off and the desk is covered with six loose sheets that disagree on the stock of one product;
// with the system, the sheets fly into the monitor, which lights up with one stock table (two
// depósitos and a total), and the vendedor's phone shows the same total.
// Key words are real HTML laid over the SVG (skewed onto the screen planes) so they stay legible.
// Run: node figures/software/build.mjs   (rewrites only the fig-software markers)
// Static art is generated here with the vendored Anatomy kit (MIT, see figures/kit/LICENSE).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { PRODUCT, DEPOSITS, TOTAL, SHEET_TAGS, CHIPS, readoutOf } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ARTBOARD = join(HERE, "..", "..", "01-puente-editorial.html");

const WIDTH = 600;
const PAD = 12;
const AZIMUTH = 72;
const ELEVATION = 30;

// World plan (z up). The viewer looks from +x/+y, so the monitor faces +y.
const BASE = { x: -128, y: -60, w: 256, d: 120, r: 5 };
const BASE_Z0 = -9;
const DESK = { x: -120, y: -54, w: 240, d: 108, r: 2.5 };
const LEG_TOP = 11;
const TOP = 16;
const PANEL = { x: -100, y: -40, w: 200, d: 6, r: 1.2 };
const PANEL_Z = [30, 128];
const FACE_Y = PANEL.y + PANEL.d;
const GLASS = { x: -94, w: 188, z1: 122, h: 86 };
const PHONE = { x: 66, y: 42, w: 44, d: 3.6, r: 2.4 };
const PHONE_Z = [21, 74];
const PHONE_FACE = PHONE.y + PHONE.d;
const PGLASS = { x: 69.5, w: 37, z1: 70, h: 45 };
const SHEET = { w: 30, d: 38 };
// Sheets lie on the desk front; the first four carry a tag with what they say.
const SHEETS = [
  { x: -92, y: 32, turn: -7 },
  { x: -44, y: 4, turn: 9 },
  { x: -6, y: 34, turn: -10 },
  { x: 26, y: 6, turn: 6 },
  { x: -70, y: -14, turn: 14 },
  { x: -46, y: 40, turn: 4 },
];

const BOUNDS = [...k.boxCorners(BASE, BASE_Z0, 0), ...k.boxCorners(PANEL, 0, PANEL_Z[1])];
const UNIT = BOUNDS.map((p) => k.iso(p, { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION }));
const span = (i) => Math.max(...UNIT.map((p) => p[i])) - Math.min(...UNIT.map((p) => p[i]));
const HEIGHT = Math.round(((WIDTH - PAD * 2) * span(1)) / span(0) + PAD * 2);
const P = k.fitProjection(BOUNDS, WIDTH, HEIGHT, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION });

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const r2 = (v) => Math.round(v * 100) / 100;
const box = (plan, z0, h, className, { steps = 3, bevel = 0, tone = "mid", inner = "" } = {}) => S(k.slabOf({ r: 0, ...plan }, z0, h, P, steps, bevel), { tone, className, inner });
const turner = (cx, cy, turn) => {
  const a = (turn * Math.PI) / 180;
  return ([u, v]) => [cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)];
};
const patch = (map, u0, v0, u1, v1, z, className) => `<path class="${className}" d="${k.onTop([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(map), z, P, true)}"/>`;

// ---- static parts, back to front -----------------------------------------------------------
function ground() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BASE, -4), BASE_Z0, 2, P)}"/>`];
  out.push(box(BASE, BASE_Z0, -BASE_Z0, "pnm-sand", { steps: 4, bevel: 1.2, inner: L(k.sideSeam(BASE, -3, P, 4), { tone: "faint" }) }));
  out.push(`<path class="pn-shadow" d="${k.planOutline(k.insetPlan(DESK, 2), 0, P, 2)}"/>`);
  // Legs, back ones first.
  const legs = [[DESK.x + 4, DESK.y + 4], [DESK.x + DESK.w - 9, DESK.y + 4], [DESK.x + 4, DESK.y + DESK.d - 9], [DESK.x + DESK.w - 9, DESK.y + DESK.d - 9]];
  for (const [x, y] of legs) out.push(box({ x, y, w: 5, d: 5 }, 0, LEG_TOP, "pnm-ink"));
  out.push(box(DESK, LEG_TOP, TOP - LEG_TOP, "pnm-wood", { steps: 3, bevel: 0.8 }));
  return out.join("");
}

// Two packs of yerba and one lying on them: the distribuidora's product, a small prop.
function packs() {
  const out = [];
  for (const x of [98, 108.5]) {
    out.push(box({ x, y: -52, w: 9, d: 13, r: 0.6 }, TOP, 20, "pnm-pack", { steps: 1 }));
    out.push(box({ x: x - 0.2, y: -52.2, w: 9.4, d: 13.4, r: 0.6 }, TOP + 9, 5, "pnm-leaf", { steps: 1 }));
  }
  out.push(box({ x: 97, y: -51, w: 21, d: 12, r: 0.6 }, TOP + 20, 7, "pnm-pack", { steps: 1 }));
  return out.join("");
}

function monitor() {
  const out = [];
  out.push(box({ x: -22, y: -50, w: 44, d: 18, r: 4 }, TOP, 2.4, "pnm-ink", { steps: 4, bevel: 0.6 }));
  out.push(box({ x: -5, y: -44, w: 10, d: 5, r: 1 }, TOP + 2.4, PANEL_Z[0] - TOP, "pnm-ink", { steps: 2 }));
  out.push(box(PANEL, PANEL_Z[0], PANEL_Z[1] - PANEL_Z[0], "pnm-ink", { steps: 2, bevel: 0.6 }));
  // The glass in the face plane: dark when off, a lit layer on top that the script fades in.
  const face = k.sideMatrix([GLASS.x, FACE_Y + 0.05], GLASS.z1, P, "left");
  out.push(`<g transform="${face}"><rect class="pn-glass" width="${GLASS.w}" height="${GLASS.h}" rx="1.5"/><path class="pn-glare" d="M${GLASS.w * 0.52} 0h22L${GLASS.w * 0.34 + 22} ${GLASS.h}h-22Z"/><rect class="pn-glass-lit" data-glass width="${GLASS.w}" height="${GLASS.h}" rx="1.5" opacity="0"/></g>`);
  // Power LED on the bottom bezel.
  const led = at([GLASS.x + GLASS.w - 4, FACE_Y + 0.1, PANEL_Z[0] + 3.4]);
  out.push(`<circle class="pn-led" data-led cx="${r2(led[0])}" cy="${r2(led[1])}" r="1.8"/>`);
  return out.join("");
}

function mug() {
  const cx = 102;
  const cy = -14;
  return S(k.cylinder(cx, cy, 6, TOP, 13, P, 28, 0.4), { tone: "mid", className: "pnm-terra", inner: L(k.ring(cx, cy, 4.8, TOP + 13, P), { tone: "lo" }) }) + box({ x: cx + 5.6, y: cy - 1.5, w: 3.4, d: 3, r: 1 }, TOP + 3, 7, "pnm-terra", { steps: 2 });
}

function keyboard() {
  const plan = { x: -10, y: -18, w: 82, d: 18, r: 2 };
  const keys = k.dotGrid(plan.x + 4, plan.y + 3.5, 14, 3, 5.5, TOP + 2.4, P);
  let out = box(plan, TOP, 2.4, "pnm-cream", { steps: 2, bevel: 0.4 });
  out += k.dotsSvg(keys, { size: 0.9, tone: "lo" });
  out += S(k.slabOf({ x: 80, y: -16, w: 9, d: 13, r: 4 }, TOP, 2.6, P, 4, 0.5), { tone: "mid", className: "pnm-cream" });
  return out;
}

function phone() {
  let out = box({ x: PHONE.x - 4, y: PHONE.y - 7, w: PHONE.w + 8, d: 16, r: 3 }, TOP, PHONE_Z[0] - TOP, "pnm-cream", { steps: 3, bevel: 0.5 });
  out += box(PHONE, PHONE_Z[0], PHONE_Z[1] - PHONE_Z[0], "pnm-ink", { steps: 3, bevel: 0.5 });
  const face = k.sideMatrix([PGLASS.x, PHONE_FACE + 0.05], PGLASS.z1, P, "left");
  out += `<g transform="${face}"><rect class="pn-glass" width="${PGLASS.w}" height="${PGLASS.h}" rx="2.5"/><rect class="pn-glass-lit" data-phone width="${PGLASS.w}" height="${PGLASS.h}" rx="2.5" opacity="0"/></g>`;
  return out;
}

function sheet({ x, y, turn }, i) {
  const map = turner(x, y, turn);
  const z = TOP + 0.1 + i * 0.5;
  let out = S(k.extrude(k.roundedPlan({ x: -SHEET.w / 2, y: -SHEET.d / 2, w: SHEET.w, d: SHEET.d, r: 0.6 }, 2).map(map), z, 0.6, P), { tone: "mid", crease: "faint", className: "pnm-paper" });
  const top = z + 0.6;
  const cols = [-6, 4];
  const lines = [-12, -6, 0, 6, 12];
  out += patch(map, -SHEET.w / 2, -SHEET.d / 2, SHEET.w / 2, lines[0], top, "pn-band");
  out += patch(map, cols[1], lines[1 + (i % 3)], SHEET.w / 2 - 2, lines[2 + (i % 3)], top, "pn-cell");
  out += L(cols.map((u) => k.onTop([map([u, -SHEET.d / 2]), map([u, SHEET.d / 2])], top, P)).join(""), { tone: "faint" });
  out += L(lines.map((v) => k.onTop([map([-SHEET.w / 2, v]), map([SHEET.w / 2, v])], top, P)).join(""), { tone: "faint" });
  return out;
}

// ---- moving parts: sheet homes and where they land in the screen ------------------------------
const homes = SHEETS.map((s, i) => at([s.x, s.y, TOP + 0.6 + i * 0.5]));
const targets = SHEETS.map((_, i) => at([-60 + i * 24, FACE_Y + 1, GLASS.z1 - GLASS.h * 0.5]));
const tagAt = SHEETS.slice(0, SHEET_TAGS.length).map((s, i) => at([s.x, s.y, TOP + 6 + i * 0.5]));

const SYNC_A = at([-30, FACE_Y + 1, PANEL_Z[0]]);
const SYNC_B = at([PHONE.x + 10, PHONE_FACE, PHONE_Z[1]]);
const SYNC_C = [(SYNC_A[0] + SYNC_B[0]) / 2 - 10, Math.max(SYNC_A[1], SYNC_B[1]) + 26];
const sync = `<g class="pn-sync" data-sync opacity="0"><path class="pn-sync-line" d="M${r2(SYNC_A[0])} ${r2(SYNC_A[1])}Q${r2(SYNC_C[0])} ${r2(SYNC_C[1])} ${r2(SYNC_B[0])} ${r2(SYNC_B[1])}"/><circle cx="${r2(SYNC_A[0])}" cy="${r2(SYNC_A[1])}" r="2"/><circle cx="${r2(SYNC_B[0])}" cy="${r2(SYNC_B[1])}" r="2"/></g>`;

// ---- HTML overlays laid onto the screen planes -----------------------------------------------
const AXIS_X = k.axisVector(P, [1, 0, 0]);
const RISE = k.screenRise(1, P);
const SKEW = r2((Math.atan2(AXIS_X[1], AXIS_X[0]) * 180) / Math.PI);
const pct = (v, of) => `${r2((v / of) * 100)}%`;
const plane = (glass, faceY) => {
  const [x, y] = at([glass.x, faceY, glass.z1]);
  return `left:${pct(x, WIDTH)};top:${pct(y, HEIGHT)};width:${pct(glass.w * AXIS_X[0], WIDTH)};height:${pct(glass.h * RISE, HEIGHT)}`;
};
const NOTE = { x: GLASS.x + 30, w: 76, z1: GLASS.z1 - 16, h: 46 };

const LABEL =
  "Maqueta del escritorio de una distribuidora. Antes: el monitor está apagado, con un papelito que pregunta cuánta yerba hay, y sobre la mesa hay seis planillas sueltas que dicen 164, 152, 170 y signos de pregunta para la misma Yerba de 1 kg. Con tu sistema: las planillas entran al monitor, que se prende con una sola tabla de stock: Depósito Centro 164 unidades, Depósito Norte 48, total 212; y el celular del vendedor muestra el mismo total, 212 unidades. Ejemplo ilustrativo.";

const svg = `<svg class="iso-svg pn-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${LABEL}">${[
  ground(),
  packs(),
  monitor(),
  mug(),
  keyboard(),
  SHEETS.map((s, i) => `<g data-sheet="${i}">${sheet(s, i)}</g>`).join(""),
  phone(),
  sync,
].join("")}</svg>`;

const rows = DEPOSITS.map(([name, units], i) => `<button class="pn-row" type="button" data-row="${i}"><span>${name}</span><b>${units} u.</b></button>`).join("");
const html = `<div class="fig-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>software a medida: planillas → un sistema</span></div>
            <div class="iso pn-sw" data-theme="light" data-state="0">
              <div class="pn-head"><span class="pn-chip" data-chip>${CHIPS.before}</span></div>
              <div class="pn-stage">${svg}
                <div class="pn-tags" data-tags>${SHEET_TAGS.map((tag, i) => `<span class="pn-tag" data-tag="${i}" style="left:${pct(tagAt[i][0], WIDTH)};top:${pct(tagAt[i][1], HEIGHT)}">${tag}</span>`).join("")}</div>
                <div class="pn-plane pn-note" data-note style="${plane(NOTE, FACE_Y)}"><span>¿Cuánta yerba hay?</span></div>
                <div class="pn-plane pn-screen" data-screen style="${plane(GLASS, FACE_Y)};opacity:0" inert>
                  <div class="pn-scr-head">Stock · ${PRODUCT}</div>
                  ${rows}
                  <button class="pn-row pn-total" type="button" data-row="${DEPOSITS.length}"><span>Total</span><b>${TOTAL} u.</b></button>
                </div>
                <div class="pn-plane pn-phone" style="${plane(PGLASS, PHONE_FACE)}">
                  <span class="pn-ph-off" data-ph-off>¿?</span>
                  <span class="pn-ph-on" data-ph-on style="opacity:0" inert><span>Yerba</span><b>${TOTAL} u.</b></span>
                </div>
              </div>
            </div>
            <div class="flow-foot">
              <span class="counter" data-readout aria-live="polite">${readoutOf(0)}</span>
              <button class="btn btn-primary mini" type="button" data-toggle><span data-label>Ver con tu sistema</span> <span class="arrow" aria-hidden="true">→</span></button>
            </div>`;

// The kit's own token blocks are dropped: the mapping below defines every token in use.
const KIT_SOURCE = readFileSync(join(HERE, "..", "kit", "iso.css"), "utf8");
const KIT_CSS = KIT_SOURCE.slice(KIT_SOURCE.indexOf(".iso-svg{"))
  .split("\n")
  .filter((line) => line && !/^\.(iso-figure|iso-plate|iso-legend|iso-keys|iso-key|iso-swatch|tb-)|^@media \(max-width/.test(line))
  .join("\n");

// Four-tone materials in brand colours: tints of one base per material, ink lines on top.
const mix = (a, b, p) => `color-mix(in srgb, ${b} ${p}%, ${a})`;
const material = (name, base, top = mix(base, "white", 30)) =>
  `.pnm-${name} { --anatomy-paper: ${mix(base, "var(--ink)", 14)}; --anatomy-top: ${top}; --anatomy-shade-3: ${mix(base, "white", 12)}; --anatomy-shade-2: ${base}; --anatomy-shade-1: ${mix(base, "var(--ink)", 10)}; --anatomy-shade-0: ${mix(base, "var(--ink)", 20)}; }`;
const MATERIALS = [
  material("paper", "#FFFDF7", "#FFFFFF"),
  material("sand", "#E2CFAE", "var(--paper)"),
  material("wood", "#D8B48A", "#E9CDA6"),
  material("terra", "var(--terra)", mix("var(--terra)", "white", 22)),
  material("ink", "#2A3A40", "#3A4C53"),
  material("cream", mix("var(--cream)", "var(--petrol)", 6), "var(--cream)"),
  material("pack", "#F2B84B", "#F7CD75"),
  material("leaf", "#5E8C6A", "#7BA585"),
].join("\n  ");

const css = `
  /* Software a medida, "Planillas → un sistema": built by figures/software/build.mjs with the Anatomy kit (MIT) */
  ${KIT_CSS.replace(/\n/g, "\n  ")}
  .pn-sw.iso[data-theme="light"] {
    --anatomy-paper: var(--cream); --anatomy-card: var(--cream); --anatomy-text: var(--ink-2); --anatomy-strong: var(--ink); --anatomy-muted: var(--ink-2);
    --anatomy-face: #fff; --anatomy-top: #fff;
    --anatomy-shade-0: ${mix("var(--cream)", "var(--ink)", 14)}; --anatomy-shade-1: ${mix("var(--cream)", "var(--ink)", 9)};
    --anatomy-shade-2: ${mix("var(--cream)", "var(--ink)", 5)}; --anatomy-shade-3: ${mix("var(--cream)", "var(--ink)", 2)};
    --anatomy-hi: ${mix("transparent", "var(--ink)", 62)}; --anatomy-mid: ${mix("transparent", "var(--ink)", 42)}; --anatomy-lo: ${mix("transparent", "var(--ink)", 28)};
    --anatomy-faint: ${mix("transparent", "var(--ink)", 14)}; --anatomy-lit: var(--terra); --anatomy-halo: var(--petrol); --anatomy-halo-opacity: .2; --anatomy-dot: var(--ink);
    --anatomy-mono: var(--mono); --anatomy-weight: .6px;
  }
  ${MATERIALS}
  #fig-ba { display: flex; flex-direction: column; overflow: hidden; background:
    radial-gradient(60% 40% at 50% 30%, color-mix(in srgb, #F08A3A 9%, transparent), transparent 72%),
    linear-gradient(to bottom, var(--cream) 0%, var(--cream) 50%, color-mix(in srgb, var(--paper) 85%, var(--cream)) 100%); }
  #fig-ba .flow-foot { flex-wrap: wrap; }
  #fig-ba .counter { flex: 1 1 220px; font-variant-numeric: tabular-nums; color: var(--ink); font-size: 14px; line-height: 1.45; }
  #fig-ba .mini { flex: none; margin-left: auto; white-space: nowrap; }
  .pn-sw { flex: 1; display: flex; flex-direction: column; justify-content: center; margin: 0 -10px; container-type: inline-size; background: transparent; }
  .pn-head { display: flex; justify-content: center; margin-bottom: 4px; }
  .pn-chip { font: 600 clamp(12px, 2.4cqw, 14px)/1.3 var(--mono); padding: 6px 12px; border-radius: 999px; text-align: center; background: #FBE6DA; color: var(--terra-ink); border: 1px solid color-mix(in srgb, var(--terra) 35%, transparent); transition: background .3s, color .3s; }
  .pn-sw[data-state="1"] .pn-chip { background: var(--petrol); color: var(--cream); border-color: var(--petrol); }
  .pn-stage { position: relative; }
  .pn-svg { touch-action: pan-y; }
  .pn-sw .pn-shadow { fill: var(--petrol); opacity: .1; }
  .pn-sw svg .pn-band { stroke: none; fill: color-mix(in srgb, var(--river) 55%, #fff); }
  .pn-sw svg .pn-cell { fill: color-mix(in srgb, var(--terra) 45%, #fff); stroke: none; }
  .pn-sw .pn-glass { fill: #1F3640; }
  .pn-sw .pn-glare { fill: #fff; opacity: .07; }
  .pn-sw .pn-glass-lit { fill: #FFFDF7; }
  .pn-sw .pn-led { fill: #6E7B80; transition: fill .3s; }
  .pn-sw .pn-led[data-on] { fill: #5FBF7F; }
  .pn-sw .pn-sync-line { fill: none; stroke: var(--terra); stroke-width: 1.4px; stroke-dasharray: 2 5; stroke-linecap: round; vector-effect: non-scaling-stroke; animation: pn-flow 1.2s linear infinite; }
  .pn-sw .pn-sync circle { fill: var(--cream); stroke: var(--terra); stroke-width: 1.2px; vector-effect: non-scaling-stroke; }
  .pn-sw[data-off] .pn-sync-line { animation-play-state: paused; }
  @keyframes pn-flow { to { stroke-dashoffset: -14; } }
  .pn-tags { position: absolute; inset: 0; pointer-events: none; }
  .pn-tag { position: absolute; transform: translate(-50%, -100%); font: 700 clamp(12px, 2.6cqw, 15px)/1 var(--mono); color: var(--terra-ink); background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 4px 6px; white-space: nowrap; box-shadow: 0 6px 12px -8px rgba(30,42,47,.5); font-variant-numeric: tabular-nums; }
  .pn-tag::after { content: ""; position: absolute; left: 50%; bottom: -5px; width: 8px; height: 8px; background: #fff; border: solid var(--line); border-width: 0 1px 1px 0; transform: translateX(-50%) rotate(45deg); }
  .pn-plane { position: absolute; transform-origin: 0 0; transform: skewY(${SKEW}deg); box-sizing: border-box; }
  .pn-note { display: grid; place-items: center; background: #FAD9A6; color: var(--ink); font: 700 clamp(12px, 2.7cqw, 16px)/1.2 var(--sans); text-align: center; text-wrap: balance; padding: 4px; rotate: -3deg; box-shadow: 0 6px 10px -6px rgba(0,0,0,.45); }
  .pn-screen { display: flex; flex-direction: column; justify-content: space-between; padding: 0 0 2%; font: 500 clamp(12px, 3.4cqw, 19px)/1.2 var(--sans); color: var(--ink); overflow: hidden; }
  .pn-scr-head { background: var(--petrol); color: var(--cream); font: 700 clamp(12px, 2.8cqw, 16px)/1.2 var(--mono); padding: .4em .6em; }
  .pn-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin: 0 4%; padding: .25em .4em; border: 0; border-bottom: 1px solid var(--line); border-radius: 4px; background: transparent; font: inherit; color: inherit; cursor: pointer; text-align: left; }
  .pn-row b { font-variant-numeric: tabular-nums; }
  .pn-row:hover { background: color-mix(in srgb, var(--river) 22%, transparent); }
  .pn-row[data-on] { background: color-mix(in srgb, var(--river) 40%, transparent); }
  .pn-row:focus-visible { outline: 2px solid var(--terra); outline-offset: -2px; }
  .pn-row:nth-of-type(odd) { background: color-mix(in srgb, var(--paper) 70%, transparent); }
  .pn-total { border-bottom: 0; color: var(--terra-ink); font-weight: 700; }
  .pn-phone { display: grid; place-items: center; text-align: center; font: 500 clamp(12px, 2.6cqw, 15px)/1.15 var(--sans); }
  .pn-phone > * { grid-area: 1 / 1; }
  .pn-ph-off { color: #8FA3AA; font-weight: 700; font-size: clamp(14px, 3.4cqw, 20px); }
  .pn-ph-on { display: flex; flex-direction: column; color: var(--ink); }
  .pn-ph-on b { color: var(--terra-ink); white-space: nowrap; letter-spacing: -.02em; }
  #fig-ba .fig-bar { gap: 12px; text-align: right; }
  @media (max-width: 560px) { .pn-sw { margin: 0 -18px; } #fig-ba .counter { font-size: 13px; } }
  @media (prefers-reduced-motion: reduce) { .pn-sw * { transition: none !important; } .pn-sw .pn-sync-line { animation: none; } }
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^\/\/.*\n/gm, "").replace(/^export /gm, "");
const flight = SHEETS.map((_, i) => [r2(homes[i][0]), r2(homes[i][1]), r2(targets[i][0]), r2(targets[i][1])]);

const js = `
  // Software a medida, "Planillas → un sistema" (generated by figures/software/build.mjs)
  (() => {
    const fig = document.getElementById('fig-ba');
    const root = fig && fig.querySelector('.pn-sw');
    if (!root) return;
    {
      ${MODEL.trim().replace(/\n/g, "\n      ")}
      const W = ${WIDTH}, H = ${HEIGHT}, FLIGHT = ${JSON.stringify(flight)}, TAGS = ${JSON.stringify(tagAt.map((p) => p.map(r2)))};
      const still = matchMedia('(prefers-reduced-motion: reduce)');
      const $ = (s) => root.querySelector(s);
      const sheets = [...root.querySelectorAll('[data-sheet]')];
      const tags = [...root.querySelectorAll('[data-tag]')];
      const rows = [...root.querySelectorAll('[data-row]')];
      const glass = $('[data-glass]'), led = $('[data-led]'), phoneLit = $('[data-phone]'), syncEl = $('[data-sync]');
      const screen = $('[data-screen]'), note = $('[data-note]'), tagBox = $('[data-tags]'), phOff = $('[data-ph-off]'), phOn = $('[data-ph-on]');
      const chip = $('[data-chip]'), readout = fig.querySelector('[data-readout]'), button = fig.querySelector('[data-toggle]'), label = button.querySelector('[data-label]');
      const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      let state = 0, p = 0, sel = -1, frame = 0, last = 0, visible = false, touring = true, dwell = 0, idle = 0;
      const say = (text) => { if (readout.textContent !== text) readout.textContent = text; };
      function draw() {
        sheets.forEach((el, i) => {
          const [hx, hy, tx, ty] = FLIGHT[i], e = sm(i * 0.06, i * 0.06 + 0.42, p);
          const dx = (tx - hx) * e, dy = (ty - hy) * e - 60 * Math.sin(Math.PI * e), s = 1 - 0.8 * e;
          el.setAttribute('transform', e ? 'translate(' + (hx + dx).toFixed(2) + ' ' + (hy + dy).toFixed(2) + ') scale(' + s.toFixed(3) + ') translate(' + -hx + ' ' + -hy + ')' : '');
          el.setAttribute('opacity', (1 - sm(0.6, 1, e)).toFixed(3));
          if (tags[i]) {
            tags[i].style.left = ((TAGS[i][0] + dx) / W * 100).toFixed(2) + '%';
            tags[i].style.top = ((TAGS[i][1] + dy) / H * 100).toFixed(2) + '%';
            tags[i].style.opacity = (1 - sm(0, 0.35, e)).toFixed(3);
          }
        });
        const n = sm(0, 0.16, p);
        note.style.opacity = (1 - n).toFixed(3);
        note.style.translate = '0 ' + (-40 * n).toFixed(1) + '%';
        const on = sm(0.6, 0.78, p);
        glass.setAttribute('opacity', on.toFixed(3));
        led.toggleAttribute('data-on', on > 0.5);
        screen.style.opacity = on.toFixed(3);
        rows.forEach((el, r) => { const v = sm(0.68 + r * 0.07, 0.8 + r * 0.07, p); el.style.opacity = v.toFixed(3); el.style.translate = (8 * (1 - v)).toFixed(1) + 'px 0'; });
        const ph = sm(0.86, 1, p);
        phoneLit.setAttribute('opacity', ph.toFixed(3));
        phOn.style.opacity = ph.toFixed(3);
        phOff.style.opacity = (1 - ph).toFixed(3);
        syncEl.setAttribute('opacity', ph.toFixed(3));
      }
      function settle() {
        root.dataset.state = state;
        chip.textContent = state ? CHIPS.after : CHIPS.before;
        screen.inert = phOn.inert = !state;
        tagBox.inert = note.inert = !!state;
        say(readoutOf(state, sel));
      }
      const toggle = () => {
        state = 1 - state;
        sel = -1;
        rows.forEach((el) => el.removeAttribute('data-on'));
        label.textContent = state ? 'Ver antes' : 'Ver con tu sistema';
        dwell = 0;
        if (still.matches) { p = state; draw(); settle(); return; }
        chip.textContent = state ? CHIPS.toAfter : CHIPS.toBefore;
        if (!state) root.dataset.state = 0;
        screen.inert = true;
        run();
      };
      function tick(now) {
        const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
        last = now;
        if (p !== state) {
          p = state ? Math.min(1, p + dt / 2.2) : Math.max(0, p - dt / 1.4);
          if (p === state) settle();
          draw();
        } else if (touring) {
          dwell += dt;
          if (dwell > (still.matches ? 6 : state ? 5.5 : 3.4)) toggle();
        } else {
          idle += dt;
          if (idle > 12) { touring = true; dwell = 0; readout.setAttribute('aria-live', 'off'); }
        }
        frame = visible ? requestAnimationFrame(tick) : 0;
      }
      const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
      const touch = () => { touring = false; idle = 0; readout.setAttribute('aria-live', 'polite'); run(); };
      button.addEventListener('click', () => { touch(); toggle(); });
      rows.forEach((el, r) => el.addEventListener('click', () => {
        touch();
        sel = r < DEPOSITS.length ? r : -1;
        rows.forEach((row, n) => row.toggleAttribute('data-on', n === r));
        say(readoutOf(state, sel));
      }));
      root.addEventListener('pointerdown', () => { touring = false; idle = 0; });
      readout.setAttribute('aria-live', 'off');
      new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        root.toggleAttribute('data-off', !visible);
        if (visible) run();
      }, { rootMargin: '120px 0px' }).observe(root);
      draw();
    }
  })();
`;

const replaceBetween = (text, start, end, body) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`markers not found: ${start} … ${end}`);
  return text.slice(0, from + start.length) + body + text.slice(to);
};

let pageText = readFileSync(ARTBOARD, "utf8");
pageText = replaceBetween(pageText, "<!-- fig-software:start -->", "<!-- fig-software:end -->", `\n            ${html}\n            `);
pageText = replaceBetween(pageText, "/* fig-software:css:start */", "/* fig-software:css:end */", css + "  ");
pageText = replaceBetween(pageText, "// fig-software:js:start", "// fig-software:js:end", js + "  ");
writeFileSync(ARTBOARD, pageText);
const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(1);
console.log(`wrote ${ARTBOARD}: viewBox ${WIDTH}x${HEIGHT}, html+svg ${kb(html)} KB, css ${kb(css)} KB, js ${kb(js)} KB, total ${kb(html + css + js)} KB, solids ${(svg.match(/class="iso-solid/g) || []).length}`);
