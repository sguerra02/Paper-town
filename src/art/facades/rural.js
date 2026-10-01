/* Barns and industrial buildings. */
import { signText } from './venues.js';
import { glassDoor, xBrace } from '../openings/doors.js';
import { paneBand } from '../openings/effects.js';
import { drawOpening } from '../openings/index.js';
import { poly } from '../../lib/draw.js';
import { bbox, freeIntervals, rectP, spread } from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

export function barnArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H,
    bb = bbox(P);
  if (A.side === 'left' || A.side === 'right') {
    const dw = Math.min(12, w * 0.46),
      dh = Math.min(11, H - F - 1.2),
      dx = w / 2 - dw / 2;
    it.push(
      poly(rectP(dx - dw * 0.3, F + dh + 0.15, dw * 1.6, 0.35), {
        fill: c.L ? '#ffffff' : '#34363a',
        stroke: c.trimLine,
        w: 0.25
      })
    );
    [dx, dx + dw / 2].forEach(x => {
      it.push(
        poly(rectP(x, F, dw / 2, dh), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
        ...xBrace(x, F, dw / 2, dh, 0.45, c)
      );
    });
    const gh = bb.y1 - H;
    if (gh > 5) {
      const hw = Math.min(5, w * 0.2),
        hh = Math.min(5, gh * 0.42),
        hy = H + Math.max(0.8, gh * 0.12);
      it.push(
        poly(rectP(w / 2 - hw / 2, hy, hw, hh), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
        ...xBrace(w / 2 - hw / 2, hy, hw, hh, 0.32, c)
      );
      it.push(
        poly(rectP(w / 2 - 0.25, hy + hh + 0.4, 0.5, Math.min(1.6, bb.y1 - (hy + hh) - 1)), {
          fill: c.L ? '#ffffff' : '#4a3a2a',
          stroke: c.trimLine,
          w: 0.2
        })
      );
    }
  } else {
    if (A.side === 'front') {
      const dw = Math.min(10, w * 0.3),
        dh = Math.min(10, H - F - 1.2),
        dx = w / 2 - dw / 2;
      it.push(
        poly(rectP(dx - dw * 0.25, F + dh + 0.15, dw * 1.5, 0.35), {
          fill: c.L ? '#ffffff' : '#34363a',
          stroke: c.trimLine,
          w: 0.25
        }),
        poly(rectP(dx, F, dw, dh), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
        ...xBrace(dx, F, dw, dh, 0.45, c)
      );
      spread(freeIntervals(w, [[dx - 3, dx + dw + 3]]), 2, 10, 2.6).forEach(x =>
        it.push(...drawOpening({ type: 'win', x: x - 1.3, y: F + 5, w: 2.6, h: 2.6 }, c, null))
      );
    } else
      spread([[0, w]], 2, 10, 2.6).forEach(x =>
        it.push(...drawOpening({ type: 'win', x: x - 1.3, y: F + 5, w: 2.6, h: 2.6 }, c, null))
      );
  }
  return it;
}

export function industrialArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H;
  if (A.role === 'party') return it;
  if (B.indKind === 'storage') {
    if (A.role === 'front' || A.role === 'back') {
      const n = Math.max(1, Math.floor((w - 2) / 10));
      for (let i = 0; i < n; i++) {
        const x = 1 + ((w - 2) * (i + 0.5)) / n - 4;
        it.push(
          poly(rectP(x - 0.25, F, 8.5, Math.min(7.8, H - F - 0.8)), {
            fill: c.trim,
            stroke: c.trimLine,
            w: 0.3
          }),
          poly(rectP(x, F, 8, Math.min(7.5, H - F - 1.1)), { fill: c.door, stroke: c.doorLine, w: 0.3 })
        );
        const ls = [];
        for (let y = F + 0.5; y < F + Math.min(7.5, H - F - 1.1); y += 0.5)
          ls.push([
            [x, y],
            [x + 8, y]
          ]);
        it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.2 });
      }
    } else if (A.role === 'right') {
      it.push(
        poly(rectP(1.5, F + Math.max(3, H - F - 6), w - 3, Math.min(4, H - F - 3.5)), {
          fill: c.accent,
          stroke: c.accentLine,
          w: 0.35
        }),
        ...signText(
          B.sign,
          1.5,
          w - 1.5,
          F + Math.max(3, H - F - 6),
          F + Math.max(3, H - F - 6) + Math.min(4, H - F - 3.5),
          c,
          c.L ? '#222222' : '#ffffff'
        )
      );
    } else
      it.push(...glassDoor(w * 0.25, F, 3.4, 7.2, c), ...paneBand(w * 0.45, w * 0.8, F + 3, F + 7, c, 3));
    return it;
  }
  // factory
  const bays = Math.max(1, Math.round(w / 14));
  if (A.side === 'front' || A.side === 'back') {
    for (let i = 0; i < bays; i++) {
      const cx = (w * (i + 0.5)) / bays,
        ww = Math.min(9, w / bays - 3),
        y0 = F + 3,
        y1 = Math.min(H - 2, F + 13);
      it.push(
        poly(rectP(cx - ww / 2 - 0.4, y0 - 0.4, ww + 0.8, y1 - y0 + 0.8), {
          fill: c.L ? '#ffffff' : shade(c.wall, -0.15),
          stroke: c.wallLine,
          w: 0.25
        }),
        poly(rectP(cx - ww / 2, y0, ww, y1 - y0), { fill: c.window, stroke: c.windowLine, w: 0.3 })
      );
      const cols = Math.max(3, Math.round(ww / 1.3)),
        rows = Math.max(4, Math.round((y1 - y0) / 1.3));
      for (let r = 0; r < rows; r++)
        for (let k = 0; k < cols; k++)
          it.push(
            poly(
              rectP(
                cx - ww / 2 + (k * ww) / cols + 0.08,
                y0 + (r * (y1 - y0)) / rows + 0.08,
                ww / cols - 0.16,
                (y1 - y0) / rows - 0.16
              ),
              { fill: (r * 7 + k * 3 + i) % 11 === 0 && !c.L ? '#4f6a74' : c.glass }
            )
          );
      it.push(
        poly(rectP(cx - ww / 2 - 0.6, y1 + 0.3, ww + 1.2, 0.6), {
          fill: c.L ? '#ffffff' : shade(c.wall, -0.2),
          stroke: c.wallLine,
          w: 0.25
        })
      );
    }
    if (A.side === 'front')
      it.push(
        poly(rectP(w * 0.1, H - 1.9, w * 0.8, 1.6), {
          fill: c.L ? '#ffffff' : '#f1ece0',
          stroke: c.wallLine,
          w: 0.3
        }),
        ...signText(B.sign, w * 0.1, w * 0.9, H - 1.9, H - 0.3, c, c.L ? '#222222' : '#2a2a2a')
      );
  } else {
    const dw = Math.min(12, w * 0.4),
      dh = Math.min(12, H - F - 2);
    it.push(
      poly(rectP(w / 2 - dw / 2 - 0.4, F, dw + 0.8, dh + 0.4), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
      poly(rectP(w / 2 - dw / 2, F, dw, dh), { fill: c.door, stroke: c.doorLine, w: 0.35 })
    );
    const ls = [];
    for (let y = F + 0.6; y < F + dh; y += 0.6)
      ls.push([
        [w / 2 - dw / 2, y],
        [w / 2 + dw / 2, y]
      ]);
    it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.2 });
    it.push(...drawOpening({ type: 'door', x: w * 0.12, y: F, w: 3.2, h: 7 }, c, null));
  }
  return it;
}
