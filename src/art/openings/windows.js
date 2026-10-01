/* Window shapes and pane patterns. */
import { poly } from '../../lib/draw.js';
import {
  archPoly,
  barP,
  bbox,
  circ,
  clipAll,
  clipConvex,
  ellP,
  lancetPoly,
  rectP
} from '../../lib/geometry.js';

export function shapeP(st, x, y, w, h) {
  const cx = x + w / 2,
    cy = y + h / 2;
  switch (st) {
    case 'gothic':
      return lancetPoly(x, y, w, h);
    case 'arched':
      return archPoly(x, y, w, h);
    case 'segment': {
      const r = Math.min(h * 0.4, w * 0.2);
      return [[x, y], [x + w, y], ...ellP(cx, y + h - r, w / 2, r, 0, Math.PI, 12)];
    }
    case 'half':
      return [[x, y], ...ellP(cx, y, w / 2, h, 0, Math.PI, 18).slice(0, -1)];
    case 'round':
      return circ(cx, cy, Math.min(w, h) / 2, 24);
    case 'oval':
      return ellP(cx, cy, w / 2, h / 2, 0, Math.PI * 2, 24).slice(0, -1);
    case 'octagon': {
      const k = Math.min(w, h) * 0.29;
      return [
        [x + k, y],
        [x + w - k, y],
        [x + w, y + k],
        [x + w, y + h - k],
        [x + w - k, y + h],
        [x + k, y + h],
        [x, y + h - k],
        [x, y + k]
      ];
    }
    case 'diamond':
      return [
        [cx, y],
        [x + w, cy],
        [cx, y + h],
        [x, cy]
      ];
    case 'triangle':
      return [
        [x, y],
        [x + w, y],
        [cx, y + h]
      ];
    default:
      return rectP(x, y, w, h);
  }
}

export const SQUARE_SHAPES = { rect: 1, segment: 1, arched: 1, gothic: 1 };

export function muntins(ws, pan, gp, c) {
  const bb = bbox(gp),
    x0 = bb.x0,
    x1 = bb.x1,
    y0 = bb.y0,
    y1 = bb.y1,
    w = x1 - x0,
    h = y1 - y0,
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2,
    E = 0.05,
    bars = [],
    it = [];
  let m = 0.11;
  const V = x =>
      bars.push([
        [x, y0 - E],
        [x, y1 + E]
      ]),
    H = y =>
      bars.push([
        [x0 - E, y],
        [x1 + E, y]
      ]);
  const arc = ws === 'arched' || ws === 'gothic' || ws === 'segment',
    spring =
      ws === 'arched'
        ? y1 - w / 2
        : ws === 'gothic'
          ? y1 - w * 0.866
          : ws === 'segment'
            ? y1 - Math.min(h * 0.4, w * 0.2)
            : null;
  const centred = ws === 'round' || ws === 'oval' || ws === 'octagon' || ws === 'diamond';
  switch (pan) {
    case 'none':
      break;
    case 'dh':
      H(arc ? Math.min(spring, y0 + h * 0.5) : y0 + h * 0.5);
      m = 0.17;
      break;
    case 'grid': {
      const cols = Math.max(2, Math.round(w / 0.95)),
        rows = Math.max(2, Math.round(h / 1.05));
      for (let i = 1; i < cols; i++) V(x0 + (w * i) / cols);
      for (let j = 1; j < rows; j++) H(y0 + (h * j) / rows);
      m = 0.09;
      break;
    }
    case 'prairie': {
      const k = Math.min(0.45, w * 0.17, h * 0.14);
      V(x0 + k);
      V(x1 - k);
      H(y1 - k);
      H(y0 + k);
      m = 0.08;
      break;
    }
    case 'leaded': {
      const s = Math.max(0.4, Math.min(w, h) / 5),
        ls = [];
      for (let d = -h; d < w + s; d += s) {
        ls.push(
          [
            [x0 + d, y0],
            [x0 + d + h, y1]
          ],
          [
            [x0 + d + h, y0],
            [x0 + d, y1]
          ]
        );
      }
      const s2 = clipAll(ls, gp);
      if (s2.length) it.push({ t: 'segs', s: s2, stroke: c.L ? c.windowLine : '#1d2429', w: 0.3 });
      break;
    }
    case 'radial': {
      const full = centred,
        ox = cx,
        oy = full ? cy : spring !== null ? spring : y0,
        n = full ? 8 : 6,
        R = Math.max(w, h) * 1.3;
      if (spring !== null) H(spring);
      for (let i = full ? 0 : 1; i < n; i++) {
        const a = ((full ? Math.PI * 2 : Math.PI) * i) / n;
        bars.push([
          [ox, oy],
          [ox + Math.cos(a) * R, oy + Math.sin(a) * R]
        ]);
      }
      m = 0.08;
      const hub = clipConvex(circ(ox, oy, Math.min(w, h) * 0.14, 16), gp);
      if (hub.length >= 3) bars.hub = hub;
      break;
    }
    default:
      V(cx);
      if (ws !== 'triangle') H(arc ? y0 + h * 0.42 : cy);
      else H(y0 + h * 0.35);
  }
  bars.forEach(([p, q]) => {
    const r = clipConvex(barP(p, q, m), gp);
    if (r.length >= 3) it.push(poly(r, { fill: c.window, stroke: c.L ? c.windowLine : null, w: 0.2 }));
  });
  if (bars.hub) it.push(poly(bars.hub, { fill: c.window, stroke: c.L ? c.windowLine : null, w: 0.2 }));
  return it;
}
