// Builds the "IA para pymes" figure into ../../01-puente-editorial.html (between the fig-ai markers).
// Run: node figures/ai/build.mjs
//
// "El mostrador que atiende": a customer-service counter on a sand slab. Our robot stands behind it,
// large and centred. A customer writes from the phone on the left (the conversation is real HTML);
// the robot pulls the drawer of the business's own information it needs (Precios, Agenda, Pedidos)
// and answers, or rings the bell so the person of the team on the right takes over.
// Drawn with the Anatomy kit (MIT, figures/kit).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { TYPES, DRAWERS, PERSON, CHIP, ASK, REPLY, sourceOf, readoutOf } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ARTBOARD = join(HERE, "..", "..", "01-puente-editorial.html");

// ---- scene layout (model units; z up, viewer at +x +y) ------------------------------------
const WIDTH = 600;
const HEIGHT = 420;
const AZIMUTH = 60;
const BASE = { x: -112, y: -58, w: 226, d: 106, r: 5 };
const BASE_Z = -14;
const WALL = { x: -66, y: -58, w: 164, d: 6, r: 1 };
const WALL_TOP = 70;
const CAB = { x: 50, y: -48, w: 36, d: 20, r: 1.4 };
const CAB_TOP = 64;
const DRAWER_Z = [[45, 61], [26, 42], [7, 23]];
const PULL = 9;
const COUNTER = { x: -60, y: -4, w: 100, d: 18, r: 1.4 };
const COUNTER_TOP = 27;
const TOP = { x: -62, y: -6, w: 104, d: 22, r: 1.6 };
const DESK_Z = COUNTER_TOP + 3;
const BOT = { x: -8, y: -24 };
const BELL = [30, 7, DESK_Z];
const CAL = { x: -52, y: 4, w: 20, d: 2.4 };
const SLIP = { x: 6, y: 0, w: 16, d: 11 };
const PHONE = { x: -102, y: 22, w: 24, d: 3.2 };
const PHONE_H = 46;
const DESK = { x: 70, y: 28, w: 36, d: 17, r: 1.2 };
const DESK_TOP = 15;
const PERSON_AT = [88, 19];
const LAMP = [100, 33, DESK_TOP + 13];

const P = k.fitProjection(
  [...k.boxCorners(BASE, BASE_Z, 0), ...k.boxCorners(WALL, 0, WALL_TOP + 3), [BOT.x, BOT.y, 112], [PHONE.x, PHONE.y, PHONE_H + 4]],
  WIDTH,
  HEIGHT,
  { pad: 10, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const quad = (corners) => k.pathOf(corners.map(at), true);
const r2 = (v) => Math.round(v * 100) / 100;
const face = (x, y, z) => k.sideMatrix([x, y], z, P, "left");
const slab = (plan, z, h, steps = 2, bevel = 0.3) => k.slabOf(plan, z, h, P, steps, bevel);
const seam = (plan, zs, steps = 2) => L(zs.map((z) => k.sideSeam(plan, z, P, steps)).join(""), { tone: "faint" });
const pct = ([x, y]) => `left:${r2((x / WIDTH) * 100)}%;top:${r2((y / HEIGHT) * 100)}%`;

// A convex polyhedron from its faces, with the kit's four-tone shading.
const VIEW = G.viewOf(P);
const LIGHT = [-Math.sin((AZIMUTH * Math.PI) / 180), Math.cos((AZIMUTH * Math.PI) / 180)];
function polySolid(faces) {
  const all = faces.flat();
  const centre = all.reduce((sum, p) => G.add3(sum, p), [0, 0, 0]).map((v) => v / all.length);
  const shades = [[], [], [], []];
  const tops = [];
  const seen = faces.map((f) => {
    let n = G.cross3(G.sub3(f[1], f[0]), G.sub3(f[2], f[0]));
    const mid = f.reduce((sum, p) => G.add3(sum, p), [0, 0, 0]).map((v) => v / f.length);
    if (G.dot3(n, G.sub3(mid, centre)) < 0) n = G.mul3(n, -1);
    n = G.unit3(n);
    const visible = G.dot3(n, VIEW) > 1e-6;
    if (visible) {
      const d = quad(f);
      if (n[2] > 0.75) tops.push(d);
      else {
        const h = Math.hypot(n[0], n[1]) || 1;
        const lit = ((n[0] / h) * LIGHT[0] + (n[1] / h) * LIGHT[1] + 1) / 2;
        shades[Math.min(3, Math.max(0, Math.floor(lit * 4)))].push(d);
      }
    }
    return visible;
  });
  const key = (p) => p.map((v) => v.toFixed(3)).join(",");
  const edges = new Map();
  faces.forEach((f, fi) =>
    f.forEach((p, i) => {
      const q = f[(i + 1) % f.length];
      const id = [key(p), key(q)].sort().join("|");
      if (!edges.has(id)) edges.set(id, { p, q, faces: [] });
      edges.get(id).faces.push(fi);
    }),
  );
  const outline = [];
  const crease = [];
  for (const { p, q, faces: owners } of edges.values()) {
    const count = owners.filter((f) => seen[f]).length;
    if (count === 1) outline.push(k.segment(p, q, P));
    else if (count === 2) crease.push(k.segment(p, q, P));
  }
  return { fill: k.pathOf(G.hullOf(all.map(at)), true), shades: shades.map((list) => list.join("")), top: tops.join(""), outline: outline.join(""), crease: crease.join("") };
}
const BOX_FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
const boxOf = (c) => polySolid(BOX_FACES.map((ids) => ids.map((i) => c[i])));
// A square bar between any two points (the robot's arms).
function bar(a, b, r) {
  const d = G.unit3(G.sub3(b, a));
  let u = G.cross3(d, [0, 0, 1]);
  if (G.len3(u) < 1e-3) u = [1, 0, 0];
  u = G.mul3(G.unit3(u), r);
  const v = G.mul3(G.unit3(G.cross3(d, u)), r);
  return boxOf([a, b].flatMap((p) => [G.add3(G.add3(p, u), v), G.sub3(G.add3(p, u), v), G.sub3(G.sub3(p, u), v), G.add3(G.sub3(p, u), v)]));
}
const ball = (c, r, cls, steps = 16) => S(G.sphereOf(c, r, P, { steps }), { tone: "mid", crease: "none", className: cls });

// ---- the base slab and the back wall -------------------------------------------------------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, BASE_Z, 2, P)}"/>`];
  out.push(S(k.slabOf(BASE, BASE_Z, -BASE_Z, P, 3), { tone: "mid", className: "pim-bank", inner: seam(BASE, [-5, -10], 3) }));
  // A floor runner in front of the counter, where the customer would stand.
  const rug = { x: -96, y: 20, w: 140, d: 20, r: 2 };
  out.push(`<path class="pi-rug" d="${k.planOutline(rug, 0.05, P, 2)}"/>`);
  return out.join("");
}
function wall() {
  const out = [S(slab(WALL, 0, WALL_TOP), { tone: "mid", className: "pim-cream", inner: seam(WALL, [10], 2) })];
  const band = { x: WALL.x - 1, y: WALL.y - 1, w: WALL.w + 2, d: WALL.d + 2, r: 1 };
  out.push(S(slab(band, WALL_TOP, 4), { tone: "mid", className: "pim-terra" }));
  return out.join("");
}

// ---- the cabinet with the business's information ------------------------------------------
const pullBy = k.axisVector(P, [0, PULL, 0]);
function cabinet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, 2, P)}" style="filter:blur(4px)"/>`];
  out.push(S(slab(CAB, 0, CAB_TOP, 2, 0.5), { tone: "mid", className: "pim-petrol" }));
  out.push(S(slab(k.insetPlan(CAB, -1), CAB_TOP, 2.4, 2, 0.4), { tone: "mid", className: "pim-cream" }));
  // Drawers bottom to top: a pulled drawer covers the fronts below it.
  for (let i = DRAWERS.length - 1; i >= 0; i--) {
    const [z0, z1] = DRAWER_Z[i];
    const box = { x: CAB.x + 2, y: CAB.y + 2, w: CAB.w - 4, d: CAB.d - 1, r: 0.6 };
    const front = { x: CAB.x + 1.6, y: CAB.y + CAB.d - 0.4, w: CAB.w - 3.2, d: 1.8, r: 0.6 };
    const papers = [0, 1, 2].map((n) => S(slab({ x: box.x + 3 + n * 0.6, y: box.y + 2 + n * 5, w: box.w - 6, d: 1, r: 0.3 }, z0 + 1, z1 - z0 - 3, 1, 0), { tone: "lo", crease: "none", className: "pim-paper" })).join("");
    out.push(
      `<g class="pi-drawer" data-drawer="${i}" style="--pi-pull:translate(${r2(pullBy[0])}px,${r2(pullBy[1])}px)">` +
        S(slab(box, z0, z1 - z0, 1, 0), { tone: "mid", className: "pim-cream" }) +
        papers +
        S(slab(front, z0, z1 - z0, 2, 0.3), { tone: "mid", className: "pim-cream pi-front" }) +
        "</g>",
    );
  }
  return out.join("");
}

// ---- the robot -----------------------------------------------------------------------------
const SHOULDER = 44;
const HEAD = { x: BOT.x - 23, y: BOT.y - 14, w: 46, d: 28, r: 7 };
const HEAD_Z = [56, 91];
const VISOR = { w: 34, h: 24 };
const HANDS = {
  rest: [BOT.x + 24, 4, DESK_Z + 1.6],
  shelf0: [CAB.x - 1, CAB.y + CAB.d + PULL - 3, 54],
  shelf1: [CAB.x - 1, CAB.y + CAB.d + PULL - 3, 36],
  shelf2: [CAB.x - 1, CAB.y + CAB.d + PULL - 3, 22],
  bell: [BELL[0], BELL[1], BELL[2] + 7.5],
};
function arm(side, hand) {
  const shoulder = [BOT.x + side * 17, BOT.y + 2, SHOULDER];
  const elbow = G.lerp3(shoulder, hand, 0.5);
  elbow[2] -= side < 0 ? 4 : 2;
  return [
    ball(shoulder, 4.2, "pim-ink", 14),
    S(bar(shoulder, elbow, 1.6), { tone: "mid", className: "pim-ink" }),
    ball(elbow, 2.3, "pim-ink", 12),
    S(bar(elbow, hand, 1.5), { tone: "mid", className: "pim-ink" }),
    ball(hand, 3.4, "pim-terra", 14),
  ].join("");
}
function robotBody() {
  const out = [];
  const torso = { x: BOT.x - 15, y: BOT.y - 10, w: 30, d: 20, r: 7 };
  out.push(S(slab(torso, 0, 52, 4, 0.6), { tone: "mid", className: "pim-robot", inner: seam(torso, [40], 4) }));
  // Chest light: the assistant is on.
  out.push(`<g transform="${face(BOT.x - 5, torso.y + torso.d, 48)}"><rect class="pi-chest" width="10" height="6" rx="2"/><circle class="pi-chest-dot" cx="5" cy="3" r="1.4"/></g>`);
  out.push(S(k.cylinder(BOT.x, BOT.y, 4.6, 52, 4.4, P, 18), { tone: "mid", className: "pim-ink" }));
  // The head: rounded cream block, petrol visor with two light-blue eyes, terra ears and antenna bulb.
  out.push(S(slab(HEAD, HEAD_Z[0], HEAD_Z[1] - HEAD_Z[0], 4, 0.8), { tone: "mid", className: "pim-robot", inner: seam(HEAD, [HEAD_Z[0] + 3], 4) }));
  for (const side of [-1, 1]) out.push(S(G.disc(0, 2.2, 5, G.frameAlong([BOT.x + side * 23, BOT.y, 74], [side, 0, 0]), P, { steps: 18 }), { tone: "mid", className: "pim-terra" }));
  const vx = BOT.x - VISOR.w / 2;
  out.push(
    `<g transform="${face(vx, HEAD.y + HEAD.d + 0.05, HEAD_Z[1] - 4.5)}"><rect class="pi-visor" width="${VISOR.w}" height="${VISOR.h}" rx="7"/>` +
      `<g class="pi-eyes" data-eyes><circle class="pi-eye" cx="11" cy="10.4" r="4.8"/><circle class="pi-eye" cx="23" cy="10.4" r="4.8"/><circle class="pi-eye-hi" cx="12.4" cy="8.8" r="1.5"/><circle class="pi-eye-hi" cx="24.4" cy="8.8" r="1.5"/></g>` +
      `<path class="pi-mouth" d="M14,17.8q3,2.4 6,0"/></g>`,
  );
  out.push(S(k.cylinder(BOT.x, BOT.y, 0.9, HEAD_Z[1], 9, P, 10), { tone: "mid", crease: "none", className: "pim-ink" }));
  const bulb = at([BOT.x, BOT.y, HEAD_Z[1] + 12.5]);
  out.push(`<circle class="pi-bulb-glow" cx="${r2(bulb[0])}" cy="${r2(bulb[1])}" r="13"/>`);
  out.push(`<g class="pi-bulb">${ball([BOT.x, BOT.y, HEAD_Z[1] + 12.5], 4, "pim-terra")}</g>`);
  return out.join("");
}
// The right arm (viewer's right) has one drawing per pose; CSS shows the current one.
const armPoses = () => Object.entries(HANDS).map(([pose, hand]) => `<g class="pi-arm" data-arm="${pose}">${arm(1, hand)}</g>`).join("");

// ---- the counter and what sits on it -------------------------------------------------------
function counter() {
  const out = [`<path class="iso-halo" d="${k.haloOf(COUNTER, 0, 2, P)}" style="filter:blur(5px)"/>`];
  out.push(S(slab(COUNTER, 0, COUNTER_TOP, 2, 0.4), { tone: "mid", className: "pim-terra", inner: seam(COUNTER, [4], 2) }));
  // Vertical boards on the front.
  const boards = [];
  for (let x = COUNTER.x + 10; x < COUNTER.x + COUNTER.w - 4; x += 10) boards.push(k.rise([x, COUNTER.y + COUNTER.d], 4, COUNTER_TOP - 1, P));
  out.push(L(boards.join(""), { tone: "faint", className: "pi-board" }));
  out.push(`<g transform="${face(-46, COUNTER.y + COUNTER.d + 0.05, 21)}"><rect class="pi-sign-plate" width="40" height="9" rx="2"/><text class="pi-sign" x="20" y="6.3" font-size="4.8" text-anchor="middle">ATENCIÓN</text></g>`);
  out.push(S(slab(TOP, COUNTER_TOP, DESK_Z - COUNTER_TOP, 2, 0.4), { tone: "mid", className: "pim-wood" }));
  return out.join("");
}
// A desk calendar standing on the counter; the Thursday 10 h slot fills when a turn is booked.
function calendar() {
  const out = [S(slab({ x: CAL.x - 1, y: CAL.y - 3, w: CAL.w + 2, d: 6, r: 0.8 }, DESK_Z, 1.6, 2), { tone: "mid", className: "pim-ink" })];
  out.push(S(slab({ ...CAL, r: 0.6 }, DESK_Z + 1.6, 16, 2, 0.2), { tone: "mid", className: "pim-paper" }));
  const slots = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const hit = r === 1 && c === 3;
      slots.push(`<rect class="pi-slot"${hit ? " data-slot" : ""} x="${1.6 + c * 4.4}" y="${5.6 + r * 4.6}" width="3.6" height="3.6" rx=".6"/>`);
    }
  out.push(`<g transform="${face(CAL.x, CAL.y + CAL.d + 0.05, DESK_Z + 17.6)}"><rect class="pi-cal-head" x="0.6" y="0.6" width="${CAL.w - 1.2}" height="3.4" rx=".8"/>${slots.join("")}</g>`);
  return out.join("");
}
// An order slip that appears on the counter when the order is loaded.
function slip() {
  const plan = { ...SLIP, r: 0.6 };
  const lines = [3.5, 6, 8.5].map((v) => k.lineOnTop([SLIP.x + 5, SLIP.y + v], [SLIP.x + SLIP.w - 2, SLIP.y + v], DESK_Z + 0.6, P)).join("");
  return `<g class="pi-slip" data-slip>${S(slab(plan, DESK_Z, 0.6, 2, 0), { tone: "hi", crease: "faint", className: "pim-paper" })}<path class="pi-band" d="${k.onTop([[SLIP.x, SLIP.y], [SLIP.x + 3, SLIP.y], [SLIP.x + 3, SLIP.y + SLIP.d], [SLIP.x, SLIP.y + SLIP.d]], DESK_Z + 0.6, P, true)}"/>${L(lines, { tone: "lo" })}</g>`;
}
// The service bell: the robot rings it to call a person.
function bell() {
  const [x, y, z] = BELL;
  const top = at([x, y, z + 9]);
  const waves = [-1, 1].map((s) => `<path class="pi-ring" d="M${r2(top[0] + s * 10)},${r2(top[1] - 1)}q${r2(s * 4)},-5 ${r2(s * 1)},-10"/>`).join("");
  return (
    `<g class="pi-bell" data-bell>` +
    S(k.cylinder(x, y, 6, z, 1.4, P, 24, 0.3), { tone: "mid", className: "pim-ink" }) +
    S(G.solidOf([[0, 5], [3.2, 4.6], [5.4, 3], [6.4, 0.01]], G.frameAlong([x, y, z + 1.4], [0, 0, 1]), P), { tone: "mid", className: "pim-sun" }) +
    ball([x, y, z + 8.2], 1.2, "pim-sun", 10) +
    `</g><g class="pi-rings">${waves}</g>`
  );
}

// ---- the customer's phone on the left -------------------------------------------------------
function phone() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: PHONE.x - 2, y: PHONE.y - 4, w: PHONE.w + 4, d: 12, r: 3 }, 0, 1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(slab({ x: PHONE.x - 2, y: PHONE.y - 5, w: PHONE.w + 4, d: 12, r: 2 }, 0, 2, 2), { tone: "mid", className: "pim-ink" }));
  out.push(S(slab({ ...PHONE, r: 1.4 }, 2, PHONE_H, 3, 0.4), { tone: "mid", className: "pim-ink" }));
  const W = PHONE.w;
  const screen = [
    `<rect class="pi-screen" x="1.6" y="2.4" width="${W - 3.2}" height="${PHONE_H - 4.8}" rx="2"/>`,
    `<rect class="pi-ph-in" data-ph="in" x="3.4" y="9" width="14" height="6" rx="2.4"/>`,
    `<rect class="pi-ph-out" data-ph="out" x="7" y="18" width="14" height="6" rx="2.4"/>`,
    `<rect class="pi-ph-in pi-ph-old" x="3.4" y="27" width="10" height="5" rx="2.2"/>`,
    `<rect class="pi-ph-out pi-ph-old" x="9" y="35" width="12" height="5" rx="2.2"/>`,
  ].join("");
  out.push(`<g transform="${face(PHONE.x, PHONE.y + PHONE.d + 0.05, PHONE_H + 2)}">${screen}</g>`);
  return out.join("");
}

// ---- the person of the team on the right ---------------------------------------------------
function desk() {
  const out = [];
  const [px, py] = PERSON_AT;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: px - 9, y: py - 9, w: 18, d: 18, r: 9 }, 0, 1, P)}" style="filter:blur(3px)"/>`);
  // Chair, body and head (behind the desk, facing the viewer).
  out.push(S(slab({ x: px - 8, y: py - 9, w: 16, d: 5, r: 1.4 }, 0, 24, 2, 0.3), { tone: "mid", className: "pim-ink" }));
  out.push(S(k.cylinder(px, py, 6.6, 8, 14, P, 24, 0.8), { tone: "mid", className: "pim-petrol" }));
  out.push(ball([px, py, 28], 5.4, "pim-skin"));
  out.push(ball([px - 0.8, py - 1.2, 30.4], 5.1, "pim-hair"));
  out.push(S(slab(DESK, 0, DESK_TOP, 2, 0.4), { tone: "mid", className: "pim-wood", inner: seam(DESK, [DESK_TOP - 2.4], 2) }));
  // A laptop facing the person, and the call lamp.
  out.push(S(slab({ x: px - 9, y: DESK.y + 4, w: 18, d: 10, r: 0.8 }, DESK_TOP, 0.9, 2, 0), { tone: "mid", className: "pim-ink" }));
  out.push(S(slab({ x: px - 9, y: DESK.y + 13, w: 18, d: 1, r: 0.4 }, DESK_TOP + 0.9, 11, 2, 0), { tone: "mid", crease: "none", className: "pim-ink" }));
  out.push(S(k.cylinder(LAMP[0], LAMP[1], 3.4, DESK_TOP, 1.2, P, 18, 0.2), { tone: "mid", className: "pim-ink" }));
  out.push(S(k.cylinder(LAMP[0], LAMP[1], 0.7, DESK_TOP + 1.2, 9, P, 10), { tone: "mid", crease: "none", className: "pim-ink" }));
  const glow = at(LAMP);
  out.push(`<circle class="pi-lamp-glow" cx="${r2(glow[0])}" cy="${r2(glow[1])}" r="18"/>`);
  out.push(`<g class="pi-lamp">${ball(LAMP, 3.8, "pim-lamp")}</g>`);
  return out.join("");
}

// ---- assemble -------------------------------------------------------------------------------
const hullPoints = (corners) => G.hullOf(corners.map(at)).map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ");
const robotHit = `<polygon class="pi-hit" data-hit-robot points="${hullPoints(k.boxCorners({ x: BOT.x - 22, y: BOT.y - 13, w: 44, d: 26 }, COUNTER_TOP, HEAD_Z[1] + 16))}" role="button" tabindex="0" aria-label="Robot asistente: que atienda el próximo mensaje"/>`;

const LABEL =
  "Maqueta de un mostrador de atención al cliente. Detrás del mostrador, grande y en el centro, el asistente con IA: un robot de cabeza crema, visor petróleo y ojos celestes. Atrás, un fichero con tres cajones de la información del negocio: Precios, Agenda y Pedidos. A la izquierda, el celular de un cliente que escribe. A la derecha, el escritorio de una persona del equipo con una lámpara. Cuando llega un mensaje, el robot abre el cajón que necesita y responde; si es un reclamo, toca el timbre y se enciende la lámpara de la persona del equipo.";

const svg = `<svg class="iso-svg pi-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${LABEL}">${[
  base(),
  wall(),
  cabinet(),
  robotBody(),
  `<g class="pi-arm-l">${arm(-1, [BOT.x - 24, 5, DESK_Z + 1.6])}</g>`,
  counter(),
  calendar(),
  slip(),
  bell(),
  armPoses(),
  phone(),
  desk(),
  robotHit,
].join("")}</svg>`;

// HTML labels over the drawing: drawer fronts and the person's desk.
const drawerAt = (i) => at([CAB.x + CAB.w / 2, CAB.y + CAB.d + 1.4, (DRAWER_Z[i][0] + DRAWER_Z[i][1]) / 2]);
const tags = [
  ...DRAWERS.map((name, i) => `<span class="pi-tag pi-tag-drawer" data-tag="${i}" style="${pct(drawerAt(i))};--dx:${r2(pullBy[0])};--dy:${r2(pullBy[1])}">${name}</span>`),
  `<span class="pi-tag pi-tag-person" data-tag="p" style="${pct(at([DESK.x + DESK.w / 2, DESK.y + DESK.d, 2]))}">${PERSON}</span>`,
].join("");

// Path data from the kit is absolute M/L/Z in tenths: rewrite it relative with implicit linetos.
function minD(d) {
  if (!/^[MLZ0-9 .\-]+$/.test(d)) return d;
  const fmt = (n) => (n === 0 ? "0" : (n / 10).toFixed(1).replace(/\.0$/, "").replace(/^(-?)0\./, "$1."));
  let out = "", last = "", cx = 0, cy = 0, sx = 0, sy = 0, implicit = false;
  // A number needs a separator unless its sign or a second decimal point already ends the last one.
  const put = (n) => { const t = fmt(n); out += last && !(t[0] === "-" || (t[0] === "." && last.includes("."))) ? " " + t : t; last = t; };
  const cmd = (c) => { out += c; last = ""; };
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g);
  for (let i = 0; i < tokens.length; ) {
    const c = tokens[i++];
    if (c === "Z") { cmd("z"); cx = sx; cy = sy; implicit = false; continue; }
    const X = Math.round(+tokens[i++] * 10), Yv = Math.round(+tokens[i++] * 10);
    if (c === "M" && !out) { cmd("M"); put(X); put(Yv); implicit = false; }
    else if (c === "M") { cmd("m"); put(X - cx); put(Yv - cy); implicit = true; }
    else { if (!implicit) cmd("l"); put(X - cx); put(Yv - cy); implicit = true; }
    if (c === "M") { sx = X; sy = Yv; }
    cx = X; cy = Yv;
  }
  return out;
}
// Self-check: every rewritten path decodes back to the kit's points.
function decode(d) {
  const pts = [];
  let cx = 0, cy = 0, sx = 0, sy = 0, mode = "", n = [];
  for (const tok of d.match(/[MmlzZ]|-?\d*\.?\d+/g)) {
    if (/[A-Za-z]/.test(tok)) { mode = tok; if (/z/i.test(tok)) { cx = sx; cy = sy; pts.push("Z"); } continue; }
    n.push(+tok);
    if (n.length < 2) continue;
    const [dx, dy] = n;
    n = [];
    if (mode === "M") { cx = dx; cy = dy; }
    else { cx = Math.round((cx + dx) * 10) / 10; cy = Math.round((cy + dy) * 10) / 10; }
    if (mode === "M" || mode === "m") { sx = cx; sy = cy; mode = mode === "M" ? "L" : "l"; }
    pts.push(`${cx},${cy}`);
  }
  return pts.join(" ");
}
const absolute = (d) => (d.match(/[MLZ]|-?\d*\.?\d+/g) || []).reduce((acc, tok) => { if (tok === "Z") acc.out.push("Z"); else if (!/[ML]/.test(tok)) { acc.n.push(+tok); if (acc.n.length === 2) { acc.out.push(acc.n.join(",")); acc.n = []; } } return acc; }, { out: [], n: [] }).out.join(" ");
for (const [, d] of svg.matchAll(/ d="([^"]*)"/g)) if (/^[MLZ0-9 .\-]+$/.test(d) && decode(minD(d)) !== absolute(d)) throw new Error(`minD round trip failed: ${d.slice(0, 80)}`);

// Rest state (no JS yet): the first exchange, already answered with the price list.
const FIRST = "precio";
const html = `<div class="fig-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="pi-bar"><span class="pi-status"><i></i>Asistente activo</span><span class="pi-bar-label">asistente con IA: responde con tu información</span></span></div>
            <div class="iso pi-br" data-theme="light" data-kind="${FIRST}" data-phase="reply" data-src="0" data-pose="rest" data-look="chat">
              <div class="pi-chat" aria-label="Conversación de ejemplo con un cliente">
                <div class="pi-msg pi-in" data-ask><span class="pi-who">Cliente</span><span data-ask-text>${ASK[FIRST]}</span></div>
                <div class="pi-msg pi-out" data-reply><span class="pi-who">Asistente</span><span class="pi-typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="pi-reply" data-reply-text>${REPLY[FIRST]}</span><span class="pi-src" data-src-text>${sourceOf(FIRST)}</span></div>
              </div>
              <div class="pi-stage">${svg.replace(/ d="([^"]*)"/g, (_, d) => ` d="${minD(d)}"`)}<div class="pi-tags" aria-hidden="true">${tags}</div></div>
            </div>
            <div class="pi-kinds" role="group" aria-label="Elegí qué escribe el cliente">${TYPES.map((t) => `<button class="pi-kind" type="button" data-kind="${t}" aria-pressed="${t === FIRST}">${CHIP[t]}</button>`).join("")}</div>
            <div class="flow-foot">
              <span class="counter" data-readout aria-live="polite">${readoutOf(FIRST, "reply")}</span>
              <button class="btn btn-primary mini" type="button" data-send>Mandar un mensaje <span class="arrow" aria-hidden="true">→</span></button>
            </div>`;

const mix = (a, b, p) => `color-mix(in srgb, ${b} ${p}%, ${a})`;
const material = (name, base, top = mix(base, "white", 30)) =>
  `.pim-${name} { --anatomy-paper: ${mix(base, "var(--ink)", 14)}; --anatomy-top: ${top}; --anatomy-shade-3: ${mix(base, "white", 12)}; --anatomy-shade-2: ${base}; --anatomy-shade-1: ${mix(base, "var(--ink)", 10)}; --anatomy-shade-0: ${mix(base, "var(--ink)", 20)}; }`;
const MATERIALS = [
  material("paper", "#FFFDF7", "#FFFFFF"),
  material("bank", "#E2CFAE", "var(--paper)"),
  material("terra", "var(--terra)", mix("var(--terra)", "white", 22)),
  material("petrol", "var(--petrol)", mix("var(--petrol)", "white", 22)),
  material("ink", "#2A3A40", "#3A4C53"),
  material("cream", mix("var(--cream)", "var(--petrol)", 6), "var(--cream)"),
  material("sun", "#F08A3A", "#F5A361"),
  material("robot", "#F5EDDE", "#FFFBF2"),
  material("skin", "#E9B98E", "#F2CBA4"),
  material("hair", "#3B2A22", "#5A4136"),
  material("wood", "#C9A27A", "#DDBB94"),
  material("lamp", mix("var(--cream)", "var(--petrol)", 14), "var(--cream)"),
  material("lit", "#F7CF5A", "#FFF3C4"),
].join("\n  ");

// Which arm pose, drawer and look each state shows; the page script only sets data attributes.
const css = `
  /* IA para pymes, "El mostrador que atiende": built by figures/ai/build.mjs with the Anatomy kit (MIT) */
  .pi-br.iso[data-theme="light"] {
    --anatomy-paper: var(--cream); --anatomy-card: var(--cream); --anatomy-text: var(--ink-2); --anatomy-strong: var(--ink); --anatomy-muted: var(--ink-2);
    --anatomy-face: #fff; --anatomy-top: #fff;
    --anatomy-shade-0: ${mix("var(--cream)", "var(--ink)", 14)}; --anatomy-shade-1: ${mix("var(--cream)", "var(--ink)", 9)};
    --anatomy-shade-2: ${mix("var(--cream)", "var(--ink)", 5)}; --anatomy-shade-3: ${mix("var(--cream)", "var(--ink)", 2)};
    --anatomy-hi: ${mix("transparent", "var(--ink)", 62)}; --anatomy-mid: ${mix("transparent", "var(--ink)", 42)}; --anatomy-lo: ${mix("transparent", "var(--ink)", 28)};
    --anatomy-faint: ${mix("transparent", "var(--ink)", 14)}; --anatomy-lit: var(--terra); --anatomy-halo: var(--petrol); --anatomy-halo-opacity: .2; --anatomy-dot: var(--ink);
    --anatomy-mono: var(--mono); --anatomy-weight: .6px;
  }
  ${MATERIALS}
  #fig-bot { display: flex; flex-direction: column; overflow: hidden; background:
    radial-gradient(50% 40% at 50% 34%, color-mix(in srgb, #F08A3A 13%, transparent), transparent 72%),
    linear-gradient(to bottom, var(--cream) 0%, var(--cream) 50%, color-mix(in srgb, var(--paper) 80%, var(--cream)) 100%); }
  #fig-bot .counter { font-variant-numeric: tabular-nums; color: var(--ink); }
  #fig-bot .flow-foot { flex-wrap: wrap; }
  #fig-bot .flow-foot .counter { flex: 1 1 15em; }
  #fig-bot .flow-foot .btn { flex: none; white-space: nowrap; }
  .pi-bar { display: inline-flex; align-items: center; gap: 14px; min-width: 0; }
  .pi-status { display: inline-flex; align-items: center; gap: 6px; color: #3E6B4A; white-space: nowrap; }
  .pi-status i { width: 8px; height: 8px; border-radius: 50%; background: #5E8C6A; box-shadow: 0 0 0 3px color-mix(in srgb, #5E8C6A 22%, transparent); }
  .pi-br { position: relative; flex: 1; display: flex; flex-direction: column; justify-content: center; margin: 0 -10px; container-type: inline-size; }
  .pi-stage { position: relative; container-type: inline-size; }
  .pi-svg { touch-action: pan-y; }
  /* Conversation: real text, over the empty top-left of the drawing when there is room, above it on phones. */
  .pi-chat { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; margin: 0 10px 2px; font: 500 13px/1.35 var(--sans); }
  .pi-chat .pi-out { margin-top: 22px; }
  @container (max-width: 469px) { .pi-chat { grid-template-columns: 1fr; gap: 6px; margin: 0 8px 2px; } .pi-chat .pi-in { margin-right: 14%; } .pi-chat .pi-out { margin: 0 0 0 14%; } }
  .pi-msg { position: relative; margin: 0; padding: 7px 11px 8px; border-radius: 14px; box-shadow: 0 6px 16px -10px rgba(30,42,47,.5); }
  .pi-who { display: block; font: 700 12px/1.2 var(--mono); letter-spacing: .02em; margin-bottom: 2px; }
  .pi-in { background: #fff; color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 4px; }
  .pi-in .pi-who { color: var(--ink-2); }
  .pi-out { background: var(--petrol); color: var(--cream); border-bottom-right-radius: 4px; }
  .pi-out .pi-who { color: var(--river); }
  .pi-reply { display: block; }
  .pi-src { display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 999px; background: var(--terra); color: #fff; font: 700 12px/1.4 var(--mono); }
  .pi-typing { display: none; position: absolute; left: 12px; top: 30px; gap: 4px; }
  .pi-typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--river); animation: pi-dot 1s ease-in-out infinite; }
  .pi-typing i:nth-child(2) { animation-delay: .15s; } .pi-typing i:nth-child(3) { animation-delay: .3s; }
  @keyframes pi-dot { 0%, 100% { opacity: .35; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
  .pi-br[data-phase="look"] .pi-typing { display: flex; }
  .pi-br[data-phase="look"] .pi-reply, .pi-br[data-phase="look"] .pi-src { visibility: hidden; }
  .pi-br[data-phase="ask"] [data-reply] { visibility: hidden; }
  .pi-msg { animation: pi-pop .35s var(--ease) both; }
  @keyframes pi-pop { from { opacity: 0; transform: translateY(6px) scale(.97); } }
  /* Labels on the drawing (real text, at least 12px). */
  .pi-tags { position: absolute; inset: 0; pointer-events: none; }
  .pi-tag { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; padding: 1px 7px; border-radius: 6px; font: 700 clamp(12px, 2.4cqw, 13px)/1.35 var(--mono); color: var(--petrol); background: var(--cream); border: 1px solid color-mix(in srgb, var(--petrol) 35%, transparent); transition: transform .45s var(--ease), background-color .25s, color .25s; }
  .pi-tag-person { transform: translate(-50%, 0); }
  .pi-br[data-src="0"]:not([data-phase="ask"]) [data-tag="0"], .pi-br[data-src="1"]:not([data-phase="ask"]) [data-tag="1"], .pi-br[data-src="2"]:not([data-phase="ask"]) [data-tag="2"] {
    z-index: 1; background: var(--terra); border-color: var(--terra-ink); color: #fff; transform: translate(calc(-50% + var(--dx) * 100cqw / ${WIDTH}), calc(-50% + var(--dy) * 100cqw / ${WIDTH})); }
  .pi-br[data-src="p"][data-phase="reply"] [data-tag="p"] { background: var(--terra); border-color: var(--terra-ink); color: #fff; }
  /* Drawers slide out toward the viewer. */
  .pi-drawer { transition: transform .45s var(--ease); }
  .pi-br[data-src="0"]:not([data-phase="ask"]) [data-drawer="0"], .pi-br[data-src="1"]:not([data-phase="ask"]) [data-drawer="1"], .pi-br[data-src="2"]:not([data-phase="ask"]) [data-drawer="2"] { transform: var(--pi-pull); }
  .pi-br[data-src="0"]:not([data-phase="ask"]) [data-drawer="0"] .pi-front, .pi-br[data-src="1"]:not([data-phase="ask"]) [data-drawer="1"] .pi-front, .pi-br[data-src="2"]:not([data-phase="ask"]) [data-drawer="2"] .pi-front {
    --anatomy-top: #FFE7C9; --anatomy-shade-3: #FBD2A6; --anatomy-shade-2: #F7BC86; --anatomy-shade-1: #EFA46A; --anatomy-shade-0: #E58E52; --anatomy-paper: #EFA46A; }
  /* Arm poses: one drawing each. */
  .pi-arm { display: none; }
  .pi-br[data-pose="rest"] [data-arm="rest"], .pi-br[data-pose="shelf0"] [data-arm="shelf0"], .pi-br[data-pose="shelf1"] [data-arm="shelf1"], .pi-br[data-pose="shelf2"] [data-arm="shelf2"], .pi-br[data-pose="bell"] [data-arm="bell"] { display: inline; }
  /* Eyes follow the action. */
  .pi-eyes { transition: transform .35s var(--ease); }
  .pi-br[data-look="chat"] .pi-eyes { transform: translate(-2.2px, .6px); }
  .pi-br[data-look="shelf"] .pi-eyes { transform: translate(2.4px, -1.2px); }
  .pi-br[data-look="bell"] .pi-eyes { transform: translate(2px, 1.6px); }
  .pi-br .pi-visor { fill: var(--petrol); stroke: var(--ink); stroke-width: .5px; }
  .pi-br .pi-eye { fill: var(--river); }
  .pi-br .pi-eye-hi { fill: #fff; }
  .pi-br .pi-mouth { fill: none; stroke: var(--river); stroke-width: 1.1px; stroke-linecap: round; }
  .pi-br .pi-chest { fill: var(--petrol); }
  .pi-br .pi-chest-dot { fill: #7BC58A; }
  /* Antenna blinks while it looks something up. */
  .pi-br .pi-bulb-glow { fill: #F5A361; opacity: 0; }
  .pi-br[data-phase="look"] .pi-bulb-glow { animation: pi-blink .4s steps(1, end) infinite; }
  @keyframes pi-blink { 50% { opacity: .55; } }
  /* Counter props. */
  .pi-br .pi-rug { fill: color-mix(in srgb, var(--terra) 14%, var(--paper)); stroke: color-mix(in srgb, var(--terra) 30%, transparent); stroke-width: .6px; }
  .pi-br .pi-sign-plate { fill: var(--petrol); }
  .pi-br .pi-sign { fill: var(--cream); font-family: var(--mono); font-weight: 700; letter-spacing: .14em; }
  .pi-br .pi-cal-head { fill: var(--terra-ink); }
  .pi-br .pi-slot { fill: color-mix(in srgb, var(--petrol) 10%, #fff); stroke: var(--anatomy-faint); stroke-width: .4px; transition: fill .3s; }
  .pi-br[data-kind="turno"][data-phase="reply"] [data-slot] { fill: var(--terra); stroke: var(--terra-ink); }
  .pi-br .pi-band { fill: var(--terra); stroke: none; }
  .pi-slip { opacity: 0; transition: opacity .3s, transform .4s var(--ease); transform: translateY(-6px); }
  .pi-br[data-kind="pedido"][data-phase="reply"] .pi-slip { opacity: 1; transform: none; }
  .pi-bell { transform-box: fill-box; transform-origin: 50% 100%; }
  .pi-br[data-pose="bell"] .pi-bell { animation: pi-ding .5s ease-in-out 2; }
  @keyframes pi-ding { 25% { transform: rotate(-7deg); } 75% { transform: rotate(7deg); } }
  .pi-br .pi-ring { fill: none; stroke: var(--terra); stroke-width: 1.4px; stroke-linecap: round; opacity: 0; }
  .pi-br[data-pose="bell"] .pi-ring { opacity: 1; }
  .pi-br .pi-screen { fill: var(--petrol); }
  .pi-br .pi-ph-in { fill: #fff; }
  .pi-br .pi-ph-out { fill: color-mix(in srgb, var(--river) 75%, #fff); }
  .pi-br .pi-ph-old { opacity: .45; }
  .pi-br[data-phase="ask"] [data-ph="out"] { opacity: 0; }
  .pi-br .pi-lamp-glow { fill: #F5C24A; opacity: 0; transition: opacity .3s; }
  .pi-br[data-src="p"][data-phase="reply"] .pi-lamp-glow { opacity: .55; }
  .pi-br[data-src="p"][data-phase="reply"] .pi-lamp .pim-lamp { --anatomy-top: #FFF3C4; --anatomy-shade-3: #FFE38A; --anatomy-shade-2: #F7CF5A; --anatomy-shade-1: #EDB93E; --anatomy-shade-0: #DDA32C; --anatomy-paper: #EDB93E; }
  .pi-br .pi-hit { fill: transparent; stroke: none; cursor: pointer; outline: none; }
  .pi-br .pi-hit:focus-visible { stroke: var(--terra); stroke-width: 2px; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
  .pi-br[data-off] *, .pi-br[data-off] *::before { animation-play-state: paused !important; }
  /* Message chips (footer). */
  .pi-kinds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .pi-kind { min-height: 36px; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--cream); color: var(--ink); font: 600 13px/1 var(--sans); cursor: pointer; }
  .pi-kind:hover { border-color: var(--ink-2); }
  .pi-kind[aria-pressed="true"] { background: var(--petrol); border-color: var(--petrol); color: var(--cream); }
  @media (max-width: 560px) { .pi-br { margin: 0 -14px; } .pi-bar-label { display: none; } }
  @media (prefers-reduced-motion: reduce) { .pi-br *, .pi-br *::before { transition: none !important; animation: none !important; } }
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^\/\/.*\n/gm, "").replace(/^export /gm, "");

const js = `
  // IA para pymes, "El mostrador que atiende" (generated by figures/ai/build.mjs)
  {
    const fig = document.getElementById('fig-bot');
    const root = fig && fig.querySelector('.pi-br');
    if (root) {
    ${MODEL.trim().replace(/\n/g, "\n    ")}
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const $ = (s) => fig.querySelector(s);
    const ask = $('[data-ask]'), askText = $('[data-ask-text]'), reply = $('[data-reply]'), replyText = $('[data-reply-text]'), srcText = $('[data-src-text]');
    const readout = $('[data-readout]'), button = $('[data-send]'), robotHit = $('[data-hit-robot]');
    const kinds = [...fig.querySelectorAll('.pi-kind')];
    let current = 'precio', timers = [], tour = 0, idle = 0, touring = true, visible = false, started = false;
    const say = (text) => { if (readout.textContent !== text) readout.textContent = text; };
    const pop = (el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };
    const set = (phase) => {
      const src = SOURCE[current] < 0 ? 'p' : String(SOURCE[current]);
      Object.assign(root.dataset, { kind: current, phase, src, pose: phase === 'look' ? poseOf(current) : 'rest', look: phase === 'look' ? (src === 'p' ? 'bell' : 'shelf') : 'chat' });
      say(readoutOf(current, phase));
      if (phase === 'reply') { pop(reply); afterReply(); }
    };
    const play = (type) => {
      timers.forEach(clearTimeout);
      clearTimeout(tour);
      current = type;
      kinds.forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.kind === type)));
      askText.textContent = ASK[type];
      replyText.textContent = REPLY[type];
      srcText.textContent = sourceOf(type);
      pop(ask);
      set('ask');
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
    robotHit.addEventListener('keydown', (event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); act(nextOf(current)); });
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
  }
`;

const replaceBetween = (text, start, end, body) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`markers not found: ${start} … ${end}`);
  return text.slice(0, from + start.length) + body + text.slice(to);
};

// Other figures are rebuilt into the same page concurrently: read, replace and write in one
// synchronous step, touching only the three fig-ai regions.
let pageText = readFileSync(ARTBOARD, "utf8");
pageText = replaceBetween(pageText, "<!-- fig-ai:start -->", "<!-- fig-ai:end -->", `\n            ${html}\n            `);
pageText = replaceBetween(pageText, "/* fig-ai:css:start */", "/* fig-ai:css:end */", css + "  ");
pageText = replaceBetween(pageText, "// fig-ai:js:start", "// fig-ai:js:end", js + "  ");
writeFileSync(ARTBOARD, pageText);
const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(1);
console.log(`wrote ${ARTBOARD}: html+svg ${kb(html)} KB, css ${kb(css)} KB, js ${kb(js)} KB, total ${kb(html + css + js)} KB`);
