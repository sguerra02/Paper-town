/* Artwork for trees, hedges, tents, garden beds and other scenery objects. */
import { groundArt } from './ground.js';
import { CUT } from '../../config/constants.js';
import { S } from '../../config/state.js';
import { pl, poly } from '../../lib/draw.js';
import { bbox, circ, clipAll, inPoly, insetPoly, rectP } from '../../lib/geometry.js';
import { rng, shade } from '../../lib/math.js';

export function sceneryArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    rnd = rng(f.id * 53 + 11),
    it = [];
  switch (A.kind) {
    case 'treeSil': {
      it.push(poly(P, { fill: c.leaf }));
      const R = A.R,
        cy = A.cy,
        tw = A.tw;
      it.push(poly(rectP(-tw / 2, 0, tw, cy - R * 0.6), { fill: c.trunk, stroke: c.trunkD, w: 0.25 }));
      for (let k = 0; k < Math.round(R * R * 1.3); k++) {
        const a = rnd() * Math.PI * 2,
          rr = Math.sqrt(rnd()) * R * 0.92,
          x = Math.cos(a) * rr,
          y = cy + Math.sin(a) * rr;
        const s = 0.35 + rnd() * 0.5;
        it.push(poly(circ(x, y, s, 7), { fill: rnd() < 0.5 ? c.leafD : c.leafL }));
      }
      const bs = [];
      for (let y = 0.4; y < cy - R * 0.7; y += 0.5)
        bs.push([
          [-tw / 2 + 0.1 + rnd() * 0.2, y],
          [-tw / 2 + 0.1 + rnd() * 0.2, y + 0.3]
        ]);
      it.push({ t: 'segs', s: bs, stroke: c.trunkD, w: 0.3 });
      const mid = A.H / 2;
      it.push(
        pl(
          A.slit === 'top'
            ? [
                [0, mid],
                [0, A.H + 1]
              ]
            : [
                [0, -0.01],
                [0, mid]
              ],
          CUT
        )
      );
      break;
    }
    case 'leafFlat':
      it.push(poly(P, { fill: c.leafD }));
      break;
    case 'pineSide': {
      it.push(poly(P, { fill: c.leaf }));
      const raw = [];
      for (let y = bb.y0 + 0.6; y < bb.y1; y += 0.7)
        for (let x = bb.x0; x < bb.x1; x += 0.6) {
          raw.push([
            [x, y],
            [x + 0.3, y - 0.35]
          ]);
          raw.push([
            [x + 0.3, y - 0.35],
            [x + 0.6, y]
          ]);
        }
      it.push({ t: 'segs', s: clipAll(raw, P), stroke: c.leafD, w: 0.35 });
      break;
    }
    case 'trunk':
    case 'lampPost': {
      it.push(
        poly(P, {
          fill: A.kind === 'trunk' ? c.trunk : c.L ? '#ffffff' : '#2b2e31',
          stroke: c.trunkD,
          w: 0.25
        })
      );
      break;
    }
    case 'leafBox': {
      it.push(poly(P, { fill: c.leaf }));
      const n = Math.round((bb.x1 - bb.x0) * (bb.y1 - bb.y0) * 2.2);
      for (let k = 0; k < n; k++) {
        const x = bb.x0 + rnd() * (bb.x1 - bb.x0),
          y = bb.y0 + rnd() * (bb.y1 - bb.y0);
        const q = circ(x, y, 0.18 + rnd() * 0.25, 6);
        if (q.every(pt => inPoly(pt, P))) it.push(poly(q, { fill: rnd() < 0.5 ? c.leafD : c.leafL }));
      }
      break;
    }
    case 'fence': {
      it.push(poly(P, { fill: c.white, stroke: '#bbbbbb', w: 0.2 }));
      const L = A.len,
        step = A.step,
        pw = A.pw;
      for (let x = -L / 2 + step - (step - pw); x < L / 2 - 0.01; x += step) {
        if (x + (step - pw) > L / 2) break;
        it.push(
          poly(rectP(x, 0.5, step - pw, A.solid - 0.5), {
            fill: c.L ? '#ffffff' : '#8fb07a',
            stroke: c.L ? '#9a9a9a' : null,
            w: 0.2
          })
        );
      }
      [0.8, A.solid - 0.7].forEach(y =>
        it.push(poly(rectP(-L / 2, y, L, 0.35), { fill: c.white, stroke: '#bbbbbb', w: 0.2 }))
      );
      for (let x = L / 2 - pw; x > -L / 2; x -= step)
        it.push(
          pl(
            [
              [x, 0],
              [x, A.solid]
            ],
            { stroke: '#cccccc', w: 0.2 }
          )
        );
      break;
    }
    case 'ground':
      return groundArt(f);
    case 'lantern': {
      it.push(
        poly(P, { fill: c.L ? '#ffffff' : '#2b2e31' }),
        poly(rectP(bb.x0 + 0.2, bb.y0 + 0.25, bb.x1 - bb.x0 - 0.4, bb.y1 - bb.y0 - 0.5), {
          fill: c.L ? '#ffffff' : '#ffe08a',
          stroke: c.glassLine,
          w: 0.25
        })
      );
      break;
    }
    case 'hydrant': {
      it.push(
        poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.25 }),
        poly(rectP(bb.x0, 1.9, bb.x1 - bb.x0, 0.2), { fill: c.L ? '#ffffff' : shade(S.accentColor, -0.25) })
      );
      if (A.k % 2 === 0)
        it.push(
          poly(circ((bb.x0 + bb.x1) / 2, 1.3, 0.16, 8), {
            fill: c.L ? '#ffffff' : shade(S.accentColor, -0.3),
            stroke: c.accentLine,
            w: 0.2
          })
        );
      break;
    }
    case 'hydrantCap':
      it.push(poly(P, { fill: c.L ? '#ffffff' : shade(S.accentColor, -0.2), stroke: c.accentLine, w: 0.25 }));
      break;
    case 'mailbox':
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.25 }));
      break;
    case 'mailboxEnd':
      it.push(
        poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.25 }),
        poly(rectP(bb.x0 + 0.15, bb.y0 + 0.15, bb.x1 - bb.x0 - 0.3, bb.y1 - bb.y0 - 0.3), {
          stroke: c.accentLine,
          w: 0.25
        })
      );
      break;
    case 'carBody': {
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
      const w = bb.x1 - bb.x0,
        h = bb.y1 - bb.y0;
      if (A.role === 'side') {
        [bb.x0 + w * 0.2, bb.x0 + w * 0.8].forEach(x => {
          it.push(
            poly(
              circ(x, 0.2, 1.25, 16).map(([a, b]) => [a, Math.max(0, b)]),
              { fill: c.black, stroke: '#222222', w: 0.25 }
            ),
            poly(circ(x, 0.45, 0.55, 12), { fill: c.L ? '#ffffff' : '#9aa0a3', stroke: '#222222', w: 0.2 })
          );
        });
        it.push(
          pl(
            [
              [bb.x0 + w * 0.1, h * 0.62],
              [bb.x1 - w * 0.1, h * 0.62]
            ],
            { stroke: c.accentLine, w: 0.3 }
          )
        );
      } else if (A.role === 'nose' || A.role === 'rear') {
        const col = A.role === 'nose' ? (c.L ? '#ffffff' : '#fff6cc') : c.L ? '#ffffff' : '#c8282d';
        it.push(
          poly(rectP(bb.x0 + 0.4, h * 0.55, 1.1, 0.6), { fill: col, stroke: '#222222', w: 0.2 }),
          poly(rectP(bb.x1 - 1.5, h * 0.55, 1.1, 0.6), { fill: col, stroke: '#222222', w: 0.2 }),
          poly(rectP(bb.x0 + 0.2, 0.3, w - 0.4, 0.5), {
            fill: c.L ? '#ffffff' : '#7a7f83',
            stroke: '#222222',
            w: 0.2
          })
        );
      }
      break;
    }
    case 'carGlass': {
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
      const q = insetPoly(P, 0.28);
      it.push(poly(q, { fill: c.glass, stroke: c.glassLine, w: 0.25 }));
      break;
    }
    case 'carRoof':
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
      break;
  }
  return it;
}

export function sceneryArt2(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    rnd = rng(f.id * 29 + 5),
    it = [];
  switch (A.kind) {
    case 'lattice': {
      it.push(poly(P, { fill: c.white, stroke: '#9a9a9a', w: 0.25 }));
      const raw = [],
        h = bb.y1 - bb.y0;
      for (let x = bb.x0 - h; x < bb.x1; x += 0.45) {
        raw.push([
          [x, bb.y0],
          [x + h, bb.y1]
        ]);
        raw.push([
          [x + h, bb.y0],
          [x, bb.y1]
        ]);
      }
      it.push({ t: 'segs', s: clipAll(raw, P), stroke: '#9a9a9a', w: 0.25 });
      break;
    }
    case 'deckBoards': {
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#a88b6c' }));
      const raw = [];
      for (let y = bb.y0 + 0.35; y < bb.y1; y += 0.35)
        raw.push([
          [bb.x0, y],
          [bb.x1, y]
        ]);
      it.push({ t: 'segs', s: clipAll(raw, P), stroke: c.L ? '#9a9a9a' : '#7d6448', w: 0.25 });
      break;
    }
    case 'railing': {
      const w = bb.x1 - bb.x0;
      it.push(
        poly(rectP(bb.x0, bb.y1 - 0.35, w, 0.35), { fill: c.white, stroke: '#9a9a9a', w: 0.25 }),
        poly(rectP(bb.x0, bb.y0, w, 0.3), { fill: c.white, stroke: '#9a9a9a', w: 0.25 })
      );
      for (let x = bb.x0 + 0.3; x < bb.x1 - 0.1; x += 0.45)
        it.push(
          poly(rectP(x, bb.y0 + 0.3, 0.18, bb.y1 - bb.y0 - 0.65), {
            fill: c.white,
            stroke: '#9a9a9a',
            w: 0.2
          })
        );
      it.unshift(poly(P, { fill: c.L ? '#ffffff' : '#8fb07a', stroke: '#9a9a9a', w: 0.2 }));
      break;
    }
    case 'tent': {
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
      const raw = [];
      for (let x = bb.x0 + (bb.x1 - bb.x0) / 3; x < bb.x1 - 0.1; x += (bb.x1 - bb.x0) / 3)
        raw.push([
          [x, bb.y0],
          [x, bb.y1]
        ]);
      it.push({ t: 'segs', s: raw, stroke: c.accentLine, w: 0.3 });
      break;
    }
    case 'tentEnd': {
      it.push(poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
      if (A.door) {
        const cx = (bb.x0 + bb.x1) / 2,
          h = bb.y1 - bb.y0;
        it.push(
          poly(
            [
              [cx - h * 0.35, bb.y0],
              [cx + h * 0.35, bb.y0],
              [cx, bb.y0 + h * 0.72]
            ],
            { fill: c.L ? '#ffffff' : shade(S.accentColor, -0.45), stroke: c.accentLine, w: 0.3 }
          ),
          pl(
            [
              [cx, bb.y0],
              [cx, bb.y0 + h * 0.72]
            ],
            { stroke: c.L ? '#222222' : '#dddddd', w: 0.3 }
          )
        );
      }
      break;
    }
    case 'tentRoof':
      it.push(poly(P, { fill: A.k % 2 ? c.white : c.accent, stroke: c.accentLine, w: 0.3 }));
      break;
    case 'valance': {
      it.push(poly(P, { fill: c.white, stroke: c.accentLine, w: 0.3 }));
      const w = bb.x1 - bb.x0;
      let i = 0;
      for (let x = bb.x0; x < bb.x1; x += 1.2, i++)
        if (i % 2 === 0)
          it.push(
            poly(rectP(x, bb.y0 + 0.3, Math.min(1.2, bb.x1 - x), bb.y1 - bb.y0 - 0.3), { fill: c.accent })
          );
      break;
    }
    case 'bedSide': {
      it.push(poly(P, { fill: c.trunk, stroke: c.trunkD, w: 0.3 }));
      const raw = [];
      for (let y = bb.y0 + 0.5; y < bb.y1; y += 0.5)
        raw.push([
          [bb.x0, y],
          [bb.x1, y]
        ]);
      it.push({ t: 'segs', s: raw, stroke: c.trunkD, w: 0.25 });
      break;
    }
    case 'bedSoil': {
      it.push(poly(P, { fill: c.L ? '#ffffff' : '#5a4332' }));
      const w = bb.x1 - bb.x0,
        h = bb.y1 - bb.y0,
        rows = Math.max(1, Math.floor(w / 1.2));
      for (let r = 0; r < rows; r++) {
        const x = bb.x0 + (w * (r + 0.5)) / rows;
        for (let y = bb.y0 + 0.6; y < bb.y1 - 0.4; y += 0.9) {
          const s = 0.3 + rnd() * 0.2;
          it.push(poly(circ(x, y, s, 7), { fill: rnd() < 0.5 ? c.leaf : c.leafL, stroke: c.leafD, w: 0.2 }));
          if (rnd() < 0.25 && !c.L)
            it.push(
              poly(circ(x + 0.1, y + 0.05, 0.1, 6), {
                fill: ['#d9442a', '#e8c33a', '#b36ad6'][Math.floor(rnd() * 3)]
              })
            );
        }
      }
      break;
    }
    case 'flag': {
      const w = bb.x1 - bb.x0,
        h = bb.y1 - bb.y0,
        cols = c.L ? ['#ffffff', '#ffffff'] : ['#b22234', '#ffffff'];
      for (let k = 0; k < 7; k++)
        it.push(
          poly(rectP(bb.x0, bb.y0 + (k * h) / 7, w, h / 7), {
            fill: cols[k % 2],
            stroke: c.L ? '#9a9a9a' : null,
            w: 0.2
          })
        );
      it.push(
        poly(rectP(bb.x0, bb.y0 + (h * 3) / 7, w * 0.42, (h * 4) / 7), {
          fill: c.L ? '#ffffff' : '#3c3b6e',
          stroke: c.L ? '#222222' : null,
          w: 0.25
        })
      );
      if (!c.L)
        for (let r = 0; r < 4; r++)
          for (let k = 0; k < 5; k++)
            it.push(
              poly(
                circ(
                  bb.x0 + (w * 0.42 * (k + 0.5)) / 5,
                  bb.y0 + (h * 3) / 7 + (((h * 4) / 7) * (r + 0.5)) / 4,
                  0.1,
                  5
                ),
                { fill: '#ffffff' }
              )
            );
      break;
    }
  }
  return it;
}

export function tex(n, fn) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(fn(i));
  return out;
}
