/* Civic buildings and backyard structures. */
import { signText } from './venues.js';
import { board, glassDoor, xBrace } from '../openings/doors.js';
import { drawOpening } from '../openings/index.js';
import { pl, poly } from '../../lib/draw.js';
import { archPoly, bbox, circ, clipAll, clipConvex, rectP, spread } from '../../lib/geometry.js';
import { clamp } from '../../lib/math.js';

export function civicArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H,
    K = B.civKind,
    bb = bbox(P);
  if (A.role === 'party') return it;
  const band = txt0 => {
    it.push(
      poly(rectP(0, H + 0.3, w, Math.max(1.8, B.Hf - H - 0.8)), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
    );
    if (txt0)
      it.push(
        ...signText(
          txt0,
          0,
          w,
          H + 0.3,
          H + 0.3 + Math.max(1.8, B.Hf - H - 0.8),
          c,
          c.L ? '#222222' : '#2a2a2a'
        )
      );
  };
  const winRow = (y, ww, wh, sp, style, iv) =>
    spread(iv || [[0, w]], 1.6, sp, ww).forEach(x =>
      it.push(...drawOpening({ type: 'win', x: x - ww / 2, y, w: ww, h: wh }, c, { winStyle: style }))
    );
  if (K === 'fire') {
    if (A.role === 'front') {
      const n = clamp(B.bays, 1, 3),
        bw = Math.min(14, (w * 0.72) / n),
        x0 = w - 0.8 - n * bw;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * bw + 0.7,
          dw = bw - 1.4,
          dh = Math.min(12, B.storyH - 1.2);
        it.push(
          poly(rectP(x - 0.4, F, dw + 0.8, dh + 0.5), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
          poly(rectP(x, F, dw, dh), { fill: c.door, stroke: c.doorLine, w: 0.35 })
        );
        const ls = [];
        for (let k = 1; k < 5; k++)
          ls.push([
            [x, F + (dh * k) / 5],
            [x + dw, F + (dh * k) / 5]
          ]);
        it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.3 });
        for (let k = 0; k < 4; k++)
          it.push(
            poly(
              rectP(
                x + 0.3 + (k * (dw - 0.6)) / 4 + 0.1,
                F + dh * 0.6 + 0.2,
                (dw - 0.6) / 4 - 0.2,
                dh / 5 - 0.4
              ),
              { fill: c.glass, stroke: c.glassLine, w: 0.2 }
            )
          );
      }
      it.push(...drawOpening({ type: 'door', x: Math.max(1, x0 / 2 - 1.6), y: F, w: 3.2, h: 7 }, c, null));
      it.push(
        poly(rectP(x0, F + Math.min(12, B.storyH - 1.2) + 0.9, w - 0.8 - x0, 1.8), {
          fill: c.accent,
          stroke: c.accentLine,
          w: 0.3
        }),
        ...signText(
          B.sign,
          x0,
          w - 0.8,
          F + Math.min(12, B.storyH - 1.2) + 0.9,
          F + Math.min(12, B.storyH - 1.2) + 2.7,
          c,
          c.L ? '#222222' : '#ffffff'
        )
      );
      for (let s = 1; s < B.stories; s++) winRow(F + s * B.storyH + 2.6, 3, 4.4, 7, 'rect');
    } else for (let s = 0; s < B.stories; s++) winRow(F + s * B.storyH + 2.8, 3, 4.4, 8, 'arched');
    band('');
  } else if (K === 'police') {
    if (A.role === 'front') {
      const dc = w / 2;
      it.push(
        poly(rectP(dc - 4.5, F, 9, 9.8), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        ...glassDoor(dc - 3.6, F, 3.4, 8.2, c),
        ...glassDoor(dc + 0.2, F, 3.4, 8.2, c)
      );
      [dc - 6, dc + 6].forEach(x => {
        it.push(
          poly(rectP(x - 0.15, F, 0.3, 6), { fill: c.L ? '#ffffff' : '#2b2e31' }),
          poly(circ(x, F + 6.5, 0.55, 10), { fill: c.L ? '#ffffff' : '#3d7be0', stroke: '#1a2a55', w: 0.25 })
        );
      });
      winRow(F + 2.8, 3.4, 4.6, 7, 'rect', [
        [0, dc - 7],
        [dc + 7, w]
      ]);
      for (let s = 1; s < B.stories; s++) winRow(F + s * B.storyH + 2.6, 3.4, 4.6, 7, 'rect');
      band(B.sign);
    } else {
      for (let s = 0; s < B.stories; s++) winRow(F + s * B.storyH + 2.8, 3.4, 4.6, 8, 'rect');
      band('');
    }
    it.push(poly(rectP(0, F + B.storyH - 0.4, w, 0.6), { fill: c.accent, stroke: c.accentLine, w: 0.25 }));
  } else if (K === 'library' || K === 'post') {
    const dc = w / 2;
    if (A.role === 'front') {
      it.push(
        poly(archPoly(dc - 2.6, F, 5.2, Math.min(12, B.storyH + 1)), {
          fill: c.trim,
          stroke: c.trimLine,
          w: 0.3
        }),
        poly(archPoly(dc - 2, F, 4, Math.min(11, B.storyH)), { fill: c.glass, stroke: c.glassLine, w: 0.25 }),
        ...glassDoor(dc - 1.9, F, 3.8, 7.4, c)
      );
      winRow(F + 2.4, 3.4, Math.min(8, B.storyH - 3.5), 7, 'arched', [
        [0, dc - 4.5],
        [dc + 4.5, w]
      ]);
      for (let s = 1; s < B.stories; s++) winRow(F + s * B.storyH + 2.4, 3, 5, 7, 'arched');
      band(B.sign);
    } else {
      for (let s = 0; s < B.stories; s++)
        winRow(F + s * B.storyH + 2.4, 3.2, Math.min(8, B.storyH - 3.5), 8, 'arched');
      band('');
    }
  } else if (K === 'station') {
    if (A.side === 'front' || A.side === 'back') {
      const n = Math.max(2, Math.floor(w / 9));
      for (let i = 0; i < n; i++) {
        const x = (w * (i + 0.5)) / n;
        if (i % 2 === 0) it.push(...drawOpening({ type: 'door', x: x - 1.7, y: F, w: 3.4, h: 8 }, c, null));
        else
          it.push(
            ...drawOpening({ type: 'win', x: x - 1.8, y: F + 2.6, w: 3.6, h: 5.6 }, c, { winStyle: 'arched' })
          );
      }
      if (A.side === 'front') {
        const sw = Math.min(16, w * 0.4);
        it.push(
          poly(rectP(w / 2 - sw / 2, H - 3.4, sw, 2.2), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
          ...signText(
            B.sign,
            w / 2 - sw / 2,
            w / 2 + sw / 2,
            H - 3.4,
            H - 1.2,
            c,
            c.L ? '#222222' : '#ffffff'
          )
        );
      }
    } else {
      it.push(
        poly(rectP(w / 2 - 4, F, 8, 8.5), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
        ...xBrace(w / 2 - 4, F, 8, 8.5, 0.35, c)
      );
      if (bb.y1 - H > 4) {
        const cy = H + (bb.y1 - H) * 0.4,
          r = Math.min(1.6, (bb.y1 - H) * 0.25);
        it.push(
          poly(circ(w / 2, cy, r, 20), { fill: c.L ? '#ffffff' : '#f7f3e6', stroke: '#222222', w: 0.35 }),
          pl(
            [
              [w / 2, cy],
              [w / 2, cy + r * 0.7]
            ],
            { stroke: '#222222', w: 0.4 }
          ),
          pl(
            [
              [w / 2, cy],
              [w / 2 + r * 0.5, cy]
            ],
            { stroke: '#222222', w: 0.4 }
          )
        );
      }
    }
  } else if (K === 'church') {
    if (A.side === 'front' || A.side === 'back') {
      const n = Math.max(2, Math.floor((w - 4) / 8));
      for (let i = 0; i < n; i++) {
        const x = 2 + ((w - 4) * (i + 0.5)) / n;
        it.push(
          ...drawOpening({ type: 'win', x: x - 1.5, y: F + 3, w: 3, h: Math.min(10, H - F - 4.5) }, c, {
            winStyle: 'gothic'
          })
        );
      }
    } else if (A.side === 'left' && bb.y1 - H > 5) {
      const cy = H + (bb.y1 - H) * 0.35,
        r = Math.min(3.2, (bb.y1 - H) * 0.3);
      it.push(
        poly(circ(w / 2, cy, r + 0.4, 24), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        poly(circ(w / 2, cy, r, 24), { fill: c.L ? '#ffffff' : '#3a4a7a', stroke: c.glassLine, w: 0.3 })
      );
      const sp = [];
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        sp.push([
          [w / 2, cy],
          [w / 2 + Math.cos(a) * r, cy + Math.sin(a) * r]
        ]);
      }
      it.push({ t: 'segs', s: sp, stroke: c.trim, w: 0.8 });
      it.push(
        ...drawOpening({ type: 'win', x: w / 2 - 1.5, y: F + 3, w: 3, h: Math.min(9, H - F - 4) }, c, {
          winStyle: 'gothic'
        })
      );
    }
  }
  return it;
}

export function gardenArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H,
    K = B.gKind,
    bb = bbox(P);
  if (K === 'greenhouse') {
    const kw = Math.min(2.2, H * 0.3);
    const gl = clipConvex(rectP(0, kw, w, bb.y1), P);
    if (gl.length >= 3) {
      it.push(poly(gl, { fill: c.L ? '#ffffff' : '#bcd9d3', stroke: c.windowLine, w: 0.3 }));
      const raw = [];
      for (let x = 2; x < w; x += 2)
        raw.push([
          [x, kw],
          [x, bb.y1]
        ]);
      for (let y = kw + 2.2; y < bb.y1; y += 2.2)
        raw.push([
          [0, y],
          [w, y]
        ]);
      it.push({ t: 'segs', s: clipAll(raw, gl), stroke: c.window, w: 0.9 });
    }
    if (A.side === 'right') it.push(...glassDoor(w / 2 - 1.5, 0, 3, Math.min(6.8, H - 0.2), c));
  } else if (K === 'doghouse') {
    if (A.side === 'front') {
      const dw = Math.min(1.5, w * 0.4),
        dh = Math.min(1.9, (H - F) * 0.65);
      it.push(
        poly(archPoly(w / 2 - dw / 2 - 0.12, F, dw + 0.24, dh + 0.12), {
          fill: c.trim,
          stroke: c.trimLine,
          w: 0.3
        }),
        poly(archPoly(w / 2 - dw / 2, F, dw, dh), { fill: c.L ? '#ffffff' : '#1d1b19' })
      );
      const sy = Math.min(H - 0.55, F + dh + 0.2);
      if (B.sign && sy > F + dh)
        it.push(
          poly(rectP(w / 2 - 0.9, sy, 1.8, 0.45), {
            fill: c.L ? '#ffffff' : '#e9dcc0',
            stroke: c.trimLine,
            w: 0.25
          }),
          ...signText(B.sign, w / 2 - 0.9, w / 2 + 0.9, sy, sy + 0.45, c, '#2a2a2a')
        );
    }
  } else if (K === 'coop') {
    if (A.side === 'front') {
      it.push(
        ...drawOpening(
          { type: 'door', x: w * 0.12, y: F, w: Math.min(2.2, w * 0.3), h: Math.min(3.4, H - F - 0.3) },
          c,
          null
        )
      );
      const hx = w * 0.65;
      it.push(
        poly(rectP(hx - 0.5, F, 1, 1.1), { fill: c.L ? '#ffffff' : '#1d1b19' }),
        board([hx, F], [hx + 1.8, 0.05], 0.5, c)
      );
      const mw = Math.min(2.4, w * 0.3),
        my = F + Math.min(1.6, (H - F) * 0.45);
      it.push(
        poly(rectP(w - mw - 0.5, my, mw, Math.min(1.6, H - my - 0.3)), {
          fill: c.L ? '#ffffff' : '#3a3f3a',
          stroke: c.trimLine,
          w: 0.3
        })
      );
      const g = [];
      for (let x = w - mw - 0.5; x < w - 0.5; x += 0.2)
        g.push([
          [x, my],
          [x, my + Math.min(1.6, H - my - 0.3)]
        ]);
      for (let y = my; y < my + Math.min(1.6, H - my - 0.3); y += 0.2)
        g.push([
          [w - mw - 0.5, y],
          [w - 0.5, y]
        ]);
      it.push({ t: 'segs', s: g, stroke: '#9a9a9a', w: 0.2 });
    } else if (A.side === 'right' && B.sign)
      it.push(
        poly(rectP(w / 2 - 1.2, F + 1.2, 2.4, 0.8), {
          fill: c.L ? '#ffffff' : '#e9dcc0',
          stroke: c.trimLine,
          w: 0.25
        }),
        ...signText(B.sign, w / 2 - 1.2, w / 2 + 1.2, F + 1.2, F + 2, c, '#2a2a2a')
      );
    it.push(poly(rectP(0, 0, w, F), { fill: c.L ? '#ffffff' : '#3b3a36' }));
    [0.1, w - 0.5].forEach(x =>
      it.push(poly(rectP(x, 0, 0.4, F), { fill: c.trim, stroke: c.trimLine, w: 0.25 }))
    );
  }
  return it;
}
