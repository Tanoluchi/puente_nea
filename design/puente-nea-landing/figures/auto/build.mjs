// Builds the "Automatización" figure (#fig-flow) of 01-puente-editorial.html: an order-processing
// station on a sand slab. Front row: a tablet with a WhatsApp order, a belt and a checkpoint gate
// with two lamps (data, stock). Behind it, the protagonists: three large modules fed by the belt:
// a stock rack (one box of ten leaves the shelf), an invoice printer and a depot alert board.
// The order card, the gate's verdict and the three action names are HTML, synchronized by the
// script, so they stay legible on a phone. A second control runs an order that needs review.
// Run: node figures/auto/build.mjs   (rewrites only the fig-auto markers, re-reading the page first)
// Static art is generated here with the vendored Anatomy kit (MIT, see figures/kit/LICENSE); the
// kit's base CSS (.iso-*) is emitted once by figures/software/build.mjs; this build checks it.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { ACTIONS, STOCK, BOX_UNITS, ORDERS, T, orderLine, detailOf, stateAt } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ARTBOARD = join(HERE, "..", "..", "01-puente-editorial.html");

const WIDTH = 600;
const HEIGHT = 330;
const AZIMUTH = 60;
const SLAB = { x: -198, y: -70, w: 332, d: 100, r: 4 };
const BASE = -9;

// Front row: phone → belt → gate → manifold running in front of the modules.
const BELT = { x: -172, y: 10, w: 298, d: 10 };
const BELT_TOP = 4.5;
const BELT_Y = BELT.y + BELT.d / 2;
const PHONE = { x: -192, y: 8, w: 13, d: 3 };
const PHONE_H = 22;
const GATE_X = -146;
const GATE_TOP = 27;
const DOCK_X = -126;
const TICKET_X = [-170, GATE_X, DOCK_X];

// Back row: three modules, the subject.
const MX = [-82, 2, 86];
const MOD = { y: -62, w: 72, d: 66 };
const PAD_H = 3;
const padOf = (i) => ({ x: MX[i] - MOD.w / 2, y: MOD.y, w: MOD.w, d: MOD.d, r: 3 });
const BRANCH_Y = [BELT.y + 0.5, MOD.y + MOD.d - 4];

// Stock rack: three shelves of four boxes; each box is ten units, so 12 boxes are 120 u.
const RACK = { y: -58, d: 13, x0: -30, x1: 30 };
const SHELF_Z = [PAD_H, PAD_H + 12, PAD_H + 24];
const BOX = { w: 11, d: 10, h: 9 };
const BOX_UX = [-21, -7, 7, 21];
const PICK_FROM = [MX[0] + BOX_UX[3], RACK.y + RACK.d / 2, SHELF_Z[2] + 1.2];
const PICK_TO = [MX[0] + 21, -7, PAD_H];

const P = k.fitProjection(
  [...k.boxCorners(SLAB, BASE, 0), ...k.boxCorners({ x: SLAB.x, y: SLAB.y, w: SLAB.w, d: 4 }, 0, 50)],
  WIDTH,
  HEIGHT,
  { pad: 12, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r2 = (v) => Math.round(v * 100) / 100;
const shift = (by) => k.translateAlong(P, by);
const front = (x, y, z) => k.sideMatrix([x, y], z, P, "left");
const box = (plan, z, h, className, opts = {}) => S(k.slabOf({ r: 0.6, ...plan }, z, h, P, opts.steps ?? 2, opts.bevel ?? 0.3), { tone: "mid", className, ...opts.style });
const halo = (plan, blur = 4) => `<path class="iso-halo" d="${k.haloOf({ r: 1, ...plan }, 0, 2, P)}" style="filter:blur(${blur}px)"/>`;
const pct = ([x, y]) => [r2((x / WIDTH) * 100), r2((y / HEIGHT) * 100)];

// ---- base ----------------------------------------------------------------------------------
function slab() {
  const out = [`<path class="iso-halo" d="${k.haloOf(SLAB, BASE, 2, P)}"/>`];
  out.push(S(k.slabOf(SLAB, BASE, -BASE, P, 3), { tone: "mid", className: "pam-bank", inner: L([-3, -6].map((z) => k.sideSeam(SLAB, z, P, 3)).join(""), { tone: "faint" }) }));
  out.push(`<text class="iso-face-text pa-slab-word" transform="${front(SLAB.x + SLAB.w / 2, SLAB.y + SLAB.d, -1.6)}" x="0" y="5.6" font-size="5.6" text-anchor="middle">estación de pedidos</text>`);
  return out.join("");
}

// ---- back row ------------------------------------------------------------------------------
function phone() {
  const out = [halo({ x: PHONE.x - 2, y: PHONE.y - 3, w: PHONE.w + 4, d: 9 }, 3)];
  out.push(box({ x: PHONE.x - 1.5, y: PHONE.y - 3, w: PHONE.w + 3, d: 8, r: 1 }, 0, 1.6, "pam-cream"));
  out.push(box({ ...PHONE, r: 1 }, 1.6, PHONE_H, "pam-ink"));
  const W = PHONE.w - 2;
  const face = [
    `<rect class="pa-screen" x="1" y="1.4" width="${W}" height="${PHONE_H - 3}" rx="1"/>`,
    `<rect class="pa-chat-in" x="2.2" y="3.4" width="7" height="3.2" rx="1.2"/>`,
    `<rect class="pa-chat" x="${W - 8}" y="8.6" width="8.2" height="5.4" rx="1.4"/>`,
    `<rect class="pa-chat-row" x="${W - 6.8}" y="10" width="5.6" height=".8"/><rect class="pa-chat-row" x="${W - 6.8}" y="11.8" width="3.6" height=".8"/>`,
  ].join("");
  out.push(`<g transform="${front(PHONE.x, PHONE.y + PHONE.d, PHONE_H + 1.6)}">${face}<circle class="pa-badge" data-badge cx="${W + 0.4}" cy="1.2" r="2.4"/></g>`);
  return out.join("");
}

// The belt: a dark band with a running dash line that moves while an order travels.
const beltPath = (from, to) => k.lineOnTop(from, to, BELT_TOP, P);
function belt() {
  const out = [halo({ ...BELT, r: 1 }, 3)];
  out.push(box({ ...BELT, r: 1.2 }, 0, BELT_TOP, "pam-ink"));
  out.push(L(k.onTop(Array.from({ length: 30 }, (_, i) => BELT.x + 4 + i * 9.4).flatMap((x) => [[x, BELT.y + 1.6], [x, BELT.y + BELT.d - 1.6]]), BELT_TOP, P), { tone: "faint", className: "pa-roller" }));
  out.push(`<path class="pa-run" d="${beltPath([BELT.x + 3, BELT_Y], [BELT.x + BELT.w - 3, BELT_Y])}"/>`);
  return out.join("");
}
// Branches from the belt into each module, drawn under the modules.
function branches() {
  return MX.map((x, i) => {
    const plan = { x: x - 5, y: BRANCH_Y[1], w: 10, d: BRANCH_Y[0] - BRANCH_Y[1], r: 0.6 };
    return box(plan, 0, BELT_TOP, "pam-ink") + `<path class="pa-run" data-branch="${i}" d="${k.lineOnTop([x, BRANCH_Y[0]], [x, BRANCH_Y[1] + 1], BELT_TOP, P)}"/>`;
  }).join("");
}

// Checkpoint gate: two posts over the belt, a beam and a lamp head with two lamps (data, stock).
const LAMP_FACE_Y = BELT.y + BELT.d / 2 + 2;
function gateFar() {
  return box({ x: GATE_X - 4, y: BELT.y - 6, w: 8, d: 4.5 }, 0, GATE_TOP, "pam-petrol");
}
function gateNear() {
  const out = [box({ x: GATE_X - 4, y: BELT.y + BELT.d + 1.5, w: 8, d: 4.5 }, 0, GATE_TOP, "pam-petrol")];
  // Light curtain between the posts while scanning.
  const curtain = [[GATE_X, BELT.y - 1.5, GATE_TOP - 1], [GATE_X, BELT.y + BELT.d + 1.5, GATE_TOP - 1], [GATE_X, BELT.y + BELT.d + 1.5, BELT_TOP], [GATE_X, BELT.y - 1.5, BELT_TOP]];
  out.push(`<path class="pa-curtain" data-curtain d="${k.pathOf(curtain.map(at), true)}"/>`);
  out.push(box({ x: GATE_X - 5.5, y: BELT.y - 7, w: 11, d: BELT.d + 15 }, GATE_TOP, 4, "pam-cream"));
  // Lamp head on top of the beam, facing the viewer.
  out.push(box({ x: GATE_X - 12, y: LAMP_FACE_Y - 4, w: 24, d: 4, r: 1 }, GATE_TOP + 4, 12, "pam-petrol"));
  const lamp = (i) => `<circle class="pa-lamp-glow" data-lamp-glow="${i}" cx="${6 + i * 12}" cy="6" r="6.2"/><circle class="pa-lamp" data-lamp="${i}" cx="${6 + i * 12}" cy="6" r="3.6"/>`;
  out.push(`<g transform="${front(GATE_X - 12, LAMP_FACE_Y, GATE_TOP + 16)}">${lamp(0)}${lamp(1)}</g>`);
  // A small review flag on the near post, raised when the order needs a person.
  out.push(`<g class="pa-flag" data-flag><g transform="${front(GATE_X + 4.2, BELT.y + BELT.d + 6, GATE_TOP - 2)}"><path d="M0 0L11 3.4L0 6.8Z"/></g></g>`);
  return out.join("");
}

// The order ticket on the belt, drawn at the origin and moved by the script.
const TICKET = { w: 13, d: 9 };
const TICKET_DEF = (() => {
  const plan = { x: -TICKET.w / 2, y: -TICKET.d / 2, w: TICKET.w, d: TICKET.d, r: 0.6 };
  const z = 1;
  const band = `<path class="pa-band" d="${k.onTop([[-TICKET.w / 2 + 0.5, -TICKET.d / 2 + 0.5], [-TICKET.w / 2 + 3, -TICKET.d / 2 + 0.5], [-TICKET.w / 2 + 3, TICKET.d / 2 - 0.5], [-TICKET.w / 2 + 0.5, TICKET.d / 2 - 0.5]], z, P, true)}"/>`;
  const rows = L([-1.6, 1.4].map((v) => k.lineOnTop([-2.4, v], [4.6, v], z, P)).join(""), { tone: "lo" });
  return `<g id="pa-ticket">${S(k.slabOf(plan, 0, z, P, 2), { tone: "hi", className: "pam-paper" })}${band}${rows}</g>`;
})();

// ---- front row: three modules ----------------------------------------------------------------
function pad(i) {
  const plan = padOf(i);
  const out = [halo(plan, 5)];
  out.push(`<g class="pa-pad" data-pad="${i}">${S(k.slabOf(plan, 0, PAD_H, P, 3, 0.5), { tone: "mid", className: "pam-cream" })}</g>`);
  return out.join("");
}

// 1 · Stock
const BOX_DEF = `<g id="pa-box">${S(k.slabOf({ x: -BOX.w / 2, y: -BOX.d / 2, w: BOX.w, d: BOX.d, r: 0.4 }, 0, BOX.h, P, 1), { tone: "mid", className: "pam-kraft" })}${L(k.lineOnTop([-BOX.w / 2, 0], [BOX.w / 2, 0], BOX.h, P), { tone: "lo", className: "pa-tape" })}</g>`;
function stock() {
  const x = MX[0];
  const out = [pad(0)];
  out.push(box({ x: x + RACK.x0, y: RACK.y - 1, w: RACK.x1 - RACK.x0, d: 1, r: 0.2 }, PAD_H, 36, "pam-cream"));
  const post = (px) => box({ x: px, y: RACK.y - 1, w: 2, d: RACK.d + 1, r: 0.3 }, PAD_H, 36, "pam-petrol");
  out.push(post(x + RACK.x0 - 2));
  SHELF_Z.forEach((z, s) => {
    out.push(box({ x: x + RACK.x0, y: RACK.y, w: RACK.x1 - RACK.x0, d: RACK.d, r: 0.4 }, z, 1.2, "pam-cream"));
    BOX_UX.forEach((u, b) => {
      const picked = s === 2 && b === 3;
      out.push(`<g${picked ? " data-pick" : ""}><use href="#pa-box" transform="${shift([x + u, RACK.y + RACK.d / 2, z + 1.2])}"/></g>`);
    });
  });
  out.push(box({ x: x + RACK.x0, y: RACK.y, w: RACK.x1 - RACK.x0, d: RACK.d, r: 0.4 }, PAD_H + 35, 1.2, "pam-cream"));
  out.push(post(x + RACK.x1));
  // Count sign in front of the rack.
  const sign = { x: x - 16, y: -26, w: 30, d: 3 };
  out.push(box({ x: sign.x + 4, y: sign.y - 1, w: sign.w - 8, d: sign.d + 4, r: 0.6 }, PAD_H, 1.4, "pam-cream"));
  out.push(box(sign, PAD_H + 1.4, 15, "pam-petrol"));
  out.push(`<g transform="${front(sign.x + 2, sign.y + sign.d, PAD_H + 14.6)}"><rect class="pa-window" width="${sign.w - 4}" height="10.4" rx="1"/><text class="pa-count" data-count x="${(sign.w - 4) / 2 - 2}" y="8.4" font-size="9" text-anchor="middle">${STOCK}</text><text class="pa-count-u" x="${sign.w - 6.6}" y="8.2" font-size="3.6" text-anchor="middle">u.</text></g>`);
  return out.join("");
}
const picked = () => `<g data-picked opacity="0"><use href="#pa-box" transform="${shift(PICK_FROM)}"/></g>`;

// 2 · Factura: a printer; the invoice rises out of the top slot.
const PRN = { x: MX[1] - 25, y: -54, w: 50, d: 36, r: 2.4 };
const PRN_TOP = PAD_H + 20;
const SLIP = { x: MX[1] - 15, y: PRN.y + 13, w: 30, h: 34, out: 26 };
function printer() {
  const out = [pad(1)];
  out.push(box(PRN, PAD_H, 16, "pam-cream", { steps: 3, bevel: 0.5, style: { inner: L(k.sideSeam(PRN, PAD_H + 5, P, 3), { tone: "faint" }) } }));
  out.push(box(k.insetPlan(PRN, 0.8), PAD_H + 16, 4, "pam-petrol", { steps: 3, bevel: 0.4 }));
  out.push(`<path class="pa-slot" d="${k.onTop(k.roundedPlan({ x: SLIP.x - 1.4, y: SLIP.y - 1.2, w: SLIP.w + 2.8, d: 2.4, r: 1 }, 2), PRN_TOP, P, true)}"/>`);
  out.push(`<g transform="${front(PRN.x, PRN.y + PRN.d, PAD_H + 13)}"><circle class="pa-dot" data-prn-dot cx="${PRN.w - 6}" cy="2.6" r="1.6"/><rect class="pa-slot" x="8" y="6.2" width="${PRN.w - 16}" height="1.6" rx=".8"/></g>`);
  return out.join("");
}
function slip() {
  const a = at([0, SLIP.y, PRN_TOP]);
  const b = at([1, SLIP.y, PRN_TOP]);
  const dir = [b[0] - a[0], b[1] - a[1]];
  const far = (t) => [r2(a[0] + dir[0] * t), r2(a[1] + dir[1] * t)];
  const [p0, p1] = [far(-600), far(600)];
  const clip = `<clipPath id="pa-slip-clip"><path d="M${p0[0]} ${p0[1]}L${p1[0]} ${p1[1]}L${p1[0]} -600L${p0[0]} -600Z"/></clipPath>`;
  const w = SLIP.w;
  const face = [
    `<rect class="pa-slip" width="${w}" height="${SLIP.h}" rx=".6"/>`,
    `<rect class="pa-band" width="${w}" height="4.4"/>`,
    `<text class="pa-slip-word" x="${w / 2}" y="10.6" font-size="4.6" text-anchor="middle">FACTURA</text>`,
    `<text class="pa-slip-small" x="${w / 2}" y="16.4" font-size="3.4" text-anchor="middle">A-0457 · Ana</text>`,
    `<rect class="pa-slip-row" x="3.6" y="20" width="${w - 7.2}" height=".9"/><rect class="pa-slip-row" x="3.6" y="23" width="${w - 14}" height=".9"/>`,
    `<text class="pa-slip-small" x="${w - 3.6}" y="29" font-size="3.4" text-anchor="end">10 u.</text>`,
  ].join("");
  return { clip, svg: `<g clip-path="url(#pa-slip-clip)"><g data-slip><g transform="${front(SLIP.x, SLIP.y, PRN_TOP + SLIP.out)}">${face}</g></g></g>` };
}

// 3 · Depósito: an alert board with a big lamp and a bell, a beacon on top, and a crate whose
// packing slip pops up when the warehouse is told.
const BOARD = { x: MX[2] - 27, y: -54, w: 54, d: 4 };
const BOARD_Z = [PAD_H + 3, PAD_H + 33];
const BELL = "M0 -5C-3.2 -5 -4.4 -2.2 -4.4 .8L-4.4 3.4L-5.8 5L5.8 5L4.4 3.4L4.4 .8C4.4 -2.2 3.2 -5 0 -5Z M-1.7 6.1A1.7 1.7 0 0 0 1.7 6.1Z";
function depot() {
  const out = [pad(2)];
  const foot = { x: BOARD.x - 2, y: BOARD.y - 3, w: BOARD.w + 4, d: 10, r: 1 };
  out.push(box(foot, PAD_H, 3, "pam-cream"));
  out.push(box({ ...BOARD, r: 0.6 }, BOARD_Z[0], BOARD_Z[1] - BOARD_Z[0], "pam-petrol"));
  out.push(S(k.cylinder(BOARD.x + BOARD.w - 6, BOARD.y + 2, 2.6, BOARD_Z[1], 1.4, P, 16), { tone: "mid", className: "pam-cream" }));
  out.push(`<g class="pa-beacon">${S(G.sphereOf([BOARD.x + BOARD.w - 6, BOARD.y + 2, BOARD_Z[1] + 4], 3, P, { steps: 16 }), { tone: "mid", crease: "none", className: "pam-sun" })}</g>`);
  const face = [
    `<circle class="pa-alert-glow" data-alert-glow cx="13" cy="12" r="11"/>`,
    `<circle class="pa-alert-lamp" data-alert-lamp cx="13" cy="12" r="7"/>`,
    `<g transform="translate(37 11)"><g data-bell><path class="pa-bell" d="${BELL}"/></g></g>`,
    `<rect class="pa-board-strip" data-strip x="5" y="23" width="${BOARD.w - 10}" height="4.4" rx="1"/>`,
  ].join("");
  out.push(`<g transform="${front(BOARD.x, BOARD.y + BOARD.d, BOARD_Z[1])}">${face}</g>`);
  // Crate with a packing slip clip.
  const crate = { x: MX[2] - 8, y: -22, w: 18, d: 14, r: 0.6 };
  out.push(box(crate, PAD_H, 10, "pam-kraft"));
  out.push(L(k.lineOnTop([crate.x, crate.y + crate.d / 2], [crate.x + crate.w, crate.y + crate.d / 2], PAD_H + 10, P), { tone: "lo", className: "pa-tape" }));
  out.push(`<g data-pack><g transform="${front(crate.x + 4, crate.y + crate.d / 2, PAD_H + 10)}"><rect class="pa-slip" width="10" height="11" rx=".4"/><rect class="pa-band" width="10" height="2.2"/><rect class="pa-slip-row" x="1.6" y="4.6" width="6.8" height=".8"/><rect class="pa-slip-row" x="1.6" y="7" width="4.4" height=".8"/></g></g>`);
  return out.join("");
}

// Done badges above each module.
const BADGE_AT = [[MX[0], RACK.y + 6, PAD_H + 48], [MX[1] + 30, PRN.y + 8, PAD_H + 30], [MX[2], BOARD.y, BOARD_Z[1] + 14]].map(at);
const badge = (i) => {
  const [x, y] = BADGE_AT[i];
  return `<g transform="translate(${r2(x)} ${r2(y)})"><g class="pa-ok" data-ok="${i}"><circle r="8.5"/><path d="M-4 0.2L-1.2 3L4.2 -2.6"/></g></g>`;
};

// One data pulse per module: along the belt from the dock, then down the branch.
const ROUTES = MX.map((x) => [[DOCK_X, BELT_Y], [x, BELT_Y], [x, BRANCH_Y[1]]]);
const pulse = (i) => `<g class="pa-pulse" data-pulse="${i}" opacity="0"><circle r="1.6" opacity=".35"/><circle r="2.2" opacity=".6"/><circle class="pa-pulse-head" r="3"/></g>`;

const SUN = at([150, -110, 62]);
const sun = `<circle class="pa-sun-glow" cx="${r2(SUN[0])}" cy="${r2(SUN[1])}" r="40"/><circle class="pa-sun" cx="${r2(SUN[0])}" cy="${r2(SUN[1])}" r="18"/>`;

const LABEL =
  "Maqueta de una estación de pedidos. Atrás, una tableta con un pedido de WhatsApp lo deja en una cinta que pasa por un control con dos luces: datos completos y stock disponible. La cinta alimenta tres módulos grandes al frente: un estante de stock donde sale una caja y el número baja de 120 a 110, una impresora que emite la factura y un tablero de depósito que prende una luz y toca una campana. Si falta stock, el pedido se queda en el control con una bandera de revisión.";

const slipParts = slip();
const defs = `<defs>${slipParts.clip}${TICKET_DEF}${BOX_DEF}</defs>`;
const svg = `<svg class="iso-svg pa-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${LABEL}">${defs}${[
  sun,
  slab(),
  stock(),
  picked(),
  printer(),
  slipParts.svg,
  depot(),
  branches(),
  phone(),
  gateFar(),
  belt(),
  `<g data-ticket transform="${shift([TICKET_X[2], BELT_Y, BELT_TOP])}"><use href="#pa-ticket"/></g>`,
  ...MX.map((_, i) => pulse(i)),
  gateNear(),
  ...MX.map((_, i) => badge(i)),
].join("")}</svg>`;

// ---- HTML: order card, gate verdict, action strip, footer ----------------------------------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const END = stateAt("ok", T.end.ok);
const line = orderLine("ok");
const [CHECK_X, CHECK_Y] = pct(at([GATE_X, LAMP_FACE_Y, GATE_TOP + 16]));
const html = `<div class="fig-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>automatización: 1 pedido → 3 acciones</span></div>
            <div class="iso pa-au" data-theme="light" data-kind="ok" data-phase="done">
              <div class="pa-order" data-order-card>
                <span class="pa-order-src">Entrada · WhatsApp</span>
                <span class="pa-order-line"><strong data-order-id>${line.id}</strong> · <span data-order-rest>${line.rest}</span></span>
                <span class="pa-order-checks">${ACTIONS.map((a, i) => `<span class="pa-tick" data-tick="${i}"${END.acts[i] ? " data-on" : ""}>${a.short}</span>`).join("")}</span>
              </div>
              <div class="pa-stage">${svg}
                <div class="pa-check" style="left:${CHECK_X}%;top:${CHECK_Y}%" data-check>
                  <span class="pa-check-flag">Necesita tu revisión</span>
                  <span class="pa-check-row" data-row="0" data-state="ok"><i></i><span data-row-text>Datos completos</span></span>
                  <span class="pa-check-row" data-row="1" data-state="ok"><i></i><span data-row-text>Stock disponible</span></span>
                </div>
              </div>
              <ol class="pa-acts">${ACTIONS.map((a, i) => `<li class="pa-act" data-act="${i}"${END.acts[i] ? " data-on" : ""}><span class="pa-act-name" data-act-name>${END.acts[i] ? a.done : a.todo}</span><span class="pa-act-detail" data-act-detail>${esc(detailOf(i, "ok", END.acts[i]))}</span></li>`).join("")}</ol>
            </div>
            <div class="flow-foot">
              <span class="counter" data-readout aria-live="polite">${END.readout}</span>
              <span class="pa-ctl"><button class="pa-alt" type="button" data-problem>Simular un problema</button><button class="btn btn-primary mini" type="button" data-order>Simular un pedido <span class="arrow" aria-hidden="true">→</span></button></span>
            </div>`;

const mix = (a, b, p) => `color-mix(in srgb, ${b} ${p}%, ${a})`;
const material = (name, base, top = mix(base, "white", 30)) =>
  `.pam-${name} { --anatomy-paper: ${mix(base, "var(--ink)", 14)}; --anatomy-top: ${top}; --anatomy-shade-3: ${mix(base, "white", 12)}; --anatomy-shade-2: ${base}; --anatomy-shade-1: ${mix(base, "var(--ink)", 10)}; --anatomy-shade-0: ${mix(base, "var(--ink)", 20)}; }`;
const MATERIALS = [
  material("paper", "#FFFDF7", "#FFFFFF"),
  material("bank", "#E2CFAE", "var(--paper)"),
  material("petrol", "var(--petrol)", mix("var(--petrol)", "white", 22)),
  material("ink", "#2A3A40", "#3A4C53"),
  material("cream", mix("var(--cream)", "var(--petrol)", 6), "var(--cream)"),
  material("sun", "#F08A3A", "#F5A361"),
  material("kraft", "#C99A5E", "#DDB57F"),
].join("\n  ");

const OKC = "#3F8F5F";
const css = `
  /* Automatización, "estación de pedidos": built by figures/auto/build.mjs with the Anatomy kit (MIT) */
  .pa-au.iso[data-theme="light"] {
    --anatomy-paper: var(--cream); --anatomy-card: var(--cream); --anatomy-text: var(--ink-2); --anatomy-strong: var(--ink); --anatomy-muted: var(--ink-2);
    --anatomy-face: #fff; --anatomy-top: #fff;
    --anatomy-shade-0: ${mix("var(--cream)", "var(--ink)", 14)}; --anatomy-shade-1: ${mix("var(--cream)", "var(--ink)", 9)};
    --anatomy-shade-2: ${mix("var(--cream)", "var(--ink)", 5)}; --anatomy-shade-3: ${mix("var(--cream)", "var(--ink)", 2)};
    --anatomy-hi: ${mix("transparent", "var(--ink)", 62)}; --anatomy-mid: ${mix("transparent", "var(--ink)", 42)}; --anatomy-lo: ${mix("transparent", "var(--ink)", 28)};
    --anatomy-faint: ${mix("transparent", "var(--ink)", 14)}; --anatomy-lit: var(--terra); --anatomy-halo: var(--petrol); --anatomy-halo-opacity: .2; --anatomy-dot: var(--ink);
    --anatomy-mono: var(--mono); --anatomy-weight: .6px;
  }
  ${MATERIALS}
  #fig-flow { display: flex; flex-direction: column; overflow: hidden; background:
    radial-gradient(46% 30% at 40% 30%, color-mix(in srgb, #F08A3A 13%, transparent), transparent 72%),
    linear-gradient(to bottom, var(--cream) 0%, var(--cream) 50%, color-mix(in srgb, var(--paper) 70%, var(--cream)) 100%); }
  #fig-flow .pa-au { flex: 1; display: flex; flex-direction: column; gap: 10px; position: relative; background: transparent; min-width: 0; }
  #fig-flow .flow-foot { flex-wrap: wrap; }
  #fig-flow .counter { flex: 1 1 220px; color: var(--ink); line-height: 1.45; }
  #fig-flow .pa-ctl { display: flex; align-items: center; gap: 6px 14px; flex-wrap: wrap; justify-content: flex-end; margin-left: auto; }
  #fig-flow .mini { white-space: nowrap; flex: none; }
  #fig-flow .pa-alt { min-height: 44px; padding: 0 2px; background: none; border: 0; color: var(--terra-ink); font: 600 14px/1.2 var(--sans); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; border-radius: 6px; }
  #fig-flow .pa-alt:hover { color: var(--terra); }
  #fig-flow .pa-alt:focus-visible, #fig-flow .mini:focus-visible { outline: 2px solid var(--terra); outline-offset: 3px; }
  /* order card: entry and result */
  .pa-order { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 9px 12px; background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 8px 18px -14px rgba(30,42,47,.5); font: 14px/1.35 var(--sans); color: var(--ink); transition: transform .5s var(--ease, ease-out), opacity .5s ease-out, border-color .3s; }
  .pa-au[data-phase="enter"] .pa-order { animation: pa-in .6s var(--ease, ease-out) both; }
  @keyframes pa-in { from { opacity: 0; transform: translateX(-18px); } }
  .pa-order-src { font: 600 12px/1 var(--mono); color: var(--ink-2); letter-spacing: .02em; }
  .pa-order-line { flex: 1 1 auto; }
  .pa-order-line strong { font-weight: 700; }
  .pa-order-checks { display: flex; gap: 6px; }
  .pa-tick { font: 600 12px/1 var(--mono); padding: 5px 8px; border-radius: 999px; background: var(--paper); color: var(--ink-2); transition: background .25s, color .25s; }
  .pa-tick::after { content: " ○"; }
  .pa-tick[data-on] { background: var(--terra); color: #fff; }
  .pa-tick[data-on]::after { content: "\\00a0✓"; }
  .pa-au[data-phase="paused"] .pa-order { border-color: var(--terra); }
  .pa-au[data-phase="paused"] .pa-tick::after { content: " –"; }
  /* stage and gate verdict */
  .pa-stage { position: relative; margin: 0 -10px; }
  .pa-check { position: absolute; transform: translate(-8%, calc(-100% - 6px)); display: grid; gap: 3px; padding: 6px 9px; background: rgba(255,255,255,.94); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 8px 16px -12px rgba(30,42,47,.55); font: 600 12px/1.25 var(--sans); color: var(--ink); white-space: nowrap; pointer-events: none; transition: border-color .25s; }
  .pa-check-flag { display: none; margin: -6px -9px 2px; padding: 5px 9px; border-radius: 9px 9px 0 0; background: var(--terra); color: #fff; font-weight: 700; }
  .pa-check-flag::before { content: "⚠ "; }
  .pa-check[data-bad] { border-color: var(--terra); }
  .pa-check[data-bad] .pa-check-flag { display: block; }
  .pa-check-row { display: flex; align-items: center; gap: 6px; color: var(--ink-2); }
  .pa-check-row i { width: 9px; height: 9px; border-radius: 50%; background: ${mix("var(--cream)", "var(--petrol)", 30)}; flex: none; }
  .pa-check-row[data-state="scan"] i { background: var(--river); box-shadow: 0 0 0 3px color-mix(in srgb, var(--river) 45%, transparent); }
  .pa-check-row[data-state="ok"] { color: var(--ink); }
  .pa-check-row[data-state="ok"] i { background: ${OKC}; }
  .pa-check-row[data-state="ok"] [data-row-text]::after { content: "\\00a0✓"; color: ${OKC}; }
  .pa-check-row[data-state="bad"] { color: var(--terra-ink); }
  .pa-check-row[data-state="bad"] i { background: #F08A3A; box-shadow: 0 0 0 3px color-mix(in srgb, #F08A3A 35%, transparent); }
  .pa-check-row[data-state="bad"] [data-row-text]::after { content: "\\00a0✗"; }
  /* the three actions */
  .pa-acts { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .pa-act { display: grid; gap: 2px; align-content: start; padding: 8px 10px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.6); transition: background .3s, border-color .3s; }
  .pa-act-name { font: 700 14px/1.2 var(--sans); color: var(--ink-2); }
  .pa-act-detail { font: 600 12px/1.3 var(--mono); color: var(--ink-2); }
  .pa-act[data-on] { background: color-mix(in srgb, var(--terra) 10%, #fff); border-color: var(--terra); }
  .pa-act[data-on] .pa-act-name { color: var(--terra-ink); }
  .pa-act[data-on] .pa-act-name::after { content: "\\00a0✓"; }
  .pa-act[data-on] .pa-act-detail { color: var(--ink); }
  .pa-au[data-phase="paused"] .pa-act { opacity: .55; }
  /* svg parts */
  .pa-svg { touch-action: pan-y; }
  .pa-au .pa-sun { fill: #F08A3A; opacity: .85; }
  .pa-au .pa-sun-glow { fill: #F08A3A; opacity: .1; }
  .pa-au .pa-slab-word { fill: var(--terra-ink); font-weight: 700; letter-spacing: .1em; }
  .pa-au .pa-screen { fill: var(--petrol); }
  .pa-au .pa-chat-in { fill: color-mix(in srgb, var(--river) 70%, #fff); }
  .pa-au .pa-chat { fill: #8CC59A; }
  .pa-au .pa-chat-row { fill: #fff; opacity: .85; }
  .pa-au .pa-badge { fill: var(--terra); stroke: #fff; stroke-width: .6px; vector-effect: non-scaling-stroke; transition: r .2s; }
  .pa-au .pa-roller { stroke: color-mix(in srgb, var(--cream) 22%, transparent); }
  .pa-au .pa-run { fill: none; stroke: var(--cream); stroke-opacity: .28; stroke-width: 1.2px; stroke-dasharray: 3 5; stroke-linecap: round; transition: stroke-opacity .3s, stroke .3s; }
  .pa-au[data-run] .pa-run { stroke: #F5A361; stroke-opacity: .95; animation: pa-belt .6s linear infinite; }
  @keyframes pa-belt { to { stroke-dashoffset: -8; } }
  .pa-au[data-off] .pa-run { animation-play-state: paused; }
  .pa-au .pa-curtain { fill: var(--river); opacity: 0; transition: opacity .2s; }
  .pa-au[data-scan] .pa-curtain { opacity: .45; }
  .pa-au .pa-lamp { fill: ${mix("var(--cream)", "var(--petrol)", 40)}; stroke: var(--cream); stroke-width: .8px; vector-effect: non-scaling-stroke; transition: fill .2s; }
  .pa-au .pa-lamp-glow { fill: ${OKC}; opacity: 0; transition: opacity .25s, fill .2s; }
  .pa-au .pa-lamp[data-state="scan"] { fill: var(--river); }
  .pa-au .pa-lamp[data-state="ok"] { fill: #5FBF82; }
  .pa-au .pa-lamp-glow[data-state="ok"] { opacity: .35; }
  .pa-au .pa-lamp[data-state="bad"] { fill: #F08A3A; }
  .pa-au .pa-lamp-glow[data-state="bad"] { fill: #F08A3A; opacity: .5; animation: pa-blink 1s steps(2, jump-none) infinite; }
  @keyframes pa-blink { 50% { opacity: .1; } }
  .pa-au .pa-flag path { fill: var(--terra); stroke: var(--terra-ink); stroke-width: .6px; vector-effect: non-scaling-stroke; }
  .pa-au .pa-flag { opacity: 0; transition: opacity .25s; }
  .pa-au[data-phase="paused"] .pa-flag { opacity: 1; }
  .pa-au .pa-band { fill: var(--terra); stroke: none; }
  .pa-au .pa-pad .iso-top { transition: fill .3s; }
  .pa-au .pa-pad[data-on] .iso-top { fill: color-mix(in srgb, var(--terra) 70%, #fff); }
  .pa-au .pa-pad[data-on] .iso-edge { stroke: var(--terra-ink); }
  .pa-tape { stroke: color-mix(in srgb, #C99A5E 55%, var(--ink)); stroke-width: 1px; }
  .pa-au .pa-window { fill: var(--ink); }
  .pa-au .pa-count { fill: var(--cream); font-family: var(--mono); font-weight: 700; transition: fill .2s; }
  .pa-au .pa-count[data-on] { fill: #F5A361; }
  .pa-au .pa-count-u { fill: var(--cream); opacity: .7; font-family: var(--mono); }
  .pa-au .pa-slot { fill: var(--ink); opacity: .8; stroke: none; }
  .pa-au .pa-dot { fill: ${mix("var(--cream)", "var(--petrol)", 40)}; transition: fill .2s; }
  .pa-au .pa-dot[data-on] { fill: #5FBF82; }
  .pa-au .pa-slip { fill: #fff; stroke: var(--anatomy-hi); stroke-width: .6px; vector-effect: non-scaling-stroke; }
  .pa-au .pa-slip-word { fill: var(--ink); font-family: var(--mono); font-weight: 700; letter-spacing: .04em; }
  .pa-au .pa-slip-small { fill: var(--ink-2); font-family: var(--mono); font-weight: 600; }
  .pa-au .pa-slip-row { fill: var(--ink); opacity: .22; }
  .pa-au .pa-alert-lamp { fill: ${mix("var(--cream)", "var(--petrol)", 55)}; stroke: var(--cream); stroke-width: .8px; vector-effect: non-scaling-stroke; transition: fill .2s; }
  .pa-au .pa-alert-lamp[data-on] { fill: var(--terra); }
  .pa-au .pa-alert-glow { fill: #F08A3A; opacity: 0; transition: opacity .3s; }
  .pa-au .pa-alert-glow[data-on] { opacity: .4; }
  .pa-au .pa-bell { fill: var(--cream); }
  .pa-au .pa-board-strip { fill: ${mix("var(--cream)", "var(--petrol)", 60)}; transition: fill .2s; }
  .pa-au .pa-board-strip[data-on] { fill: var(--cream); }
  .pa-au .pa-beacon { opacity: .55; transition: opacity .3s; }
  .pa-au .pa-beacon[data-on] { opacity: 1; }
  .pa-au .pa-ok { transform-box: fill-box; transform-origin: center; transform: scale(0); opacity: 0; transition: transform .35s cubic-bezier(.3,1.6,.5,1), opacity .2s; }
  .pa-au .pa-ok[data-on] { transform: scale(1); opacity: 1; }
  .pa-au .pa-ok circle { fill: var(--terra); stroke: #fff; stroke-width: 1.4px; vector-effect: non-scaling-stroke; }
  .pa-au .pa-ok path { fill: none; stroke: #fff; stroke-width: 2.2px; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .pa-au .pa-pulse circle { fill: var(--terra); }
  .pa-au .pa-pulse-head { stroke: #fff; stroke-width: 1px; vector-effect: non-scaling-stroke; }
  @media (max-width: 560px) {
    .pa-stage { margin: 0 -16px; }
    .pa-order { padding: 8px 10px; gap: 6px 10px; }
    .pa-acts { gap: 6px; }
    .pa-act { padding: 7px 8px; }
    .pa-act-name { font-size: 13px; }
  }
  @media (prefers-reduced-motion: reduce) { .pa-au *, .pa-au { transition: none !important; animation: none !important; } }
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^\/\/.*\n/gm, "").replace(/^export /gm, "");
const AX = k.axisVector(P, [1, 0, 0]);
const AY = k.axisVector(P, [0, 1, 0]);
const AZ = k.axisVector(P, [0, 0, 1]);

const js = `
  // Automatización, "estación de pedidos" (generated by figures/auto/build.mjs)
  {
    const fig = document.getElementById('fig-flow');
    const root = fig && fig.querySelector('.pa-au');
    if (root) {
    ${MODEL.trim().replace(/\n/g, "\n    ")}
    const AX = ${JSON.stringify(AX.map(r2))}, AY = ${JSON.stringify(AY.map(r2))}, AZ = ${JSON.stringify(AZ.map(r2))};
    const TICKET_X = ${JSON.stringify(TICKET_X)}, BELT = [${BELT_Y}, ${BELT_TOP}], ROUTES = ${JSON.stringify(ROUTES)};
    const PICK = [${JSON.stringify(PICK_FROM)}, ${JSON.stringify(PICK_TO)}], SLIP_IN = ${-(SLIP.out + 1)};
    const O = ${JSON.stringify(at([0, 0, 0]).map(r2))};
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const svg = root.querySelector('svg');
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const ticket = $('[data-ticket]'), badgeEl = $('[data-badge]'), check = $('[data-check]');
    const rows = $$('[data-row]'), lamps = $$('[data-lamp]'), glows = $$('[data-lamp-glow]');
    const pulses = $$('[data-pulse]'), pads = $$('[data-pad]'), oks = $$('[data-ok]'), branches = $$('[data-branch]');
    const ticks = $$('[data-tick]'), acts = $$('[data-act]');
    const orderId = $('[data-order-id]'), orderRest = $('[data-order-rest]');
    const count = $('[data-count]'), pick = $('[data-pick]'), picked = $('[data-picked]');
    const slipEl = $('[data-slip]'), prnDot = $('[data-prn-dot]');
    const alertLamp = $('[data-alert-lamp]'), alertGlow = $('[data-alert-glow]'), strip = $('[data-strip]'), bell = $('[data-bell]'), beacon = $('.pa-beacon'), pack = $('[data-pack]');
    const readout = fig.querySelector('[data-readout]'), button = fig.querySelector('[data-order]'), problem = fig.querySelector('[data-problem]');
    const move = (x, y, z) => 'translate(' + (x * AX[0] + y * AY[0] + z * AZ[0]).toFixed(2) + ' ' + (x * AX[1] + y * AY[1] + z * AZ[1]).toFixed(2) + ')';
    const smooth = (a, b, t) => { const s = Math.min(1, Math.max(0, (t - a) / (b - a))); return s * s * (3 - 2 * s); };
    const lens = ROUTES.map((pts) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0));
    const along = (r, d) => {
      const pts = ROUTES[r];
      for (let i = 1; i < pts.length; i++) {
        const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (d <= seg || i === pts.length - 1) { const t = seg ? Math.min(1, d / seg) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
        d -= seg;
      }
    };
    const flag = (el, on) => el.toggleAttribute('data-on', !!on);
    const text = (el, value) => { if (el.textContent !== value) el.textContent = value; };
    let kind = 'ok', t = T.end.ok, playing = false, frame = 0, last = 0, visible = false;
    let touring = !still.matches, wait = 1.2, runs = 0;
    function draw() {
      const s = stateAt(kind, t);
      const motion = !still.matches;
      root.dataset.kind = kind;
      root.dataset.phase = s.phase;
      root.toggleAttribute('data-run', playing && motion && t < T.acts[2] && !(s.flag) && !(s.ticket === 1 && t >= T.gate && t < T.lamp2 + 0.2));
      root.toggleAttribute('data-scan', s.lamps.includes('scan'));
      const line = orderLine(kind);
      text(orderId, line.id); text(orderRest, line.rest);
      // Ticket: phone → gate → dock.
      const p = s.ticket, x = p <= 1 ? TICKET_X[0] + (TICKET_X[1] - TICKET_X[0]) * p : TICKET_X[1] + (TICKET_X[2] - TICKET_X[1]) * (p - 1);
      ticket.setAttribute('transform', move(x, BELT[0], BELT[1]));
      badgeEl.setAttribute('r', (2.4 + (motion && t < 0.5 ? 1.4 * Math.sin(Math.PI * t / 0.5) : 0)).toFixed(2));
      // Gate.
      check.toggleAttribute('data-bad', s.flag);
      s.lamps.forEach((state, i) => {
        rows[i].dataset.state = state; lamps[i].dataset.state = state; glows[i].dataset.state = state;
        const label = i === 0 ? (state === 'ok' ? 'Datos completos' : 'Revisando datos') : state === 'bad' ? 'Falta stock: hay ' + STOCK + ', pide ' + ORDERS[kind].units : state === 'ok' ? 'Stock disponible' : 'Revisando stock';
        text(rows[i].querySelector('[data-row-text]'), label);
      });
      // Pulses along the belt and the branches.
      pulses.forEach((el, i) => {
        const e = s.pulses[i];
        el.setAttribute('opacity', e < 0 || !motion ? '0' : '1');
        if (e < 0) return;
        [...el.children].forEach((dot, n) => { const q = along(i, Math.max(0, e * lens[i] - (2 - n) * 3.4)), z = BELT[1] + 1.4; dot.setAttribute('cx', (O[0] + q[0] * AX[0] + q[1] * AY[0] + z * AZ[0]).toFixed(2)); dot.setAttribute('cy', (O[1] + q[0] * AX[1] + q[1] * AY[1] + z * AZ[1]).toFixed(2)); });
      });
      // Modules, the card and the strip.
      s.acts.forEach((on, i) => {
        flag(pads[i], on); flag(oks[i], on); flag(ticks[i], on); flag(acts[i], on);
        text(acts[i].querySelector('[data-act-name]'), on ? ACTIONS[i].done : ACTIONS[i].todo);
        text(acts[i].querySelector('[data-act-detail]'), detailOf(i, 'ok', on));
      });
      const since = (i) => (s.acts[i] ? (motion ? t - T.acts[i] : 9) : -1);
      // Stock: one box (ten units) leaves the top shelf, the sign goes 120 → 110.
      const a0 = since(0);
      text(count, String(s.stock)); flag(count, s.acts[0]);
      pick.setAttribute('opacity', a0 >= 0 ? '0' : '1');
      if (a0 >= 0) {
        const e = smooth(0, 0.9, a0), lift = Math.sin(Math.PI * e) * 6;
        picked.setAttribute('opacity', '1');
        // Forward off the shelf first, then down onto the pad.
        picked.setAttribute('transform', move((PICK[1][0] - PICK[0][0]) * smooth(0.3, 0.9, a0), (PICK[1][1] - PICK[0][1]) * smooth(0, 0.45, a0), (PICK[1][2] - PICK[0][2]) * smooth(0.35, 0.9, a0) + lift));
      } else picked.setAttribute('opacity', '0');
      // Factura: the slip rises out of the printer.
      const a1 = since(1);
      flag(prnDot, a1 >= 0 && a1 < 1.4 && motion ? Math.floor(a1 * 6) % 2 === 0 : a1 >= 0);
      slipEl.setAttribute('transform', move(0, 0, SLIP_IN * (1 - (a1 >= 0 ? smooth(0, 1.1, a1) : 0))));
      // Depósito: lamp, bell, beacon and the packing slip.
      const a2 = since(2);
      flag(alertLamp, a2 >= 0); flag(alertGlow, a2 >= 0); flag(strip, a2 >= 0); flag(beacon, a2 >= 0);
      bell.setAttribute('transform', 'rotate(' + (a2 >= 0 && a2 < 1 ? 18 * Math.sin(a2 * 24) * (1 - a2) : 0).toFixed(1) + ' 0 -5)');
      pack.setAttribute('transform', move(0, 0, a2 >= 0 ? 7 * smooth(0, 0.5, a2) : 0));
      text(readout, s.readout);
    }
    function start(next) {
      kind = next; t = still.matches ? T.end[next] : 0; playing = !still.matches;
      draw(); run();
    }
    function tick(now) {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      if (playing) { t += dt; if (t >= T.end[kind]) { t = T.end[kind]; playing = false; wait = 1.2; } draw(); }
      else if (touring) { wait -= dt; if (wait <= 0) { runs++; start(runs % 3 === 0 ? 'problem' : 'ok'); } }
      frame = visible && (playing || touring) && !still.matches ? requestAnimationFrame(tick) : 0;
    }
    const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
    const user = (next) => { touring = false; readout.setAttribute('aria-live', 'polite'); start(next); };
    button.addEventListener('click', () => user('ok'));
    problem.addEventListener('click', () => user('problem'));
    // After a quiet spell the tour resumes.
    let quiet = 0;
    const resume = () => { clearTimeout(quiet); quiet = setTimeout(() => { if (!still.matches) { touring = true; readout.setAttribute('aria-live', 'off'); run(); } }, 14000); };
    button.addEventListener('click', resume); problem.addEventListener('click', resume);
    still.addEventListener('change', () => { touring = !still.matches; if (still.matches) { playing = false; t = T.end[kind]; draw(); } run(); });
    if (touring) readout.setAttribute('aria-live', 'off');
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      root.toggleAttribute('data-off', !visible);
      if (visible) run();
    }, { rootMargin: '120px 0px' }).observe(root);
    draw();
    }
  }
`;

const replaceBetween = (text, start, end, body) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`markers not found: ${start} … ${end}`);
  return text.slice(0, from + start.length) + body + text.slice(to);
};

// Read, replace and write in one synchronous step: other figures' builds edit the same page.
let pageText = readFileSync(ARTBOARD, "utf8");
if (!pageText.includes(".iso-svg{")) throw new Error("kit base CSS (.iso-svg) missing: run figures/software/build.mjs first");
pageText = replaceBetween(pageText, "<!-- fig-auto:start -->", "<!-- fig-auto:end -->", `\n            ${html}\n            `);
pageText = replaceBetween(pageText, "/* fig-auto:css:start */", "/* fig-auto:css:end */", css + "  ");
pageText = replaceBetween(pageText, "// fig-auto:js:start", "// fig-auto:js:end", js + "  ");
writeFileSync(ARTBOARD, pageText);
const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(1);
console.log(`wrote ${ARTBOARD}: html+svg ${kb(html)} KB, css ${kb(css)} KB, js ${kb(js)} KB, total ${kb(html + css + js)} KB (scale ${r2(P.scale)}, ${BOX_UNITS} u./box, orders ${Object.keys(ORDERS).join("/")})`);
