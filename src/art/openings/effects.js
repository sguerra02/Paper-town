/* Glass effects: lit, boarded up and broken, per opening or building-wide. */
import { board } from './doors.js';
import { S } from '../../config/state.js';
import { poly } from '../../lib/draw.js';
import { bbox, clipAll, clipConvex, rectP } from '../../lib/geometry.js';
import { clamp, hash01 } from '../../lib/math.js';

export function fxFor(x, y, w, ov) {
  if (ov) return ov.lit || ov.board || ov.broken ? ov : null;
  if (S.type === 'scenery') return null;
  const on = [];
  if (S.lit) on.push('lit');
  if (S.boarded) on.push('board');
  if (S.broken) on.push('broken');
  if (!on.length) return null;
  const h = hash01(x, y, w),
    share = on.length === 1 ? 0.55 : 0.8;
  if (h >= share) return null;
  const k = on[Math.min(on.length - 1, Math.floor((h / share) * on.length))],
    r = { [k]: true };
  if (k === 'board' && S.broken && hash01(y, x, w + 1) < 0.4) r.broken = true;
  if (k === 'broken' && S.lit && hash01(y + 1, x, w) < 0.3) r.lit = true;
  return r;
}

export const LIT = '#e9b949';

export function glassFill(gp, c, fx) {
  return poly(gp, { fill: fx && fx.lit && !c.L ? LIT : c.glass, stroke: c.glassLine, w: 0.25 });
}

export function glareP(gp) {
  const b = bbox(gp),
    w = b.x1 - b.x0,
    h = b.y1 - b.y0;
  return poly(
    [
      [b.x0 + w * 0.08, b.y1 - h * 0.06],
      [b.x0 + w * 0.36, b.y1 - h * 0.06],
      [b.x0 + w * 0.08, b.y1 - h * 0.36]
    ],
    { fill: '#ffffff22' }
  );
}

export function crackArt(gp, c, fx, seed) {
  const bb = bbox(gp),
    w = bb.x1 - bb.x0,
    h = bb.y1 - bb.y0,
    rnd = k => hash01(seed * 0.731 + k * 1.7, seed * 0.37 + k * 0.9, k + 2.3);
  const cx = bb.x0 + w * (0.3 + rnd(1) * 0.4),
    cy = bb.y0 + h * (0.35 + rnd(2) * 0.35),
    R = Math.min(w, h) * 0.26;
  const hole = [],
    n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(i + 3) * 0.45,
      rr = R * (i % 2 ? 0.3 + rnd(i + 20) * 0.3 : 0.75 + rnd(i + 40) * 0.55);
    hole.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const it = [],
    hp = clipConvex(hole, gp);
  if (hp.length >= 3)
    it.push(
      poly(hp, {
        fill: c.L ? '#ffffff' : fx.lit ? '#fbe6a8' : '#0b0e10',
        stroke: c.L ? '#222222' : '#070909',
        w: 0.3
      })
    );
  const raw = [],
    L = Math.max(w, h) * 1.4,
    sp = 7;
  for (let i = 0; i < sp; i++) {
    const a = (i / sp) * Math.PI * 2 + rnd(i + 60) * 0.7,
      px = cx + Math.cos(a) * R * 0.8,
      py = cy + Math.sin(a) * R * 0.8,
      a2 = a + (rnd(i + 80) - 0.5) * 0.5,
      mx = px + Math.cos(a2) * L * 0.25,
      my = py + Math.sin(a2) * L * 0.25,
      a3 = a2 + (rnd(i + 90) - 0.5) * 0.6;
    raw.push(
      [
        [px, py],
        [mx, my]
      ],
      [
        [mx, my],
        [mx + Math.cos(a3) * L * 0.5, my + Math.sin(a3) * L * 0.5]
      ]
    );
  }
  for (let i = 0; i < sp; i++) {
    const a = (i / sp) * Math.PI * 2 + rnd(i + 60) * 0.7,
      b = ((i + 1) / sp) * Math.PI * 2 + rnd(i + 61) * 0.7,
      r2 = R * (1.55 + rnd(i + 70) * 0.3);
    raw.push([
      [cx + Math.cos(a) * r2, cy + Math.sin(a) * r2],
      [cx + Math.cos(b) * r2, cy + Math.sin(b) * r2]
    ]);
  }
  const s = clipAll(raw, gp);
  if (s.length) it.push({ t: 'segs', s, stroke: c.L ? '#222222' : fx.lit ? '#7a5a14' : '#d9e3e6', w: 0.3 });
  return it;
}

export function paneFx(gp, c, fx, seed, it, glare) {
  it.push(glassFill(gp, c, fx));
  if (fx && fx.broken) it.push(...crackArt(gp, c, fx, seed));
  if (glare && !c.L && !fx) it.push(glareP(gp));
}

export function boardsOver(x, y, w, h, c) {
  const th = clamp(Math.min(w, h) * 0.14, 0.2, 0.5),
    o = 0.25;
  const out = [
    board([x - o, y + h * 0.22], [x + w + o, y + h * 0.62], th, c),
    board([x - o, y + h * 0.78], [x + w + o, y + h * 0.4], th, c)
  ];
  if (h > w * 1.5)
    out.push(
      board([x - o, y + h * 0.1], [x + w + o, y + h * 0.3], th, c),
      board([x - o, y + h * 0.92], [x + w + o, y + h * 0.75], th, c)
    );
  return out;
}

/* glass cells share one effect override; a broken override cracks one cell (chosen by position) */
export function glassCells(cells, c, ov, it, glare) {
  const on = fxFor(0, 0, 0, ov);
  let bi = -1;
  if (on && on.broken) bi = Math.floor(hash01(cells.length, bbox(cells[0]).x0, 3.1) * cells.length);
  return cells.map((gp, i) => {
    const b = bbox(gp);
    const fx = ov
      ? on
        ? Object.assign({}, on, { broken: i === bi })
        : null
      : fxFor(b.x0, b.y0, b.x1 - b.x0, null);
    const f2 = fx && (fx.lit || fx.board || fx.broken) ? fx : null;
    paneFx(gp, c, f2, i * 3.3 + b.x0, it, glare);
    return f2;
  });
}

export function paneBand(x0, x1, y0, y1, c, step) {
  const it = [poly(rectP(x0, y0, x1 - x0, y1 - y0), { fill: c.window, stroke: c.windowLine, w: 0.35 })];
  const g = 0.2;
  const n = Math.max(1, Math.round((x1 - x0) / step)),
    pw = (x1 - x0) / n,
    cells = [];
  for (let i = 0; i < n; i++) cells.push(rectP(x0 + i * pw + g, y0 + g, pw - 2 * g, y1 - y0 - 2 * g));
  const fx = glassCells(cells, c, null, it, true);
  for (let i = 0; i < n; i++)
    if (fx[i] && fx[i].board) {
      const px = x0 + i * pw,
        h = y1 - y0,
        th = Math.min(0.5, h * 0.1);
      it.push(
        board([px, y0 + h * 0.25], [px + pw, y0 + h * 0.6], th, c),
        board([px, y0 + h * 0.75], [px + pw, y0 + h * 0.4], th, c)
      );
    }
  return it;
}
