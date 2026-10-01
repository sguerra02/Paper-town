/* Ground tiles with tabs on every side, plus ponds, boulders and stone walls. */
import { S } from '../../config/state.js';
import { Vdot, newell } from '../../lib/geometry.js';
import { clamp, rng } from '../../lib/math.js';
import { boxFaces, mkFace } from '../faces.js';

export const GROUND = {
  lawn: 1,
  cobble: 1,
  gravel: 1,
  sand: 1,
  water: 1,
  forest: 1,
  dirt: 1,
  street: 1,
  parking: 1,
  tracks: 1
};

export function groundModel(M, K, p) {
  let len = Math.max(4, S.scL),
    wid = Math.max(2, S.scW);
  const Q = 24 + (S.sidewalks ? 13 : 0);
  if (K === 'street') {
    if (S.streetKind === 'straight') wid = Q;
    else {
      len = Q;
      wid = Q;
    }
  }
  if (K === 'tracks') wid = 12;
  const e = ['free', 'free', 'free', 'free'];
  if (S.tileTabs === 'two') {
    e[1] = 'attach';
    e[2] = 'attach';
  } else if (S.tileTabs === 'four') e.fill('attach');
  const names = {
    lawn: 'Grass',
    cobble: 'Cobblestone',
    gravel: 'Gravel',
    sand: 'Sand',
    water: 'Water',
    forest: 'Forest floor',
    dirt: 'Dirt',
    street: { straight: 'Street', cross: 'Intersection', tee: 'T-intersection', corner: 'Corner' }[
      S.streetKind
    ],
    parking: 'Parking lot',
    tracks: 'Railway track'
  };
  const id = mkFace(
    M,
    [
      [-len / 2, 0, wid / 2],
      [len / 2, 0, wid / 2],
      [len / 2, 0, -wid / 2],
      [-len / 2, 0, -wid / 2]
    ],
    {
      edge: e,
      art: {
        kind: 'ground',
        pal: p,
        sk: K,
        len,
        wid,
        Q,
        crosswalk: S.crosswalk,
        sidewalks: S.sidewalks,
        street: S.streetKind,
        path: S.path
      },
      name: names[K]
    }
  );
  M.groups.push({ title: names[K] + ' tile', faces: [id] });
  M.maxH = 4;
}

export function outward(pts, dir) {
  const n = newell(pts);
  return Vdot(n, dir) < 0 ? pts.slice().reverse() : pts;
}

export function pondModel(M, p) {
  const R = Math.max(4, S.scW / 2),
    rnd = rng(77),
    pts = [];
  const ph = rnd() * 6;
  for (let i = 0; i < 36; i++) {
    const a = (-i / 36) * Math.PI * 2,
      r = R * (1 + 0.14 * Math.sin(3 * a + ph) + 0.07 * Math.sin(5 * a + ph * 2));
    pts.push([r * Math.cos(a), 0, r * Math.sin(a) * 0.75]);
  }
  const id = mkFace(M, outward(pts, [0, 1, 0]), {
    edge: pts.map(() => 'free'),
    art: { kind: 'pond', pal: p },
    name: 'Pond'
  });
  M.groups.push({ title: 'Pond', faces: [id] });
  M.maxH = 4;
}

export function boulderModel(M, p) {
  const n = clamp(Math.round(S.scCount), 1, 12),
    H = Math.max(0.8, S.scH);
  for (let b = 0; b < n; b++) {
    const rnd = rng(b * 31 + 7),
      x = (b - (n - 1) / 2) * H * 2.6,
      R = H * (0.8 + rnd() * 0.4),
      k = 6,
      ring = [];
    for (let i = 0; i < k; i++) {
      const a = Math.PI / 2 - (i * 2 * Math.PI) / k + rnd() * 0.3,
        r = R * (0.8 + rnd() * 0.4);
      ring.push([x + r * Math.cos(a), r * Math.sin(a)]);
    }
    const h0 = H * 0.45,
      ap = [x + (rnd() - 0.5) * R * 0.4, H, (rnd() - 0.5) * R * 0.4],
      art = { kind: 'rock', pal: p },
      w = [],
      t = [];
    for (let i = 0; i < k; i++) {
      const a = ring[i],
        c = ring[(i + 1) % k];
      w.push(
        mkFace(
          M,
          outward(
            [
              [a[0], 0, a[1]],
              [c[0], 0, c[1]],
              [c[0], h0, c[1]],
              [a[0], h0, a[1]]
            ],
            [(a[0] + c[0]) / 2 - x, 0, (a[1] + c[1]) / 2]
          ),
          { edge: ['attach', 'auto', 'auto', 'auto'], art, name: 'Rock' }
        )
      );
    }
    for (let i = 0; i < k; i++) {
      const a = ring[i],
        c = ring[(i + 1) % k];
      t.push(
        mkFace(
          M,
          outward([[a[0], h0, a[1]], [c[0], h0, c[1]], ap], [(a[0] + c[0]) / 2 - x, 0.8, (a[1] + c[1]) / 2]),
          { edge: ['auto', 'auto', 'auto'], art, name: 'Rock top' }
        )
      );
    }
    M.groups.push({
      title: `Boulder ${b + 1}`,
      faces: [...w, ...t],
      pref: 'chain',
      check: true,
      mid: [w, t]
    });
  }
  M.maxH = H;
}

export function stoneWallModel(M, p) {
  const L = Math.max(4, S.scL),
    H = Math.max(1, S.scH),
    D = Math.max(1, S.scW);
  const a = { kind: 'stoneWall', pal: p };
  const F = boxFaces(
    M,
    -L / 2,
    L / 2,
    0,
    H,
    -D / 2,
    D / 2,
    { front: a, back: a, left: a, right: a, top: { kind: 'stoneTop', pal: p } },
    false,
    { front: 'Wall face', back: 'Wall face', left: 'Wall end', right: 'Wall end', top: 'Wall cap' }
  );
  M.groups.push({
    title: 'Stone wall',
    faces: [F.front, F.top, F.back, F.left, F.right],
    pref: 'root',
    check: true,
    mid: [[F.front, F.top, F.back], [F.left], [F.right]]
  });
  M.maxH = H;
}
