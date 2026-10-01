/* Entertainment venues and the sign lettering shared by commercial facades. */
import { glassDoor } from '../openings/doors.js';
import { paneBand } from '../openings/effects.js';
import { drawOpening } from '../openings/index.js';
import { pl, poly, txt } from '../../lib/draw.js';
import { archPoly, circ, rectP, spread } from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

export function signText(s, x0, x1, y0, y1, c, fill) {
  if (!s) return [];
  const bh = y1 - y0,
    wAvail = x1 - x0 - 1;
  const size = Math.min(bh * 0.62, wAvail / (Math.max(1, s.length) * 0.66));
  return [
    txt(s, (x0 + x1) / 2, y0 + bh / 2 - size * 0.36, {
      sizeFt: size,
      anchor: 'middle',
      bold: true,
      fill: fill || c.accentText
    })
  ];
}

export function bulbs(it, x0, y0, x1, y1, step, c) {
  if (c.L) return;
  const r = Math.min(0.13, step * 0.3);
  for (let x = x0; x <= x1 + 1e-6; x += step) {
    it.push(poly(circ(x, y0, r, 6), { fill: '#fff3b0' }), poly(circ(x, y1, r, 6), { fill: '#fff3b0' }));
  }
  for (let y = y0 + step; y < y1 - 1e-6; y += step) {
    it.push(poly(circ(x0, y, r, 6), { fill: '#fff3b0' }), poly(circ(x1, y, r, 6), { fill: '#fff3b0' }));
  }
}

export function neon(s, x0, x1, y0, y1, col, c) {
  if (!s) return [];
  const t = signText(s, x0, x1, y0, y1, c, c.L ? '#222222' : col)[0];
  if (c.L) return [t];
  const glow = Object.assign({}, t, {
    fill: shade(col, 0.55) + '66',
    sizeFt: t.sizeFt * 1.04,
    x: t.x,
    y: t.y - t.sizeFt * 0.02
  });
  return [glow, t];
}

export function stackText(s, x, y0, y1, c, fill) {
  const ch = s.replace(/ /g, '').split('');
  if (!ch.length) return [];
  const step = (y1 - y0) / ch.length,
    size = Math.min(step * 0.8, 1.8);
  return ch.map((k, i) =>
    txt(k, x, y1 - step * (i + 0.75), { sizeFt: size, anchor: 'middle', bold: true, fill })
  );
}

export function venueArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H,
    K = B.venueKind;
  if (A.role === 'party') return it;
  const front = A.role === 'front';
  if (K === 'theater') {
    if (front) {
      const ew = Math.min(w * 0.55, 20),
        ex = w / 2 - ew / 2;
      it.push(poly(rectP(ex - 0.4, F, ew + 0.8, 9.4), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
      const n = Math.max(2, Math.round(ew / 3.4));
      for (let i = 0; i < n; i++) it.push(...glassDoor(ex + (i * ew) / n + 0.1, F, ew / n - 0.2, 8.6, c));
      [
        [1.2, ex - 1.2],
        [ex + ew + 1.2, w - 1.2]
      ].forEach(([a, b]) => {
        if (b - a < 3) return;
        const k = Math.max(1, Math.floor((b - a) / 4.2));
        for (let i = 0; i < k; i++) {
          const px = a + ((b - a) * (i + 0.5)) / k - 1.6;
          it.push(
            poly(rectP(px, F + 1.6, 3.2, 5), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
            poly(rectP(px + 0.3, F + 1.9, 2.6, 4.4), {
              fill: c.L ? '#ffffff' : ['#b3282d', '#2a4a7a', '#d8a531', '#2f6b4f'][i % 4],
              stroke: c.trimLine,
              w: 0.2
            })
          );
        }
      });
      const ribs = [];
      for (let x = 1; x < w - 0.5; x += 1.6)
        ribs.push(
          poly(rectP(x, F + 15, 0.5, H - F - 16), {
            fill: c.L ? '#ffffff' : shade(c.wall, -0.12),
            stroke: c.wallLine,
            w: 0.2
          })
        );
      it.push(...ribs);
      it.push(poly(rectP(0, H - 0.4, w, B.Hf - H + 0.4), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
    } else if (A.role === 'left' || A.role === 'right')
      it.push(
        ...drawOpening({ type: 'door', x: w * 0.2, y: F, w: 3.4, h: 7 }, c, null),
        ...drawOpening({ type: 'door', x: w * 0.7, y: F, w: 3.4, h: 7 }, c, null)
      );
  } else if (K === 'casino') {
    const band = B.Hf - H;
    if (front) {
      it.push(
        poly(rectP(0, H - 1, w, band + 1), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
        ...signText(B.sign, 0, w, H - 0.6, B.Hf - 0.3, c, c.L ? '#222222' : '#f7d774')
      );
      bulbs(it, 0.6, H - 0.6, w - 0.6, B.Hf - 0.4, 1.2, c);
      const ew = Math.min(w * 0.5, 24),
        ex = w / 2 - ew / 2;
      it.push(
        poly(archPoly(ex - 1, F, ew + 2, Math.min(H - F - 3, 14)), {
          fill: c.L ? '#ffffff' : '#c9a646',
          stroke: c.trimLine,
          w: 0.3
        }),
        ...paneBand(ex, ex + ew, F, Math.min(H - F - 5, 11) + F, c, 3.2)
      );
      for (let s = 1; s < B.stories; s++) {
        const fl = F + s * B.storyH;
        it.push(...paneBand(1, w - 1, fl + 2, fl + B.storyH - 1.5, c, 4));
      }
    } else {
      for (let s = 0; s < B.stories; s++) {
        const fl = F + s * B.storyH;
        it.push(...paneBand(2, w - 2, fl + 3, fl + B.storyH - 2, c, 5));
      }
      it.push(poly(rectP(0, H - 1, w, 1), { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
    }
  } else if (K === 'bowling') {
    it.push(poly(rectP(0, F + 9.5, w, 1), { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
    if (front) {
      const ew = Math.min(16, w * 0.45),
        ex = w * 0.35 - ew / 2;
      it.push(...paneBand(ex, ex + ew, F + 0.3, F + 8.6, c, 4), ...glassDoor(ex + ew / 2 - 2, F, 4, 8.3, c));
      const px = w * 0.78,
        py = F + 2,
        ph = Math.min(B.Hf - py - 1, 22),
        pw = ph * 0.28;
      const pin = [];
      for (let i = 0; i <= 24; i++) {
        const tt = i / 24,
          y = py + ph * tt;
        const r =
          (pw / 2) *
          (0.62 +
            0.38 * Math.sin(Math.PI * Math.min(1, tt * 1.4)) -
            (tt > 0.55 ? 0.45 * Math.sin(((Math.PI * (tt - 0.55)) / 0.45) * 0.5) : 0) * (tt < 0.8 ? 1 : 0.6));
        pin.push([px + Math.max(0.3, r), y]);
      }
      const pinPoly = [
        ...pin,
        ...pin
          .slice()
          .reverse()
          .map(([x, y]) => [2 * px - x, y])
      ];
      it.push(
        poly(pinPoly, { fill: '#ffffff', stroke: '#222222', w: 0.4 }),
        poly(rectP(px - pw * 0.36, py + ph * 0.66, pw * 0.72, ph * 0.035), {
          fill: c.L ? '#ffffff' : '#c8282d'
        }),
        poly(rectP(px - pw * 0.34, py + ph * 0.72, pw * 0.68, ph * 0.035), {
          fill: c.L ? '#ffffff' : '#c8282d'
        })
      );
      it.push(
        ...signText(B.sign, 1, w * 0.62, F + 12, Math.min(B.Hf - 0.8, F + 19), c, c.L ? '#222222' : c.accent)
      );
      if (!c.L && B.Hf > F + 17) {
        const cx = w * 0.08 + 2.5,
          cy = Math.min(B.Hf - 3.5, F + 15.5),
          rs = [];
        for (let a = 0; a < 16; a++) {
          const t = (a / 16) * Math.PI * 2;
          rs.push([
            [cx + Math.cos(t) * 0.6, cy + Math.sin(t) * 0.6],
            [cx + Math.cos(t) * (a % 2 ? 1.4 : 2.6), cy + Math.sin(t) * (a % 2 ? 1.4 : 2.6)]
          ]);
        }
        it.push({ t: 'segs', s: rs, stroke: '#f7d774', w: 1 });
      }
    } else if (A.role !== 'back')
      spread([[0, w]], 3, 12, 4).forEach(x =>
        it.push(...paneBand(x - 2, x + 2, F + 10.8, Math.min(F + 13, H - 1), c, 4))
      );
  } else if (K === 'gym') {
    if (front) {
      const gt = Math.min(F + 12, H - 3);
      it.push(
        ...paneBand(0.5, w - 0.5, F + 0.2, gt, c, 5),
        ...glassDoor(w * 0.2 - 2, F, 4, Math.min(8.5, gt - F), c)
      );
      it.push(
        poly(rectP(0, gt + 0.3, w, H - gt - 0.3 + (B.Hf - H)), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        ...signText(
          B.sign,
          1,
          w - 1,
          gt + 0.8,
          Math.min(B.Hf - 0.4, gt + 5.5),
          c,
          c.L ? '#222222' : c.accent
        ),
        poly(rectP(0, gt, w, 0.3), { fill: c.accent })
      );
    } else if (A.role !== 'back')
      it.push(
        ...paneBand(2, w - 2, Math.min(F + 10, H - 5), H - 2, c, 5),
        poly(rectP(0, F + 3, w, 0.4), { fill: c.accent })
      );
    else it.push(...drawOpening({ type: 'door', x: w * 0.2, y: F, w: 3.2, h: 7 }, c, null));
  } else {
    // modern bar
    if (front) {
      const dw = Math.min(10, (w - 8) / 2),
        y1 = Math.min(F + 10, H - 3);
      [w * 0.3, w * 0.7].forEach(xc => {
        it.push(
          poly(rectP(xc - dw / 2 - 0.3, F, dw + 0.6, y1 - F + 0.3), {
            fill: c.window,
            stroke: c.windowLine,
            w: 0.3
          })
        );
        for (let r = 0; r < 4; r++)
          for (let k = 0; k < 3; k++)
            it.push(
              poly(
                rectP(
                  xc - dw / 2 + (k * dw) / 3 + 0.15,
                  F + (r * (y1 - F)) / 4 + 0.15,
                  dw / 3 - 0.3,
                  (y1 - F) / 4 - 0.3
                ),
                { fill: c.glass, stroke: c.glassLine, w: 0.2 }
              )
            );
      });
      it.push(...glassDoor(w / 2 - 1.8, F, 3.6, Math.min(8, y1 - F), c));
      it.push(...neon(B.sign, 1, w - 1, y1 + 0.6, Math.min(H + 1.5, y1 + 4.4), c.accent, c));
      if (!c.L) {
        const pts = [];
        for (let i = 0; i <= 30; i++) {
          const x = 0.5 + ((w - 1) * i) / 30,
            y = y1 + 0.3 - 0.5 * Math.sin(Math.PI * ((i % 10) / 10));
          pts.push([x, y]);
        }
        it.push(pl(pts, { stroke: '#333333', w: 0.25 }));
        pts.forEach((p, i) => {
          if (i % 2) it.push(poly(circ(p[0], p[1] - 0.18, 0.12, 6), { fill: '#ffe08a' }));
        });
      }
    } else if (A.role !== 'back')
      spread([[0, w]], 3, 9, 3).forEach(x => it.push(...paneBand(x - 1.5, x + 1.5, F + 4, F + 8, c, 3)));
    else it.push(...drawOpening({ type: 'door', x: w * 0.2, y: F, w: 3.2, h: 7 }, c, null));
  }
  return it;
}
