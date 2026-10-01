/* Castle walls and towers. */
import { slit } from '../openings/doors.js';
import { drawOpening } from '../openings/index.js';
import { pl, poly } from '../../lib/draw.js';
import { archPoly, circ, freeIntervals, lancetPoly, rectP, spread } from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

export function castleArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found;
  for (let s = 0; s < B.stories; s++) {
    const fl = F + s * B.storyH;
    const top = s === B.stories - 1 && B.stories > 1;
    let iv = [[0, w]];
    let gate = null;
    if (A.side === 'front' && s === 0) {
      const gw = Math.min(10, w * 0.32),
        gh = Math.min(13, B.storyH * 1.15);
      gate = { x: w / 2 - gw / 2, w: gw, h: gh };
      iv = freeIntervals(w, [[gate.x - 2, gate.x + gw + 2]]);
    }
    if (top)
      spread(iv, 2.5, 8, 2.4).forEach(x => {
        it.push(
          poly(archPoly(x - 1.6, fl + 3, 3.2, 5.4), {
            fill: c.L ? '#ffffff' : shade(c.wall, -0.16),
            stroke: c.wallLine,
            w: 0.25
          }),
          poly(archPoly(x - 1.2, fl + 3.3, 2.4, 4.8), {
            fill: c.L ? '#ffffff' : '#1d1b19',
            stroke: c.L ? '#222222' : null,
            w: 0.25
          })
        );
      });
    else spread(iv, 2.5, 7, 1).forEach(x => slit(it, x - 0.3, fl + B.storyH * 0.32, 0.6, 3.4, c));
    if (gate) {
      it.push(
        poly(archPoly(gate.x - 1, F - 0.01, gate.w + 2, gate.h + 1), {
          fill: c.L ? '#ffffff' : shade(c.wall, -0.22),
          stroke: c.wallLine,
          w: 0.3
        }),
        poly(archPoly(gate.x, F, gate.w, gate.h), { fill: c.door, stroke: c.doorLine, w: 0.35 })
      );
      const ls = [];
      for (let y = F + 1.5; y < F + gate.h - gate.w / 2; y += 2)
        ls.push([
          [gate.x, y],
          [gate.x + gate.w, y]
        ]);
      for (let x = gate.x + gate.w / 4; x < gate.x + gate.w - 0.1; x += gate.w / 4)
        ls.push([
          [x, F],
          [x, F + gate.h - gate.w / 2]
        ]);
      it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.4 });
    }
  }
  if (A.side === 'front' && !c.L) {
    const bx = w * 0.18;
    [bx, w - bx].forEach(x => {
      if (B.stories > 1) {
        const y = F + B.storyH * 1.1;
        it.push(
          poly(
            [
              [x - 1.2, y + 5],
              [x + 1.2, y + 5],
              [x + 1.2, y + 0.8],
              [x, y],
              [x - 1.2, y + 0.8]
            ],
            { fill: c.accent, stroke: c.accentLine, w: 0.3 }
          )
        );
      }
    });
  }
  return it;
}

export function towerArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [];
  if (A.role === 'party') return it;
  if (B.style === 'castle') {
    for (let y = B.found + 6; y < B.H - 4; y += 10) slit(it, w / 2 - 0.3, y, 0.6, 3.2, c);
  } else if (B.style === 'steeple') {
    const bel = B.H - 5.5;
    if (A.door) {
      const dw = Math.min(5, w - 2.5);
      it.push(
        poly(lancetPoly(w / 2 - dw / 2 - 0.4, B.found, dw + 0.8, 9.4), {
          fill: c.trim,
          stroke: c.trimLine,
          w: 0.3
        }),
        poly(lancetPoly(w / 2 - dw / 2, B.found, dw, 9), { fill: c.door, stroke: c.doorLine, w: 0.35 }),
        pl(
          [
            [w / 2, B.found],
            [w / 2, B.found + 9 - dw * 0.866]
          ],
          { stroke: c.doorLine, w: 0.35 }
        )
      );
      it.push(
        ...drawOpening({ type: 'win', x: w / 2 - 1.2, y: B.found + 12, w: 2.4, h: 5 }, c, {
          winStyle: 'gothic'
        })
      );
    }
    const lw = Math.min(3, w - 3);
    it.push(
      poly(lancetPoly(w / 2 - lw / 2, bel, lw, 4.6), {
        fill: c.L ? '#ffffff' : '#2a2522',
        stroke: c.trimLine,
        w: 0.3
      })
    );
    const lv = [];
    for (let y = bel + 0.4; y < bel + 3.4; y += 0.45)
      lv.push([
        [w / 2 - lw / 2, y],
        [w / 2 + lw / 2, y]
      ]);
    it.push({ t: 'segs', s: lv, stroke: c.L ? '#9a9a9a' : '#6b5f55', w: 0.35 });
    it.push(poly(rectP(0, bel - 1.2, w, 0.5), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
    if (!A.door && B.H > 24) {
      const cy = bel - 4.5;
      it.push(
        poly(circ(w / 2, cy, 1.6, 20), { fill: c.L ? '#ffffff' : '#f7f3e6', stroke: '#222222', w: 0.35 }),
        pl(
          [
            [w / 2, cy],
            [w / 2, cy + 1.1]
          ],
          { stroke: '#222222', w: 0.4 }
        ),
        pl(
          [
            [w / 2, cy],
            [w / 2 + 0.8, cy + 0.3]
          ],
          { stroke: '#222222', w: 0.4 }
        )
      );
    }
  } else if (B.style === 'hose') {
    for (let y = B.found + 4; y < B.H - 3; y += 9)
      it.push(...drawOpening({ type: 'win', x: w / 2 - 1, y, w: 2, h: 3.4 }, c, null));
    it.push(poly(rectP(0, B.H - 2.2, w, 0.6), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
  } else if (B.style === 'stack') {
    const hs = [];
    [B.H - 1.5, B.H - 3, B.H * 0.5].forEach(y =>
      it.push(poly(rectP(0, y, w, 0.5), { fill: c.L ? '#ffffff' : '#3a3a3a', stroke: c.wallLine, w: 0.2 }))
    );
  } else if (B.style === 'silo') {
    if (A.idx === 0) {
      const x = w / 2 - 0.6,
        ls = [];
      it.push(
        poly(rectP(x, 0, 1.2, B.H), { fill: c.L ? '#ffffff' : '#7b8084', stroke: c.wallLine, w: 0.25 })
      );
      for (let y = 1; y < B.H; y += 1)
        ls.push([
          [x + 0.1, y],
          [x + 1.1, y]
        ]);
      it.push({ t: 'segs', s: ls, stroke: c.wallLine, w: 0.3 });
    }
    const hs = [];
    for (let y = 3; y < B.H; y += 5)
      hs.push([
        [0, y],
        [w, y]
      ]);
    it.push({ t: 'segs', s: hs, stroke: c.L ? '#9a9a9a' : '#5c6064', w: 0.45 });
  } else {
    for (let s = 0; s < B.stories; s++) {
      const fl = B.found + s * B.storyH,
        sill = fl + 2.6,
        h = Math.min(4.2, B.storyH - 3.8);
      if (w > 2.8 && sill + h < B.H - 0.8)
        it.push(...drawOpening({ type: 'win', x: w / 2 - 1.1, y: sill, w: 2.2, h }, c, { spooky: B.spooky }));
    }
  }
  return it;
}
