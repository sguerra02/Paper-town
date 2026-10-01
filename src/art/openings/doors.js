/* Door styles, garage door parts and the hardware drawn on them. */
import { paneFx } from './effects.js';
import { muntins } from './windows.js';
import { poly } from '../../lib/draw.js';
import {
  archPoly,
  barP,
  bbox,
  circ,
  clipAll,
  clipConvex,
  clipConvexSafe,
  rectP
} from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

export function glassDoor(x, y, w, h, c) {
  return [
    poly(rectP(x, y, w, h), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
    poly(rectP(x + 0.35, y + 0.9, w - 0.7, h - 1.3), { fill: c.glass, stroke: c.glassLine, w: 0.25 }),
    poly(rectP(x + 0.3, y + h * 0.45, w - 0.6, 0.12), {
      fill: c.L ? '#ffffff' : '#c9ced0',
      stroke: c.doorLine,
      w: 0.2
    })
  ];
}

export function board(p, q, th, c) {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    l = Math.hypot(dx, dy) || 1,
    n = [((-dy / l) * th) / 2, ((dx / l) * th) / 2];
  return poly(
    [
      [p[0] + n[0], p[1] + n[1]],
      [q[0] + n[0], q[1] + n[1]],
      [q[0] - n[0], q[1] - n[1]],
      [p[0] - n[0], p[1] - n[1]]
    ],
    { fill: c.L ? '#ffffff' : '#6b5a45', stroke: c.L ? '#222222' : '#3b3026', w: 0.25 }
  );
}

export function xBrace(x, y, w, h, t, c) {
  const f = { fill: c.trim, stroke: c.trimLine, w: 0.25 };
  return [
    poly(rectP(x, y, w, t), f),
    poly(rectP(x, y + h - t, w, t), f),
    poly(rectP(x, y, t, h), f),
    poly(rectP(x + w - t, y, t, h), f),
    Object.assign(board([x + t, y + t], [x + w - t, y + h - t], t, c), f),
    Object.assign(board([x + w - t, y + t], [x + t, y + h - t], t, c), f)
  ];
}

export function slit(it, x, y, sw, sh, c) {
  it.push(
    poly(rectP(x - 0.4, y - 0.4, sw + 0.8, sh + 0.8), {
      fill: c.L ? '#ffffff' : shade(c.wall, -0.14),
      stroke: c.wallLine,
      w: 0.25
    }),
    poly(rectP(x, y, sw, sh), { fill: c.L ? '#ffffff' : '#1b1b1d', stroke: c.L ? '#222222' : null, w: 0.25 })
  );
}

export const DOOR_GLASS = { half: 1, full: 1, craftsman: 1, dutch: 1, arched: 1 };

export function hasGlass(o) {
  const t = o.type;
  if (t === 'win' || t === 'round' || t === 'sliding') return true;
  if (t === 'door') return !!DOOR_GLASS[o.doorStyle];
  if (t === 'double') return (o.doorStyle || 'glass') !== 'panel';
  if (t === 'garage') return !!o.gwin || o.gstyle === 'glass';
  return false;
}

export function knob(it, x, y, c) {
  it.push(poly(circ(x, y, 0.11), { fill: c.L ? '#ffffff' : '#c9a646', stroke: c.doorLine, w: 0.2 }));
}

export function stoop(it, o, c, t) {
  if (o.y > 0.3)
    it.push(
      poly(rectP(o.x - t - 0.4, o.y - 0.35, o.w + 2 * t + 0.8, 0.35), {
        fill: c.found,
        stroke: c.foundLine,
        w: 0.3
      })
    );
}

export function strap(it, x0, x1, y, c) {
  it.push(
    poly(rectP(x0, y - 0.09, x1 - x0, 0.18), {
      fill: c.L ? '#ffffff' : '#2a2a2a',
      stroke: c.L ? '#222222' : null,
      w: 0.2
    }),
    poly(circ(x1, y, 0.13, 10), { fill: c.L ? '#ffffff' : '#2a2a2a', stroke: c.L ? '#222222' : null, w: 0.2 })
  );
}

export function planks(it, P, x0, x1, y0, y1, c, step) {
  const ls = [];
  for (let x = x0 + step; x < x1 - 0.05; x += step)
    ls.push([
      [x, y0],
      [x, y1]
    ]);
  const s = clipAll(ls, P);
  if (s.length) it.push({ t: 'segs', s, stroke: c.doorLine, w: 0.25 });
}

export function drawDoor(o, c, fx, it) {
  const { x, y, w, h } = o,
    st = o.doorStyle || 'panel',
    t = 0.3,
    cx = x + w / 2,
    pan = (px, py, pw, ph) => it.push(poly(rectP(px, py, pw, ph), { stroke: c.doorLine, w: 0.3 }));
  const leaf = st === 'arched' ? archPoly(x, y, w, h) : rectP(x, y, w, h);
  it.push(
    poly(st === 'arched' ? archPoly(x - t, y, w + 2 * t, h + t) : rectP(x - t, y, w + 2 * t, h + t), {
      fill: c.trim,
      stroke: c.trimLine,
      w: 0.35
    }),
    poly(leaf, { fill: c.door, stroke: c.doorLine, w: 0.35 })
  );
  const glass = (gp, pn, ws) => {
    paneFx(gp, c, fx, x + y + gp[0][0], it, true);
    if (pn) it.push(...muntins(ws || 'rect', pn, gp, c));
  };
  switch (st) {
    case 'six':
      [
        [0.1, 0.76, 0.16],
        [0.1, 0.42, 0.28],
        [0.1, 0.08, 0.28]
      ].forEach(([fxp, fy, fh]) => {
        pan(x + w * fxp, y + h * fy, w * 0.34, h * fh);
        pan(x + w * 0.56, y + h * fy, w * 0.34, h * fh);
      });
      knob(it, x + w * 0.86, y + h * 0.47, c);
      break;
    case 'half':
      glass(rectP(x + 0.32, y + h * 0.52, w - 0.64, h * 0.48 - 0.35), 'cross');
      pan(x + w * 0.1, y + h * 0.08, w * 0.34, h * 0.36);
      pan(x + w * 0.56, y + h * 0.08, w * 0.34, h * 0.36);
      knob(it, x + w * 0.86, y + h * 0.47, c);
      break;
    case 'full':
      glass(rectP(x + 0.34, y + 0.5, w - 0.68, h - 0.85), null);
      it.push(
        poly(rectP(x + w - 0.3, y + h * 0.38, 0.1, h * 0.2), {
          fill: c.L ? '#ffffff' : '#c9c9c9',
          stroke: c.doorLine,
          w: 0.2
        })
      );
      break;
    case 'craftsman': {
      const gy = y + h * 0.72,
        gp = rectP(x + 0.3, gy, w - 0.6, h - 0.3 - (gy - y));
      glass(gp, null);
      const b = bbox(gp);
      [1, 2].forEach(k => {
        const bx = b.x0 + ((b.x1 - b.x0) * k) / 3;
        it.push(
          poly(rectP(bx - 0.06, b.y0, 0.12, b.y1 - b.y0), {
            fill: c.door,
            stroke: c.L ? c.doorLine : null,
            w: 0.2
          })
        );
      });
      it.push(
        poly(rectP(x + 0.12, y + h * 0.66, w - 0.24, 0.2), { fill: c.trim, stroke: c.trimLine, w: 0.25 })
      );
      const ls = [];
      for (let dx = x + 0.25; dx < x + w - 0.2; dx += 0.25)
        ls.push([
          [dx, y + h * 0.66],
          [dx, y + h * 0.66 - 0.12]
        ]);
      it.push({ t: 'segs', s: ls, stroke: c.trimLine, w: 0.2 });
      pan(x + w * 0.1, y + 0.35, w * 0.36, h * 0.58);
      pan(x + w * 0.54, y + 0.35, w * 0.36, h * 0.58);
      knob(it, x + w * 0.86, y + h * 0.47, c);
      break;
    }
    case 'dutch':
      glass(rectP(x + 0.32, y + h * 0.58, w - 0.64, h * 0.42 - 0.35), 'cross');
      it.push(
        poly(rectP(x - 0.1, y + h * 0.5 - 0.1, w + 0.2, 0.2), { fill: c.trim, stroke: c.trimLine, w: 0.25 }),
        {
          t: 'segs',
          s: [
            [
              [x, y + h * 0.5 + 0.1],
              [x + w, y + h * 0.5 + 0.1]
            ]
          ],
          stroke: c.doorLine,
          w: 0.3
        }
      );
      pan(x + w * 0.14, y + h * 0.08, w * 0.72, h * 0.34);
      knob(it, x + w * 0.86, y + h * 0.44, c);
      break;
    case 'plank':
      planks(it, leaf, x, x + w, y, y + h, c, Math.max(0.4, w / 6));
      strap(it, x, x + w * 0.6, y + h * 0.2, c);
      strap(it, x, x + w * 0.6, y + h * 0.8, c);
      it.push(
        poly(circ(x + w * 0.84, y + h * 0.47, 0.16, 12), { stroke: c.L ? '#222222' : '#2a2a2a', w: 0.4 })
      );
      break;
    case 'arched': {
      planks(it, leaf, x, x + w, y, y + h, c, Math.max(0.4, w / 6));
      const r = Math.min(w * 0.17, 0.8),
        gy = y + h - w / 2 - r * 0.3;
      const gp = circ(cx, gy, r, 16);
      glass(gp, 'cross', 'round');
      it.push(poly(circ(cx, gy, r + 0.1, 16), { stroke: c.trimLine, w: 0.35 }));
      const hl = clipConvex(rectP(x, y + h * 0.2 - 0.09, w * 0.6, 0.18), leaf);
      if (hl.length >= 3) strap(it, x, x + w * 0.6, y + h * 0.2, c);
      strap(it, x, x + w * 0.6, Math.min(y + h * 0.7, y + h - w / 2), c);
      knob(it, x + w * 0.85, y + h * 0.45, c);
      break;
    }
    case 'barn': {
      const f = { fill: c.L ? '#ffffff' : shade(c.door, -0.14), stroke: c.doorLine, w: 0.25 },
        b = Math.min(0.45, w * 0.12);
      planks(it, leaf, x, x + w, y, y + h, c, Math.max(0.4, w / 6));
      it.push(
        poly(rectP(x, y, w, b), f),
        poly(rectP(x, y + h - b, w, b), f),
        poly(rectP(x, y, b, h), f),
        poly(rectP(x + w - b, y, b, h), f),
        poly(rectP(x, y + h / 2 - b / 2, w, b), f)
      );
      [
        [y + b, y + h / 2 - b / 2],
        [y + h / 2 + b / 2, y + h - b]
      ].forEach(([a, z]) => {
        it.push(
          poly(clipConvexSafe(barP([x + b, a], [x + w - b, z], b), rectP(x + b, a, w - 2 * b, z - a)), f)
        );
      });
      break;
    }
    default:
      [
        [0.1, 0.56],
        [0.56, 0.56],
        [0.1, 0.14],
        [0.56, 0.14]
      ].forEach(([fxp, fy]) => pan(x + w * fxp, y + h * fy, w * 0.34, h * 0.3));
      knob(it, x + w * 0.86, y + h * 0.47, c);
  }
  stoop(it, o, c, t);
}
