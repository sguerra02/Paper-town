/* Artwork for the loose parts of catalog variants (art kind 'special'): posts, boards, cupolas, the
   drive-in screen, the motte's grass, the windmill's lattice, wheel and tail. */
import { CUT } from '../config/constants.js';
import { pl, poly, txt } from '../lib/draw.js';
import { bbox, circ, clipAll, rectP } from '../lib/geometry.js';
import { shade } from '../lib/math.js';

export function specialArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1 - bb.x0,
    h = bb.y1 - bb.y0,
    it = [];
  /* garage door parts start with their bare outline (no ink), which the print layout needs first */
  if (/^g[A-Z]/.test(A.sub)) it.push(poly(P));
  switch (A.sub) {
    case 'plank': {
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#8a6a48', stroke: c.L ? '#222222' : '#4a3a2a', w: 0.25 }));
      const g = [];
      for (let x = bb.x0 + w / 3; x < bb.x1 - 0.05; x += w / 3)
        g.push([
          [x, bb.y0],
          [x, bb.y1]
        ]);
      it.push({ t: 'segs', s: g, stroke: c.L ? '#9a9a9a' : '#6b5238', w: 0.15 });
      return it;
    }
    case 'steel':
      return [poly(P, { fill: c.L ? '#ffffff' : '#9aa0a4', stroke: c.L ? '#222222' : '#5f6467', w: 0.25 })];
    case 'boards': {
      it.push(poly(P, { fill: c.wall, stroke: c.wallLine, w: 0.3 }));
      const g = [];
      const vert = h >= w * 0.3;
      if (vert)
        for (let x = bb.x0 + 0.8; x < bb.x1; x += 0.8)
          g.push([
            [x, bb.y0],
            [x, bb.y1]
          ]);
      else
        for (let y = bb.y0 + 0.6; y < bb.y1; y += 0.6)
          g.push([
            [bb.x0, y],
            [bb.x1, y]
          ]);
      it.push({ t: 'segs', s: clipAll(g, P), stroke: c.wallLine, w: 0.22 });
      return it;
    }
    case 'cupola': {
      it.push(poly(P, { fill: c.wall, stroke: c.wallLine, w: 0.3 }));
      const top = bb.y1,
        lw = Math.min(w * 0.55, 2.4),
        lh = Math.min(2.8, h * 0.32),
        ly = top - lh - 0.6,
        cx = bb.x0 + w / 2;
      it.push(poly(rectP(bb.x0, top - 0.5, w, 0.5), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
      if (A.clock) {
        const r = Math.min(lw * 0.45, 1.3),
          cy = ly + lh / 2;
        it.push(
          poly(circ(cx, cy, r + 0.2, 20), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
          poly(circ(cx, cy, r, 20), { fill: c.L ? '#ffffff' : '#f7f3e6', stroke: '#222222', w: 0.3 }),
          pl(
            [
              [cx, cy],
              [cx, cy + r * 0.7]
            ],
            { stroke: '#222222', w: 0.35 }
          ),
          pl(
            [
              [cx, cy],
              [cx + r * 0.5, cy - r * 0.2]
            ],
            { stroke: '#222222', w: 0.35 }
          )
        );
      } else {
        it.push(
          poly(rectP(cx - lw / 2, ly, lw, lh), {
            fill: c.L ? '#ffffff' : '#2a2522',
            stroke: c.trimLine,
            w: 0.3
          })
        );
        const ls = [];
        for (let y = ly + 0.35; y < ly + lh - 0.1; y += 0.4)
          ls.push([
            [cx - lw / 2, y],
            [cx + lw / 2, y]
          ]);
        it.push({ t: 'segs', s: ls, stroke: c.L ? '#9a9a9a' : c.trim, w: 0.3 });
      }
      return it;
    }
    case 'screen': {
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#3a3f44', stroke: '#222222', w: 0.3 }));
      it.push(
        poly(rectP(bb.x0 + 1.2, bb.y0 + 1.2, w - 2.4, h - 2.4), {
          fill: '#ffffff',
          stroke: c.L ? '#222222' : '#9aa0a4',
          w: 0.3
        })
      );
      return it;
    }
    case 'mound': {
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#6f8f4a', stroke: c.L ? '#9a9a9a' : '#4f6b33', w: 0.3 }));
      if (!c.L) {
        const g = [];
        for (let k = 0; k < Math.max(8, (w * h) / 14); k++) {
          const x = bb.x0 + (((k * 37 + 11) % 97) / 97) * w,
            y = bb.y0 + (((k * 61 + 7) % 89) / 89) * h;
          g.push(
            [
              [x, y],
              [x - 0.25, y + 0.6]
            ],
            [
              [x, y],
              [x + 0.25, y + 0.6]
            ]
          );
        }
        it.push({ t: 'segs', s: clipAll(g, P), stroke: '#4f6b33', w: 0.2 });
      }
      return it;
    }
    case 'lattice': {
      /* legs along the slanted sides, cross braces between them */
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#e6e3dc', stroke: c.L ? '#9a9a9a' : '#b9b5aa', w: 0.2 }));
      const st = { stroke: c.L ? '#222222' : '#5f6467', w: 0.45 };
      const n = P.length,
        segs = [];
      for (let i = 0; i < n; i++) segs.push([P[i], P[(i + 1) % n]]);
      it.push({ t: 'segs', s: segs, stroke: st.stroke, w: 0.6 });
      /* the left and right edges at height y */
      const at = y => {
        const xs = [];
        for (let i = 0; i < n; i++) {
          const a = P[i],
            b = P[(i + 1) % n];
          if ((a[1] - y) * (b[1] - y) <= 0 && Math.abs(b[1] - a[1]) > 1e-9)
            xs.push(a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
        }
        return [Math.min(...xs), Math.max(...xs)];
      };
      const k = 5,
        br = [];
      for (let i = 0; i < k; i++) {
        const y0 = bb.y0 + (h * i) / k + 0.05,
          y1 = bb.y0 + (h * (i + 1)) / k - 0.05,
          [a0, b0] = at(y0),
          [a1, b1] = at(y1);
        br.push(
          [
            [a0, y0],
            [b1, y1]
          ],
          [
            [b0, y0],
            [a1, y1]
          ],
          [
            [a1, y1],
            [b1, y1]
          ]
        );
      }
      it.push({ t: 'segs', s: br, stroke: st.stroke, w: 0.3 });
      return it;
    }
    case 'wheel': {
      const cx = bb.x0 + w / 2,
        cy = bb.y0 + h / 2,
        R = w / 2;
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#d8d5ce', stroke: '#222222', w: 0.3 }));
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a0 = (i * 2 * Math.PI) / n + 0.04,
          a1 = ((i + 0.62) * 2 * Math.PI) / n;
        it.push(
          poly(
            [
              [cx + R * 0.25 * Math.cos(a0), cy + R * 0.25 * Math.sin(a0)],
              [cx + R * 0.95 * Math.cos(a0), cy + R * 0.95 * Math.sin(a0)],
              [cx + R * 0.95 * Math.cos(a1), cy + R * 0.95 * Math.sin(a1)],
              [cx + R * 0.25 * Math.cos(a1), cy + R * 0.25 * Math.sin(a1)]
            ],
            {
              fill: c.L ? '#ffffff' : i % 2 ? c.accent : shade(c.accent, 0.2),
              stroke: c.L ? '#222222' : c.accentLine,
              w: 0.2
            }
          )
        );
      }
      it.push(
        poly(circ(cx, cy, R * 0.18, 12), { fill: c.L ? '#ffffff' : '#5f6467', stroke: '#222222', w: 0.25 })
      );
      return it;
    }
    /* working garage door parts: the door strip, the roller, tracks, brackets, inside floor and wall */
    case 'gStrip': {
      /* the bottom of the strip is the door; the top part (above) is wound on the roller, so no ink */
      const dh = h - A.above;
      it.push(
        poly(rectP(bb.x0, bb.y0, w, dh), { fill: c.L ? '#ffffff' : c.door, stroke: c.doorLine, w: 0.3 })
      );
      const ls = [];
      for (let y = bb.y0 + 0.35; y < bb.y0 + dh - 0.05; y += 0.35)
        ls.push([
          [bb.x0, y],
          [bb.x1, y]
        ]);
      it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.2 });
      it.push(
        poly(rectP(bb.x0, bb.y0, w, 0.4), {
          fill: c.L ? '#ffffff' : shade(c.door, -0.25),
          stroke: c.doorLine,
          w: 0.25
        })
      );
      it.push(note('Glue this end to the roller', bb.x0 + w / 2, bb.y1 - A.above / 2, w));
      it.push(
        pl(
          [
            [bb.x0, bb.y1 - A.above],
            [bb.x1, bb.y1 - A.above]
          ],
          { stroke: '#9a9a9a', w: 0.3, dash: [1.2, 1.2] }
        )
      );
      return it;
    }
    case 'gRoller':
      it.push(note('Roll tightly into a tube and glue the end down', bb.x0 + w / 2, bb.y0 + h * 0.55, w));
      it.push(
        pl(
          [
            [bb.x0, bb.y1 - 0.8],
            [bb.x1, bb.y1 - 0.8]
          ],
          { stroke: '#9a9a9a', w: 0.3, dash: [1.2, 1.2] }
        )
      );
      it.push(note('glue', bb.x0 + w / 2, bb.y1 - 0.55, w));
      return it;
    case 'gGlue':
      it.push(note('glue', bb.x0 + w / 2, bb.y0 + h / 2, h, true));
      return it;
    case 'gPlain':
      return it;
    case 'gHole': {
      const r = Math.min(w, h) * 0.32;
      it.push(
        pl(
          [...circ(bb.x0 + w / 2, bb.y0 + h * 0.55, r, 20), circ(bb.x0 + w / 2, bb.y0 + h * 0.55, r, 20)[0]],
          CUT
        )
      );
      return it;
    }
    case 'gFloor':
      it.push(
        poly(P, { fill: c.L ? '#ffffff' : c.concrete || '#d9d6cf', stroke: c.L ? '#9a9a9a' : null, w: 0.2 })
      );
      it.push(note('Inside floor: glue on the base inside the walls', bb.x0 + w / 2, bb.y0 + h / 2, w));
      return it;
    case 'gLiner':
      it.push(
        poly(P, { fill: c.L ? '#ffffff' : shade(c.wall, 0.15), stroke: c.L ? '#9a9a9a' : null, w: 0.2 })
      );
      it.push(
        note('Inside wall: glue to the inside of the wall facing the door', bb.x0 + w / 2, bb.y0 + h / 2, w)
      );
      return it;
    case 'vane':
      it.push(poly(P, { fill: c.L ? '#ffffff' : c.accent, stroke: c.L ? '#222222' : c.accentLine, w: 0.3 }));
      return it;
  }
  return [poly(P, { fill: '#ffffff', stroke: '#222222', w: 0.25 })];
}

/* a small gray assembly note that fits its part (sideways along a tall, narrow part) */
function note(s, x, y, w, vertical) {
  const size = Math.max(0.25, Math.min(0.7, (w * 0.9) / (s.length * 0.55)));
  return txt(s, x, y - size * 0.35, {
    sizeFt: size,
    anchor: 'middle',
    fill: '#8a8a8a',
    ang: vertical ? 90 : 0
  });
}
