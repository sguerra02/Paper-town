/* Facades for catalog variants. Each function gets the face, its width and outline, and the items the
   building type would have drawn (base); it returns the items to draw instead (often base plus extras). */
import { signText } from './venues.js';
import { glassDoor, slit, xBrace } from '../openings/doors.js';
import { paneBand } from '../openings/effects.js';
import { drawOpening } from '../openings/index.js';
import { pl, poly, txt } from '../../lib/draw.js';
import {
  archPoly,
  bbox,
  circ,
  clipConvex,
  freeIntervals,
  lancetPoly,
  rectP,
  spread
} from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

/* ---------- small drawing helpers ---------- */

const ink = c => (c.L ? '#222222' : '#2a2a2a');
const dark = c => (c.L ? '#ffffff' : '#1d1b19');
const rect = (x, y, w, h, fill, stroke, sw = 0.3) => poly(rectP(x, y, w, h), { fill, stroke, w: sw });
const win = (x, y, w, h, c, style, extra) =>
  drawOpening(Object.assign({ type: 'win', x, y, w, h }, extra || {}), c, { winStyle: style || 'rect' });
const door = (x, y, w, h, c, ds) =>
  drawOpening({ type: 'door', x, y, w, h, doorStyle: ds || 'panel' }, c, null);
const garage = (x, y, w, h, c, gs, gwin) =>
  drawOpening({ type: 'garage', x, y, w, h, gstyle: gs || 'panel', gwin }, c, null);
const plaque = (s, x0, x1, y0, y1, c, bg, fg) => [
  rect(x0, y0, x1 - x0, y1 - y0, c.L ? '#ffffff' : bg, c.trimLine),
  ...signText(s, x0, x1, y0, y1, c, c.L ? '#222222' : fg)
];
function winRow(it, c, iv, y, ww, wh, step, style, margin = 1.5) {
  spread(iv, margin, step, ww).forEach(x => it.push(...win(x - ww / 2, y, ww, wh, c, style)));
}
/* the top of a wall at x (for gable ends): highest y of the outline above x */
function topAt(P, x) {
  let best = 0;
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i],
      b = P[(i + 1) % n];
    if ((a[0] - x) * (b[0] - x) <= 0 && Math.abs(b[0] - a[0]) > 1e-9) {
      const y = a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
      best = Math.max(best, y);
    }
  }
  return best;
}
/* a round or louvred vent high in a gable */
function gableVent(it, c, P, w, H, round) {
  const bb = bbox(P),
    gh = bb.y1 - H;
  if (gh < 2.4) return;
  const y = H + gh * 0.42,
    r = Math.min(1.4, gh * 0.22);
  if (round) it.push(...win(w / 2 - r, y - r, 2 * r, 2 * r, c, 'round'));
  else {
    it.push(rect(w / 2 - r, y - r * 0.8, 2 * r, r * 1.6, c.trim, c.trimLine));
    const ls = [];
    for (let yy = y - r * 0.6; yy < y + r * 0.7; yy += 0.35)
      ls.push([
        [w / 2 - r + 0.2, yy],
        [w / 2 + r - 0.2, yy]
      ]);
    it.push({ t: 'segs', s: ls, stroke: c.trimLine, w: 0.25 });
  }
}
const isGable = (A, P, H) => (A.side === 'left' || A.side === 'right') && bbox(P).y1 > H + 1;
/* a red cross on a white square */
function cross(it, c, cx, cy, s) {
  it.push(rect(cx - s / 2, cy - s / 2, s, s, '#ffffff', c.trimLine));
  const r = c.L ? '#ffffff' : '#c8282d',
    k = s * 0.2;
  it.push(
    poly(rectP(cx - k, cy - s * 0.38, 2 * k, s * 0.76), { fill: r, stroke: c.L ? '#222222' : null, w: 0.25 }),
    poly(rectP(cx - s * 0.38, cy - k, s * 0.76, 2 * k), { fill: r, stroke: c.L ? '#222222' : null, w: 0.25 })
  );
}
/* candy stripes across a band */
function stripes(it, c, x0, x1, y0, y1, step, a, b) {
  for (let x = x0, i = 0; x < x1 - 1e-6; x += step, i++)
    it.push(poly(rectP(x, y0, Math.min(step, x1 - x), y1 - y0), { fill: c.L ? '#ffffff' : i % 2 ? b : a }));
  it.push(poly(rectP(x0, y0, x1 - x0, y1 - y0), { stroke: c.trimLine, w: 0.3 }));
}
/* a walk-up service window with a little shelf */
function serviceWindow(it, c, x, y, w, h) {
  it.push(
    rect(x - 0.3, y - 0.3, w + 0.6, h + 0.6, c.trim, c.trimLine),
    ...paneBand(x, x + w, y, y + h, c, Math.max(1.6, w / 2))
  );
  it.push(rect(x - 0.6, y - 0.75, w + 1.2, 0.45, c.L ? '#ffffff' : '#b9bec1', c.metalLine));
}
/* the sign band on a flat-roofed roadside front (the strip above the roof line) */
function roadBand(it, B, w, c, text) {
  it.push(
    rect(0, B.H + 0.3, w, B.Hf - B.H - 0.7, c.accent, c.accentLine, 0.35),
    ...signText(text, 0, w, B.H + 0.3, B.Hf - 0.4, c)
  );
}

/* ---------- Main Street ---------- */

function barber(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found;
  if (A.role !== 'front') return base;
  const it = base.slice(),
    x = 1.35,
    y0 = F + 2,
    h = 5.5,
    pw = 0.75,
    pole = rectP(x, y0, pw, h);
  it.push(poly(pole, { fill: '#ffffff', stroke: c.trimLine, w: 0.25 }));
  if (!c.L)
    for (let k = -4; k < 12; k++) {
      const yy = y0 + k * 0.7;
      const s = clipConvex(
        [
          [x, yy],
          [x + pw, yy + 0.5],
          [x + pw, yy + 0.8],
          [x, yy + 0.3]
        ],
        pole
      );
      if (s && s.length > 2) it.push(poly(s, { fill: k % 2 ? '#2a4a9a' : '#c8282d' }));
    }
  it.push(
    poly(circ(x + pw / 2, y0 + h + 0.35, 0.45, 12), {
      fill: c.L ? '#ffffff' : '#c9ced0',
      stroke: c.trimLine,
      w: 0.25
    }),
    rect(x - 0.1, y0 - 0.35, pw + 0.2, 0.35, c.L ? '#ffffff' : '#c9ced0', c.trimLine, 0.25)
  );
  return it;
}

function bank(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    gT = F + B.G;
  if (A.role !== 'front') return base;
  const it = [],
    stone = c.L ? '#ffffff' : shade(c.trim, -0.06);
  it.push(rect(0, 0, w, F + 0.6, c.L ? '#ffffff' : shade(c.trim, -0.18), c.trimLine));
  const eY = gT - 2.6,
    n = 4,
    x0 = w * 0.14,
    x1 = w * 0.86,
    cw = 1.3;
  /* windows between the outer columns, the door in the middle bay */
  const bayW = (x1 - x0) / (n - 1);
  for (let i = 0; i < n - 1; i++) {
    const bx = x0 + i * bayW + bayW / 2;
    if (i === 1)
      it.push(
        ...drawOpening(
          {
            type: 'double',
            x: bx - 2.4,
            y: F + 0.6,
            w: 4.8,
            h: Math.min(8.6, eY - F - 2),
            doorStyle: 'panel'
          },
          c,
          null
        )
      );
    else it.push(...win(bx - 1.6, F + 2.4, 3.2, Math.min(7.5, eY - F - 3.6), c, 'arched'));
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + i * bayW;
    it.push(
      rect(x - cw / 2, F + 0.6, cw, eY - F - 0.6, stone, c.trimLine),
      rect(x - cw / 2 - 0.25, F + 0.6, cw + 0.5, 0.45, stone, c.trimLine, 0.25),
      rect(x - cw / 2 - 0.3, eY - 0.55, cw + 0.6, 0.55, stone, c.trimLine, 0.25)
    );
    const fl = [];
    for (let k = 1; k < 3; k++)
      fl.push([
        [x - cw / 2 + (cw * k) / 3, F + 1.1],
        [x - cw / 2 + (cw * k) / 3, eY - 0.6]
      ]);
    it.push({ t: 'segs', s: fl, stroke: c.trimLine, w: 0.2 });
  }
  it.push(
    rect(0.4, eY, w - 0.8, 2, stone, c.trimLine),
    ...signText(B.sign || 'BANK', 0.4, w - 0.4, eY, eY + 2, c, ink(c))
  );
  const bb = bbox(P),
    py = eY + 2,
    pk = Math.min(bb.y1 - 0.4, py + (x1 - x0) * 0.18);
  if (pk > py + 0.8)
    it.push(
      poly(
        [
          [x0 - 1.2, py],
          [x1 + 1.2, py],
          [w / 2, pk]
        ],
        { fill: stone, stroke: c.trimLine, w: 0.35 }
      )
    );
  for (let s = 1; s < B.stories; s++) {
    const fl = gT + (s - 1) * B.storyH;
    winRow(it, c, [[0, w]], fl + 3, 3, Math.min(5.5, B.storyH - 4), 6, 'rect');
  }
  return it;
}

/* ---------- Roadside ---------- */

function burger(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    it = [];
  if (A.role !== 'front') return base;
  stripes(it, c, 0, w, F, F + 2.4, 1.2, c.accent, c.trim);
  const n = Math.max(2, Math.min(4, Math.floor((w - 6) / 6))),
    sw = (w - 6) / n;
  for (let i = 0; i < n; i++) serviceWindow(it, c, 1 + i * sw + 0.6, F + 3.4, sw - 1.2, 3.6);
  it.push(...glassDoor(w - 4.4, F, 3.2, 7.2, c));
  roadBand(it, B, w, c, B.sign || 'BURGERS');
  return it;
}

function icecream(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  stripes(it, c, 0, w, F, F + 3, 0.9, c.accent, '#ffffff');
  if (A.role === 'front') {
    serviceWindow(it, c, w * 0.12, F + 3.6, w * 0.32, 3.4);
    serviceWindow(it, c, w * 0.56, F + 3.6, w * 0.32, 3.4);
    roadBand(it, B, w, c, B.sign || 'ICE CREAM');
  } else if (A.role === 'right' || A.role === 'left') {
    /* a giant cone */
    const cx = w / 2,
      cy = F + 4.2,
      r = Math.min(1.6, (H - F - 4) * 0.35);
    it.push(
      poly(
        [
          [cx - r * 0.9, cy],
          [cx + r * 0.9, cy],
          [cx, cy - r * 2.1]
        ],
        { fill: c.L ? '#ffffff' : '#d8a560', stroke: c.trimLine, w: 0.3 }
      ),
      poly(circ(cx, cy + r * 0.55, r, 18), { fill: c.L ? '#ffffff' : '#f3c6d3', stroke: c.trimLine, w: 0.3 }),
      poly(circ(cx, cy + r * 1.5, r * 0.75, 16), {
        fill: c.L ? '#ffffff' : '#f7efe0',
        stroke: c.trimLine,
        w: 0.3
      })
    );
  } else it.push(...door(w * 0.25, F, 3, 7, c));
  return it;
}

function mart(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  it.push(rect(0, H - 0.9, w, 0.7, c.accent, c.accentLine, 0.25));
  if (A.role === 'front') {
    const top = Math.min(F + 8, H - 1.6),
      dx = w * 0.7;
    it.push(
      ...paneBand(0.8, dx - 0.4, F + 0.6, top, c, 4),
      ...paneBand(dx + 3.8, w - 0.8, F + 0.6, top, c, 4)
    );
    it.push(...glassDoor(dx, F, 3.4, top - F, c));
    /* posters in the glass */
    if (!c.L)
      [0.15, 0.34].forEach((k, i) =>
        it.push(rect(w * k, F + 1.2, 2.2, 2.8, ['#e8c33a', '#c8282d'][i], c.trimLine, 0.2))
      );
    roadBand(it, B, w, c, B.sign || 'MART');
  } else if (A.role === 'back') it.push(...door(w * 0.2, F, 3.2, 7, c));
  else
    it.push(
      rect(1.5, F + 4.5, w - 3, 2.2, c.L ? '#ffffff' : '#f1ece0', c.trimLine),
      ...signText('ICE · SNACKS', 1.5, w - 1.5, F + 4.5, F + 6.7, c, ink(c))
    );
  return it;
}

function coffee(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  it.push(rect(0, F, w, 1.4, c.L ? '#ffffff' : shade(c.wall, -0.2), c.wallLine, 0.25));
  if (A.role === 'front') {
    it.push(...paneBand(1, w - 1, F + 3.2, Math.min(F + 7.2, H - 1), c, 2.4));
    roadBand(it, B, w, c, B.sign || 'COFFEE');
  } else if (A.role === 'right') serviceWindow(it, c, w / 2 - 1.6, F + 3.4, 3.2, 3);
  else if (A.role === 'left')
    it.push(
      rect(w / 2 - 2.2, F + 3, 4.4, 3.4, c.L ? '#ffffff' : '#3a2c22', c.trimLine),
      ...signText('MENU', w / 2 - 2.2, w / 2 + 2.2, F + 5.4, F + 6.4, c, '#f1ece0')
    );
  else it.push(...door(w / 2 - 1.5, F, 3, 7, c));
  return it;
}

/* ---------- Offices ---------- */

function deco(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    gT = F + B.G;
  if (A.role === 'party') return base;
  const it = base.slice(),
    pier = c.L ? '#ffffff' : shade(c.wall, 0.12),
    n = Math.max(3, Math.round(w / 7));
  for (let i = 0; i <= n; i++) {
    const x = (w * i) / n;
    it.push(rect(Math.max(0, Math.min(w - 0.8, x - 0.4)), gT, 0.8, B.H - gT + 0.7, pier, c.wallLine, 0.25));
  }
  /* stepped crown bands */
  [0, 1, 2].forEach(k => {
    const m = w * (0.08 + k * 0.12);
    it.push(rect(m, B.H - 1.2 - k * 1.1, w - 2 * m, 0.45, c.accent, c.accentLine, 0.25));
  });
  if (A.role === 'front') {
    /* a sunburst over the door */
    const cx = w / 2,
      cy = gT - 3,
      rs = [];
    for (let k = 0; k <= 8; k++) {
      const a = (Math.PI * k) / 8;
      rs.push([
        [cx, cy],
        [cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6]
      ]);
    }
    it.push({ t: 'segs', s: rs, stroke: c.L ? '#222222' : c.accent, w: 0.35 });
  }
  return it;
}

function clinic(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found;
  if (A.role !== 'front' && A.role !== 'right') return base;
  const it = base.slice();
  if (A.role === 'front') cross(it, c, w - 2.6, F + B.G + 1.6, 3);
  else cross(it, c, w / 2, B.H - 3, 3.6);
  return it;
}

function parkGarage(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found;
  if (A.role === 'party') return base;
  const it = [],
    con = c.L ? '#ffffff' : c.concrete || '#cfcdc6',
    lv = [F];
  let y = F + B.G;
  while (y < B.H - 0.5) {
    lv.push(y);
    y += B.storyH;
  }
  lv.push(B.H);
  const bays = Math.max(2, Math.round(w / 9));
  for (let i = 0; i < lv.length - 1; i++) {
    const y0 = lv[i] + (i ? 3 : 0),
      y1 = lv[i + 1] - 0.3;
    if (y1 - y0 < 1.5) continue;
    for (let k = 0; k < bays; k++) {
      const x0 = (w * k) / bays + 0.5,
        x1 = (w * (k + 1)) / bays - 0.5;
      if (i === 0 && A.role === 'front' && k === Math.floor(bays / 2)) continue;
      it.push(rect(x0, y0, x1 - x0, y1 - y0, dark(c), c.wallLine, 0.25));
      if (!c.L && i > 0 && (i * 3 + k) % 4 === 0)
        it.push(
          rect(x0 + 1, y0, Math.min(5, x1 - x0 - 2), 1.6, ['#c8282d', '#3a6ea8', '#e4e4e4'][k % 3], null)
        );
    }
    it.push(rect(0, lv[i + 1] - 0.3, w, 0.3, con, c.wallLine, 0.2));
  }
  if (A.role === 'front') {
    const k = Math.floor(bays / 2),
      x0 = (w * k) / bays + 0.5,
      x1 = (w * (k + 1)) / bays - 0.5;
    it.push(rect(x0, F, x1 - x0, Math.min(8, lv[1] - F - 1), dark(c), c.trimLine));
    it.push(
      rect(x0, F + Math.min(8, lv[1] - F - 1), x1 - x0, 1.6, c.accent, c.accentLine),
      ...signText(
        B.sign || 'PARKING',
        x0,
        x1,
        F + Math.min(8, lv[1] - F - 1),
        F + Math.min(8, lv[1] - F - 1) + 1.6,
        c
      )
    );
    const py = lv[1] + 4;
    if (py + 4 < B.H)
      it.push(
        rect(0.6, py, 3.4, 3.4, c.L ? '#ffffff' : '#2a4a9a', c.trimLine),
        ...signText('P', 0.6, 4, py, py + 3.4, c, '#ffffff')
      );
  }
  return it;
}

/* ---------- Entertainment ---------- */

function opera(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H;
  if (A.role !== 'front') return base;
  const it = [],
    tr = c.L ? '#ffffff' : shade(c.trim, -0.05);
  it.push(rect(0, 0, w, F + 0.8, c.L ? '#ffffff' : shade(c.wall, -0.18), c.wallLine));
  const n = 3,
    dw = Math.min(4.2, (w - 8) / 5);
  for (let i = 0; i < n; i++) {
    const x = w / 2 + (i - 1) * (dw + 2.4) - dw / 2;
    it.push(
      poly(archPoly(x - 0.4, F + 0.8, dw + 0.8, 10), { fill: tr, stroke: c.trimLine, w: 0.3 }),
      ...glassDoor(x, F + 0.8, dw, 7.6, c),
      ...win(x + 0.2, F + 8.6, dw - 0.4, 1.6, c, 'half')
    );
  }
  const up = F + 12.5;
  if (H - up > 8) {
    spread([[0, w]], 2.5, 6, 3).forEach(x =>
      it.push(...win(x - 1.5, up + 1, 3, Math.min(7, H - up - 6), c, 'arched'))
    );
  }
  for (let x = 0.8; x < w; x += (w - 1.6) / 6)
    it.push(rect(x - 0.4, F + 0.8, 0.8, H - F - 4.6, tr, c.trimLine, 0.25));
  it.push(
    rect(0.4, H - 3.8, w - 0.8, 2.4, c.L ? '#ffffff' : c.accent, c.accentLine),
    ...signText(B.sign || 'OPERA HOUSE', 0.4, w - 0.4, H - 3.8, H - 1.4, c, c.L ? '#222222' : '#f4ead2')
  );
  it.push(rect(0, H - 1.2, w, 0.8, tr, c.trimLine));
  return it;
}

function rink(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [],
    bb = bbox(P);
  if (A.side === 'front') {
    const dw = 8;
    it.push(rect(w / 2 - dw / 2 - 0.4, F, dw + 0.8, 8, c.trim, c.trimLine));
    it.push(...glassDoor(w / 2 - dw / 2, F, dw / 2, 7.6, c), ...glassDoor(w / 2, F, dw / 2, 7.6, c));
    const sy = Math.min(F + 9.5, bb.y1 - 6);
    it.push(
      rect(w * 0.2, sy, w * 0.6, 2.8, c.accent, c.accentLine, 0.35),
      ...signText(B.sign || 'ROLLER RINK', w * 0.2, w * 0.8, sy, sy + 2.8, c)
    );
    const ry = (sy + 2.8 + bb.y1) / 2;
    if (bb.y1 - sy > 9) it.push(...win(w / 2 - 1.8, ry - 1.8, 3.6, 3.6, c, 'round'));
    if (!c.L)
      [w * 0.12, w * 0.88].forEach(x =>
        it.push(
          poly(circ(x, F + 4.5, 1.6, 20), { fill: c.accent, stroke: c.accentLine, w: 0.3 }),
          poly(circ(x, F + 4.5, 0.7, 14), { fill: '#ffffff' })
        )
      );
  } else if (A.side === 'back') it.push(...door(w * 0.25, F, 3.2, 7, c));
  else winRow(it, c, [[0, w]], F + Math.max(2.5, H - F - 5), 4, Math.min(3, H - F - 3), 8, 'rect', 2);
  return it;
}

function snackBar(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H;
  if (A.role !== 'front') return base;
  const it = [];
  stripes(it, c, 0, w, F, F + 2.2, 1.4, c.accent, c.trim);
  serviceWindow(it, c, 1.2, F + 3.2, w - 6.5, Math.min(3.6, H - F - 4.2));
  it.push(...glassDoor(w - 4.3, F, 3.2, Math.min(7.2, H - F - 0.6), c));
  it.push(
    rect(0.3, H - 0.2, w - 0.6, B.Hf - H, c.accent, c.accentLine),
    ...signText(B.sign || 'SNACK BAR', 0.3, w - 0.3, H - 0.2, B.Hf - 0.2, c)
  );
  return it;
}

/* ---------- Civic ---------- */

function school(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  const wh = Math.min(6.5, H - F - 3.2);
  if (A.side === 'front') {
    const dw = 4.4;
    it.push(
      ...drawOpening(
        { type: 'double', x: w / 2 - dw / 2, y: F, w: dw, h: Math.min(7.8, H - F - 2.4), doorStyle: 'panel' },
        c,
        null
      )
    );
    if (H - F - 7.8 > 2.6 || true) {
      const sy = Math.min(F + 8.4, H - 1.6);
      if (sy + 1.2 < H)
        it.push(
          ...plaque(
            B.sign || 'SCHOOL',
            w / 2 - 4,
            w / 2 + 4,
            sy,
            Math.min(sy + 1.6, H - 0.3),
            c,
            '#f4efe2',
            '#2a2a2a'
          )
        );
    }
    winRow(it, c, freeIntervals(w, [[w / 2 - 4.5, w / 2 + 4.5]]), F + 2.4, 2.8, wh, 5, 'rect');
  } else if (A.side === 'back') winRow(it, c, [[0, w]], F + 2.4, 2.8, wh, 5, 'rect');
  else {
    winRow(it, c, [[0, w]], F + 2.4, 2.8, wh, 5.5, 'rect', 2);
    gableVent(it, c, P, w, H, true);
  }
  return it;
}

function hospital(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal;
  if (A.role !== 'front' && A.role !== 'left') return base;
  const it = base.slice();
  if (A.role === 'front') cross(it, c, 3, B.H - 3.2, 3.4);
  else {
    const y = B.found + 8;
    it.push(
      rect(w * 0.2, y, w * 0.6, 1.8, c.L ? '#ffffff' : '#c8282d', c.trimLine),
      ...signText('EMERGENCY', w * 0.2, w * 0.8, y, y + 1.8, c, '#ffffff')
    );
  }
  return it;
}

/* ---------- Backyard & garden ---------- */

function shed(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    const dw = Math.min(5, w * 0.55),
      dh = Math.min(6.4, H - F - 0.3);
    [w / 2 - dw / 2, w / 2].forEach(x =>
      it.push(rect(x, F, dw / 2, dh, c.door, c.doorLine, 0.35), ...xBrace(x, F, dw / 2, dh, 0.35, c))
    );
    it.push(rect(w / 2 - dw / 2 - 0.3, F + dh, dw + 0.6, 0.3, c.trim, c.trimLine, 0.25));
  } else if (A.side === 'right' || A.side === 'left') {
    if (A.side === 'right' && H - F > 4)
      it.push(
        ...win(w / 2 - 1.2, F + Math.min(3.4, H - F - 2.6), 2.4, 2, c, 'rect', {
          panes: 'grid',
          shut: B.shutters ? 'on' : 'off'
        })
      );
    gableVent(it, c, P, w, H, false);
  }
  return it;
}

function leanto(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    it.push(...door(0.8, F, Math.min(2.8, w * 0.35), Math.min(6.4, H - F - 0.3), c, 'plank'));
    if (w > 6)
      it.push(
        ...win(w * 0.55, F + 3, Math.min(3.6, w * 0.35), Math.min(2.2, H - F - 3.6), c, 'rect', {
          panes: 'grid'
        })
      );
    /* a potting bench under the window */
    it.push(
      rect(w * 0.5, F + 2.4, Math.min(4.6, w * 0.45), 0.35, c.L ? '#ffffff' : '#8a6a48', c.trimLine, 0.25)
    );
    if (!c.L)
      [0.58, 0.72, 0.86].forEach(k =>
        it.push(
          poly(
            [
              [w * k - 0.35, F + 2.75],
              [w * k + 0.35, F + 2.75],
              [w * k + 0.25, F + 3.4],
              [w * k - 0.25, F + 3.4]
            ],
            { fill: '#b5643a', stroke: c.trimLine, w: 0.2 }
          )
        )
      );
  } else if (A.side !== 'back') it.push(...win(w / 2 - 1, F + 3, 2, 1.8, c, 'rect', { panes: 'grid' }));
  return it;
}

function outhouse(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    const dw = Math.min(2.4, w * 0.62),
      dh = Math.min(6.2, H - F - 0.3),
      x = w / 2 - dw / 2;
    it.push(...door(x, F, dw, dh, c, 'plank'));
    /* the crescent moon */
    const mx = w / 2,
      my = F + dh - 1.1,
      r = 0.45,
      moon = [];
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 12;
      moon.push([mx + r * Math.cos(a), my + r * Math.sin(a)]);
    }
    for (let i = 12; i >= 0; i--) {
      const a = -Math.PI / 2 + (Math.PI * i) / 12;
      moon.push([mx + r * 0.45 * Math.cos(a) - 0.05, my + r * 0.85 * Math.sin(a)]);
    }
    it.push(poly(moon, { fill: dark(c), stroke: c.L ? '#222222' : null, w: 0.2 }));
  } else if (A.side === 'left' || A.side === 'right') gableVent(it, c, P, w, H, false);
  return it;
}

function playhouse(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  const flowerBox = (x, y, ww) => {
    it.push(rect(x - 0.2, y - 0.75, ww + 0.4, 0.55, c.L ? '#ffffff' : c.accent, c.trimLine, 0.25));
    if (!c.L)
      for (let k = 0; k < 4; k++)
        it.push(
          poly(circ(x + ((k + 0.5) * ww) / 4, y - 0.12, 0.22, 8), {
            fill: ['#e4577a', '#f3c13a', '#e4577a', '#ffffff'][k]
          })
        );
  };
  if (A.side === 'front') {
    const dh = Math.min(4.6, H - F - 0.3);
    it.push(...door(0.9, F, Math.min(2.2, w * 0.3), dh, c, 'dutch'));
    const ww = Math.min(2.2, w * 0.3),
      wx = w - ww - 1.4,
      wy = F + Math.min(1.8, H - F - 2.4);
    it.push(...win(wx, wy, ww, Math.min(2, H - wy - 0.4), c, 'rect', { shut: 'on' }));
    flowerBox(wx, wy, ww);
  } else if (A.side === 'right' || A.side === 'left') {
    const wy = F + Math.min(1.8, H - F - 2.4);
    it.push(...win(w / 2 - 1, wy, 2, Math.min(2, H - wy - 0.4), c, 'rect', { shut: 'on' }));
    flowerBox(w / 2 - 1, wy, 2);
    const bb = bbox(P);
    if (bb.y1 - H > 2) {
      const hy = H + (bb.y1 - H) * 0.42,
        s = Math.min(0.8, (bb.y1 - H) * 0.18),
        heart = [];
      for (let i = 0; i < 24; i++) {
        const t = (i / 24) * 2 * Math.PI;
        heart.push([
          w / 2 + s * 0.06 * 16 * Math.sin(t) ** 3,
          hy + s * 0.06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
        ]);
      }
      it.push(poly(heart, { fill: c.L ? '#ffffff' : '#e4577a', stroke: c.trimLine, w: 0.2 }));
    }
  }
  return it;
}

function poolhouse(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    const sw = Math.min(8, w * 0.5);
    it.push(
      ...drawOpening(
        { type: 'sliding', x: 1.2, y: F, w: sw, h: Math.min(6.8, H - F - 0.6), doorStyle: 'two' },
        c,
        null
      )
    );
    it.push(...win(sw + 2.6, F + 3, Math.min(3.4, w - sw - 4), Math.min(3, H - F - 3.8), c, 'rect'));
    /* a life ring */
    if (w - sw - 4 > 2 && !c.L) {
      const cx = w - 1.6,
        cy = F + 1.6;
      it.push(
        poly(circ(cx, cy, 0.9, 20), { fill: '#ffffff', stroke: c.trimLine, w: 0.25 }),
        poly(circ(cx, cy, 0.45, 16), { fill: c.wall })
      );
      [0, 1, 2, 3].forEach(k => {
        const a = (k * Math.PI) / 2 + Math.PI / 4;
        it.push(poly(circ(cx + Math.cos(a) * 0.68, cy + Math.sin(a) * 0.68, 0.2, 8), { fill: '#c8282d' }));
      });
    }
  } else if (A.side === 'right' || A.side === 'left') {
    if (A.side === 'left') it.push(...door(w / 2 - 1.4, F, 2.8, Math.min(6.8, H - F - 0.4), c, 'half'));
    else it.push(...win(w / 2 - 1.4, F + 3.4, 2.8, Math.min(2.4, H - F - 4), c, 'rect'));
    gableVent(it, c, P, w, H, true);
  }
  return it;
}

function hutch(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    const mw = w * 0.58,
      mh = H - F - 0.5;
    it.push(rect(0.3, F + 0.2, mw, mh, c.L ? '#ffffff' : '#3a3f3a', c.trimLine));
    const g = [];
    for (let x = 0.3; x < 0.3 + mw; x += 0.2)
      g.push([
        [x, F + 0.2],
        [x, F + 0.2 + mh]
      ]);
    for (let y = F + 0.2; y < F + 0.2 + mh; y += 0.2)
      g.push([
        [0.3, y],
        [0.3 + mw, y]
      ]);
    it.push({ t: 'segs', s: g, stroke: '#9a9a9a', w: 0.15 });
    it.push(
      rect(mw + 0.7, F + 0.2, w - mw - 1, mh, c.door, c.doorLine),
      ...xBrace(mw + 0.7, F + 0.2, w - mw - 1, mh, 0.2, c)
    );
  } else if (A.side === 'left' || A.side === 'right') gableVent(it, c, P, w, H, false);
  return it;
}

function dgarage(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.side === 'front') {
    const gw = Math.min(16, w - 3),
      gh = Math.min(7, H - F - 0.8);
    it.push(...garage(w / 2 - gw / 2, F, gw, gh, c, 'panel', true));
  } else if (A.side === 'right') {
    it.push(
      ...door(w * 0.2, F, 3, Math.min(6.8, H - F - 0.4), c, 'half'),
      ...win(w * 0.62, F + 3.2, 2.8, Math.min(3, H - F - 3.8), c, 'rect')
    );
    gableVent(it, c, P, w, H, false);
  } else if (A.side === 'left') {
    it.push(...win(w / 2 - 1.4, F + 3.2, 2.8, Math.min(3, H - F - 3.8), c, 'rect'));
    gableVent(it, c, P, w, H, false);
  }
  return it;
}

/* ---------- Industrial ---------- */

function warehouse(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  it.push(rect(0, H - 1, w, 0.7, c.accent, c.accentLine, 0.25));
  if (A.role === 'front' || A.role === 'back') {
    const n = Math.max(2, Math.floor((w - 6) / 12)),
      dw = 8,
      dh = Math.min(9, H - F - 2.2),
      y = F + 4;
    it.push(rect(0, F, w, 4, c.L ? '#ffffff' : c.concrete, c.concreteLine || c.wallLine));
    for (let i = 0; i < n; i++) {
      const x = 3 + ((w - 6) * (i + 0.5)) / n - dw / 2;
      it.push(...garage(x, y, dw, Math.min(dh, H - y - 1.6), c, 'rollup', false));
      [x - 0.9, x + dw + 0.3].forEach(bx =>
        it.push(rect(bx, y - 1.2, 0.6, 1.3, c.L ? '#ffffff' : '#1d1b19', c.trimLine, 0.2))
      );
    }
    if (A.role === 'front' && B.sign)
      it.push(...plaque(B.sign, w * 0.25, w * 0.75, H - 3.6, H - 1.3, c, '#f1ece0', '#2a2a2a'));
  } else {
    it.push(...door(w * 0.2, F, 3.2, 7, c), ...paneBand(w * 0.45, w * 0.8, F + 4, F + 6.4, c, 3));
  }
  return it;
}

function mill(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  for (let s = 0; s < B.stories; s++) {
    const fl = F + s * B.storyH,
      wh = Math.min(6.5, B.storyH - 3.4),
      iv = s === 0 && A.side === 'front' ? freeIntervals(w, [[w / 2 - 5, w / 2 + 5]]) : [[0, w]];
    winRow(it, c, iv, fl + 2.4, 3, wh, 5.2, 'segment', 1.6);
    if (s > 0) it.push(rect(0, fl - 0.3, w, 0.4, c.L ? '#ffffff' : shade(c.wall, -0.2), c.wallLine, 0.2));
  }
  if (A.side === 'front') {
    const dw = 7,
      dh = Math.min(9, B.storyH - 1);
    it.push(rect(w / 2 - dw / 2 - 0.4, F, dw + 0.8, dh + 0.4, c.trim, c.trimLine));
    it.push(
      rect(w / 2 - dw / 2, F, dw / 2, dh, c.door, c.doorLine, 0.35),
      ...xBrace(w / 2 - dw / 2, F, dw / 2, dh, 0.4, c)
    );
    it.push(rect(w / 2, F, dw / 2, dh, c.door, c.doorLine, 0.35), ...xBrace(w / 2, F, dw / 2, dh, 0.4, c));
  }
  if (isGable(A, P, H)) {
    gableVent(it, c, P, w, H, true);
    if (A.side === 'left' && B.sign)
      it.push(...plaque(B.sign, w * 0.2, w * 0.8, H - 2.6, H - 0.7, c, '#f1ece0', '#2a2a2a'));
  }
  if (A.side === 'front' && B.sign && !isGable(A, P, H))
    it.push(...plaque(B.sign, w * 0.2, w * 0.8, H - 2.4, H - 0.6, c, '#f1ece0', '#2a2a2a'));
  return it;
}

function quonset(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    it = [],
    bb = bbox(P);
  if (A.side === 'front') {
    const dw = Math.min(12, w * 0.45),
      dh = Math.min(10, bb.y1 * 0.62);
    it.push(...garage(w / 2 - dw / 2, F, dw, dh - F, c, 'rollup', false));
    [w * 0.16, w * 0.84].forEach(x => {
      const y = F + 3.2,
        hh = Math.min(3, topAt(P, x) - y - 0.8);
      if (hh > 1.2) it.push(...win(x - 1.4, y, 2.8, hh, c, 'rect'));
    });
    if (B.sign && dh + 2.4 < bb.y1 - 1)
      it.push(...plaque(B.sign, w / 2 - 6, w / 2 + 6, dh + 0.6, dh + 2.4, c, '#f1ece0', '#2a2a2a'));
  } else if (A.side === 'back') it.push(...door(w / 2 - 1.6, F, 3.2, 7, c));
  return it;
}

function machineShop(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  it.push(rect(0, F, w, 3, c.L ? '#ffffff' : shade(c.wall, -0.18), c.wallLine, 0.25));
  if (A.side === 'front') {
    const gw = Math.min(12, (w - 10) / 2),
      gh = Math.min(12, H - F - 1.5);
    [w * 0.05, w * 0.05 + gw + 1.5].forEach(x => it.push(...garage(x, F, gw, gh, c, 'panel', true)));
    const ox = w * 0.05 + 2 * gw + 4;
    if (ox + 3.4 < w - 1) {
      it.push(...glassDoor(ox, F, 3.2, 7.2, c));
      if (ox + 5 < w - 1.5) it.push(...paneBand(ox + 4.4, w - 1.5, F + 3.2, F + 6.6, c, 3));
    }
  } else if (A.side === 'back') winRow(it, c, [[0, w]], F + 5, 4, 2.6, 7, 'rect');
  else {
    winRow(it, c, [[0, w]], F + 5, 4, 2.6, 8, 'rect');
    if (isGable(A, P, H) && B.sign && A.side === 'right')
      it.push(...plaque(B.sign, w * 0.15, w * 0.85, H + 0.6, H + 2.6, c, c.accent, '#ffffff'));
  }
  return it;
}

function elevator(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  /* a few small windows up the headhouse, a door and loading spout at the bottom */
  for (let y = F + 12; y < H - 4; y += 12) it.push(...win(w / 2 - 1, y, 2, 2.6, c, 'rect'));
  if (A.side === 'front') it.push(...garage(w / 2 - 4, F, 8, 9, c, 'rollup', false));
  if (A.side === 'left' && B.sign) {
    const ch = B.sign.replace(/ /g, '').split(''),
      step = Math.min(4.2, (H - F - 14) / ch.length),
      size = Math.min(step * 0.82, w * 0.5);
    ch.forEach((k, i) =>
      it.push(
        txt(k, w / 2, H - 4 - step * (i + 0.8), {
          sizeFt: size,
          anchor: 'middle',
          bold: true,
          fill: c.L ? '#222222' : c.accent
        })
      )
    );
  }
  gableVent(it, c, P, w, H, false);
  return it;
}

function lumber(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  if (A.side === 'front') {
    const dw = Math.min(14, w * 0.4),
      dh = Math.min(10, H - F - 1.2);
    it.push(rect(w * 0.08 - 0.5, F + dh, dw * 2 + 1, 0.4, c.L ? '#ffffff' : '#34363a', c.trimLine, 0.25));
    [w * 0.08, w * 0.08 + dw / 2].forEach(x =>
      it.push(rect(x, F, dw / 2, dh, c.door, c.doorLine, 0.35), ...xBrace(x, F, dw / 2, dh, 0.4, c))
    );
    it.push(...door(w * 0.7, F, 3.2, 7, c), ...win(w * 0.82, F + 3.4, 3, 3, c, 'rect'));
    if (B.sign) it.push(...plaque(B.sign, w * 0.15, w * 0.85, H - 2.8, H - 0.8, c, '#f1ece0', '#2a2a2a'));
  } else if (A.side === 'back') winRow(it, c, [[0, w]], F + 4, 3, 3, 8, 'rect');
  else {
    it.push(...win(w / 2 - 1.5, F + 4, 3, 3, c, 'rect'));
    gableVent(it, c, P, w, H, false);
  }
  return it;
}

function brewery(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  const wh = Math.min(7, H - F - 4);
  if (A.side === 'front') {
    const dw = 5.6;
    it.push(
      poly(archPoly(w / 2 - dw / 2 - 0.4, F, dw + 0.8, 9.4), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
      poly(archPoly(w / 2 - dw / 2, F, dw, 9), { fill: c.door, stroke: c.doorLine, w: 0.35 })
    );
    it.push(
      pl(
        [
          [w / 2, F],
          [w / 2, F + 6.2]
        ],
        { stroke: c.doorLine, w: 0.35 }
      )
    );
    winRow(it, c, freeIntervals(w, [[w / 2 - 5, w / 2 + 5]]), F + 2.6, 3.2, wh, 5.4, 'arched', 1.6);
    if (B.sign) it.push(...plaque(B.sign, w * 0.18, w * 0.82, H - 2.8, H - 0.8, c, c.accent, '#f4ead2'));
  } else {
    winRow(it, c, [[0, w]], F + 2.6, 3.2, wh, 6, 'arched', 1.6);
    if (isGable(A, P, H)) gableVent(it, c, P, w, H, true);
  }
  return it;
}

function depot(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return base;
  if (A.side === 'front' || A.side === 'back') {
    const n = Math.max(2, Math.floor(w / 12)),
      dw = 7,
      dh = Math.min(8.5, H - F - 1.4);
    it.push(rect(0, F + dh + 0.3, w, 0.4, c.L ? '#ffffff' : '#34363a', c.trimLine, 0.25));
    for (let i = 0; i < n; i++) {
      const x = (w * (i + 0.5)) / n - dw / 2;
      it.push(rect(x, F, dw, dh, c.door, c.doorLine, 0.35), ...xBrace(x, F, dw, dh, 0.4, c));
    }
  } else {
    it.push(
      ...door(w / 2 - 1.6, F, 3.2, 7, c),
      ...win(w * 0.15, F + 3.4, 2.6, 3.2, c, 'rect'),
      ...win(w * 0.85 - 2.6, F + 3.4, 2.6, 3.2, c, 'rect')
    );
    if (A.side === 'right' && isGable(A, P, H) && B.sign)
      it.push(...plaque(B.sign, w * 0.15, w * 0.85, H + 0.5, H + 2.4, c, '#f1ece0', '#2a2a2a'));
  }
  return it;
}

/* ---------- Farm ---------- */

function dairy(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found;
  if (A.side !== 'front' && A.side !== 'back') return base;
  const it = base.slice(),
    iv = A.side === 'front' ? freeIntervals(w, [[w / 2 - 9, w / 2 + 9]]) : [[0, w]];
  spread(iv, 2, 4.5, 2.2).forEach(x =>
    it.push(...win(x - 1.1, F + 4.6, 2.2, 1.8, c, 'rect', { panes: 'grid' }))
  );
  return it;
}

function stable(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H;
  if (A.side !== 'front' && A.side !== 'back') return base;
  const it = [],
    n = Math.max(2, Math.floor((w - 2) / 6)),
    dw = 3.8,
    dh = Math.min(7.6, H - F - 1);
  for (let i = 0; i < n; i++) {
    const x = 1 + ((w - 2) * (i + 0.5)) / n - dw / 2;
    it.push(rect(x - 0.3, F, dw + 0.6, dh + 0.3, c.trim, c.trimLine));
    it.push(rect(x, F, dw, dh * 0.5, c.door, c.doorLine, 0.35), ...xBrace(x, F, dw, dh * 0.5, 0.3, c));
    it.push(
      rect(x, F + dh * 0.5, dw, dh * 0.5, c.door, c.doorLine, 0.35),
      ...xBrace(x, F + dh * 0.5, dw, dh * 0.5, 0.3, c)
    );
    if (A.side === 'front' && !c.L)
      it.push(rect(x + 0.4, F + dh + 0.6, dw - 0.8, 0.7, '#f4efe2', c.trimLine, 0.2));
  }
  return it;
}

function crib(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  /* gaps between the slats, so the corn can breathe */
  const ls = [];
  for (let y = F + 0.5; y < H - 0.4; y += 0.5)
    ls.push([
      [0.5, y],
      [w - 0.5, y]
    ]);
  it.push({ t: 'segs', s: ls, stroke: c.L ? '#9a9a9a' : '#2a2219', w: 0.18 });
  [0, w - 0.5].forEach(x => it.push(rect(x, F, 0.5, H - F, c.trim, c.trimLine, 0.25)));
  if (isGable(A, P, H) && A.side === 'right')
    it.push(rect(w / 2 - 1.2, H - 0.2, 2.4, Math.min(2.4, bbox(P).y1 - H - 0.8), c.door, c.doorLine));
  if (A.side === 'front')
    it.push(
      rect(w / 2 - 1.4, F, 2.8, Math.min(6, H - F - 0.5), c.door, c.doorLine, 0.35),
      ...xBrace(w / 2 - 1.4, F, 2.8, Math.min(6, H - F - 0.5), 0.3, c)
    );
  return it;
}

/* ---------- Castles ---------- */

function gatehouse(f, w, P, base) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found;
  if (A.side !== 'front') return base;
  const it = base.slice(),
    gw = Math.min(10, w * 0.32),
    gx = w / 2 - gw / 2;
  /* portcullis teeth and a row of machicolation corbels */
  for (let x = gx + gw / 8; x < gx + gw - 0.1; x += gw / 4)
    it.push(
      poly(
        [
          [x - 0.3, F + 0.9],
          [x + 0.3, F + 0.9],
          [x, F]
        ],
        { fill: c.L ? '#ffffff' : '#34363a', stroke: c.doorLine, w: 0.2 }
      )
    );
  for (let x = 1; x < w - 1; x += 2)
    it.push(
      poly(
        [
          [x, B.H - 0.2],
          [x + 1.2, B.H - 0.2],
          [x + 0.9, B.H - 1.4],
          [x + 0.3, B.H - 1.4]
        ],
        { fill: c.L ? '#ffffff' : shade(c.wall, -0.18), stroke: c.wallLine, w: 0.2 }
      )
    );
  return it;
}

function ruin(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    it = [];
  /* slits only where the wall still stands; a broken doorway in front */
  spread([[0, w]], 2.5, 7, 1).forEach(x => {
    const top = topAt(P, x);
    if (top > F + 9) slit(it, x - 0.3, F + 4.5, 0.6, 3.4, c);
  });
  if (A.side === 'front') {
    const gw = Math.min(6, w * 0.3);
    it.push(
      poly(archPoly(w / 2 - gw / 2, F, gw, Math.min(8, topAt(P, w / 2) - F - 1)), {
        fill: dark(c),
        stroke: c.wallLine,
        w: 0.3
      })
    );
  }
  return it;
}

function curtain(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    it = [];
  if (A.side === 'front')
    spread([[0, w]], 2.5, 6, 1).forEach(x => slit(it, x - 0.3, F + B.H * 0.45, 0.6, 3.4, c));
  else if (A.side === 'back')
    it.push(poly(archPoly(w * 0.2, F, 3.4, 7), { fill: c.door, stroke: c.doorLine, w: 0.35 }));
  return it;
}

function manor(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  if (A.role === 'party') return it;
  for (let s = 0; s < B.stories; s++) {
    const fl = F + s * B.storyH,
      wh = Math.min(5, B.storyH - 4),
      iv = s === 0 && A.side === 'front' ? freeIntervals(w, [[w / 2 - 4, w / 2 + 4]]) : [[0, w]];
    spread(iv, 2, 6, 2.8).forEach(x => {
      it.push(...win(x - 1.4, fl + 3, 2.8, wh, c, 'rect', { panes: 'leaded' }));
      it.push(
        rect(x - 1.8, fl + 3 + wh + 0.3, 3.6, 0.5, c.L ? '#ffffff' : shade(c.wall, -0.18), c.wallLine, 0.25)
      );
    });
  }
  if (A.side === 'front') {
    it.push(
      poly(archPoly(w / 2 - 2.2, F, 4.4, 8.4), {
        fill: c.L ? '#ffffff' : shade(c.wall, -0.2),
        stroke: c.wallLine,
        w: 0.3
      })
    );
    it.push(poly(archPoly(w / 2 - 1.7, F, 3.4, 7.8), { fill: c.door, stroke: c.doorLine, w: 0.35 }));
    if (!c.L)
      it.push(
        poly(
          [
            [w / 2 - 1.2, H - 0.8],
            [w / 2 + 1.2, H - 0.8],
            [w / 2 + 1.2, H - 3.4],
            [w / 2, H - 4.2],
            [w / 2 - 1.2, H - 3.4]
          ],
          { fill: c.accent, stroke: c.accentLine, w: 0.3 }
        )
      );
  }
  if (isGable(A, P, H)) gableVent(it, c, P, w, H, true);
  return it;
}

function motteKeep(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    F = B.found,
    H = B.H,
    it = [];
  for (let s = 0; s < B.stories; s++) {
    const fl = F + s * B.storyH;
    spread([[0, w]], 2, 6, 1).forEach(x => slit(it, x - 0.3, fl + B.storyH * 0.35, 0.6, 3, c));
  }
  if (A.side === 'front') it.push(...door(w / 2 - 1.6, F, 3.2, Math.min(7, B.storyH - 1), c, 'plank'));
  if (isGable(A, P, H)) gableVent(it, c, P, w, H, false);
  return it;
}

export const VARIANT_ART = {
  barber,
  bank,
  burger,
  icecream,
  mart,
  coffee,
  deco,
  clinic,
  parkgarage: parkGarage,
  opera,
  rink,
  drivein: snackBar,
  school,
  hospital,
  shed,
  leanto,
  outhouse,
  playhouse,
  poolhouse,
  hutch,
  dgarage,
  warehouse,
  mill,
  quonset,
  shop: machineShop,
  elevator,
  lumber,
  brewery,
  depot,
  dairy,
  stable,
  crib,
  gatehouse,
  ruin,
  curtain,
  manor,
  motte: motteKeep
};
