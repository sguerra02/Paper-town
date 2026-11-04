/* Wings for L, T and U footprints, and which side of the house they project from.
   A wing is always built as if it sticks out of the front wall, in a "wing frame".
   wingFrame() then rotates that frame about the house's centre onto the chosen side. */
import { S } from '../../config/state.js';

export const WING_SIDES = ['front', 'right', 'back', 'left'];

/* Valid "which end" choices per side, named as seen from the front of the house (front/back walls)
   or along the side wall (left/right walls). The first one is the default. */
export const WING_ENDS = {
  front: ['right', 'left'],
  back: ['right', 'left'],
  left: ['front', 'back'],
  right: ['front', 'back']
};

/* Rotation that carries the wing frame's front wall onto `side`.
   W is the length of that wall, D the depth of the house measured away from it. */
export function wingFrame(B, side) {
  const sideWall = side === 'left' || side === 'right';
  const W = sideWall ? B.D : B.W,
    D = sideWall ? B.W : B.D;
  const [c, s] = { front: [1, 0], back: [-1, 0], right: [0, 1], left: [0, -1] }[side];
  const vec = v => [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  const vecInv = v => [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  const pt =
    side === 'front'
      ? p => p.slice()
      : p => {
          const q = vec([p[0] - B.cx, p[1], p[2] - B.cz]);
          return [q[0] + B.cx, q[1], q[2] + B.cz];
        };
  return { side, W, D, vec, vecInv, pt, x0: B.cx - W / 2, zWall: B.cz + D / 2, identity: side === 'front' };
}

/* Is the wing at the low-x end of its frame? Frame left is: world left on the front wall,
   world right on the back wall, the front on the right wall and the back on the left wall. */
function atLowEnd(side, end) {
  if (side === 'front') return end === 'left';
  if (side === 'back') return end === 'right';
  if (side === 'right') return end === 'front';
  return end === 'back';
}

export function makeWings(B, foot) {
  if (!(foot === 'L' || foot === 'T' || foot === 'U')) return [];
  const side = WING_SIDES.includes(S.wingSide) ? S.wingSide : 'front';
  const end = WING_ENDS[side].includes(S.wingEnd) ? S.wingEnd : WING_ENDS[side][0];
  const fr = wingFrame(B, side),
    x0 = fr.x0,
    x1 = fr.x0 + fr.W;
  let Ww = Math.min(S.wingW, B.D - 2, foot === 'U' ? fr.W * 0.45 : fr.W - 2);
  Ww = Math.max(6, Ww);
  const P = S.wingP;
  if (foot === 'L')
    return [atLowEnd(side, end) ? { side, a: x0, b: x0 + Ww, P } : { side, a: x1 - Ww, b: x1, P }];
  if (foot === 'T') return [{ side, a: B.cx - Ww / 2, b: B.cx + Ww / 2, P }];
  return [
    { side, a: x0, b: x0 + Ww, P },
    { side, a: x1 - Ww, b: x1, P }
  ];
}

/* Stretches of each main wall hidden behind a wing, in that wall's own left-to-right distance. */
export function wingOccl(B, wings) {
  const out = { front: [], right: [], back: [], left: [] };
  (wings || []).forEach(w => {
    const fr = wingFrame(B, w.side || 'front');
    out[fr.side].push([w.a - fr.x0, w.b - fr.x0]);
  });
  return out;
}

/* The four footprint corners of a wing in world x/z, in wall order. */
export function wingCorners(B, w) {
  const fr = wingFrame(B, w.side || 'front');
  return [
    [w.a, 0, fr.zWall],
    [w.a, 0, fr.zWall + w.P],
    [w.b, 0, fr.zWall + w.P],
    [w.b, 0, fr.zWall]
  ].map(fr.pt);
}

/* World bounding box of a wing's footprint. */
export function wingRect(B, w) {
  const c = wingCorners(B, w);
  const xs = c.map(p => p[0]),
    zs = c.map(p => p[2]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}

/* Main roof planes re-expressed in a wing frame, so the wing roof can be cut where it meets them.
   On a gable house a side wing meets the gable wall, so that wall is added as a cutting plane too. */
export function planesInFrame(B, fr, planes) {
  if (fr.identity) return planes;
  const C = [B.cx, 0, B.cz],
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const out = planes.map(pn => {
    const n = fr.vecInv(pn.n);
    return { n, d: pn.d - dot(pn.n, C) + dot(n, C) };
  });
  if ((fr.side === 'left' || fr.side === 'right') && B.roof !== 'hip')
    out.push({ n: [0, 0, 1], d: fr.zWall });
  return out;
}

/* Moves faces built in a wing frame (ids i0 and up) onto the real side of the house. */
export function placeFaces(M, i0, fr) {
  if (fr.identity) return;
  for (let i = i0; i < M.faces.length; i++) {
    const f = M.faces[i];
    f.pts = f.pts.map(fr.pt);
    f.fr = { o: fr.pt(f.fr.o), u: fr.vec(f.fr.u), v: fr.vec(f.fr.v), n: fr.vec(f.fr.n) };
  }
}
