/* Towers, silos, steeples, flag poles and other civic extras. */
import { Vcross, rectP } from '../../lib/geometry.js';
import { crenelPoly } from '../building/shell.js';
import { mkFace, wallFace } from '../faces.js';
import { buildPorch } from './house.js';

/* polygonal tower / silo: T={cx,cz,r,n,h,top:'cone'|'crenel',coneH,pal,finish,found,style,roofFinish,name,inward:[x,z]} */
export function buildTower(M, T) {
  const ring = [];
  for (let i = 0; i < T.n; i++) {
    const ph = (T.phi0 === undefined ? Math.PI / 2 : T.phi0) - (i * 2 * Math.PI) / T.n;
    ring.push([T.cx + T.r * Math.cos(ph), T.cz + T.r * Math.sin(ph)]);
  }
  const TB = {
    type: 'tower',
    style: T.style,
    finish: T.finish,
    pal: T.pal,
    found: T.found,
    H: T.h,
    roof: 'tower',
    stories: T.stories || 1,
    storyH: T.storyH || 10,
    spooky: T.style === 'spooky'
  };
  const walls = [];
  const mh = 3;
  for (let i = 0; i < T.n; i++) {
    const a = ring[i],
      b = ring[(i + 1) % T.n],
      w = Math.hypot(b[0] - a[0], b[1] - a[1]),
      u = [(b[0] - a[0]) / w, 0, (b[1] - a[1]) / w];
    const nrm = Vcross(u, [0, 1, 0]);
    let inward = false;
    if (T.inward) {
      const mx = (a[0] + b[0]) / 2,
        mz = (a[1] + b[1]) / 2,
        dx = T.inward[0] - mx,
        dz = T.inward[1] - mz,
        l = Math.hypot(dx, dz) || 1;
      inward = (nrm[0] * dx + nrm[2] * dz) / l > 0.35;
    }
    const pr =
      T.top === 'crenel'
        ? crenelPoly(w, T.h, mh)
        : {
            poly: rectP(0, 0, w, T.h),
            edge: ['attach', 'auto', T.top === 'none' ? 'free' : 'attach', 'auto'],
            tag: ['', '', '', '']
          };
    walls.push(
      wallFace(M, [a[0], 0, a[1]], u, pr.poly, {
        edge: pr.edge,
        tag: pr.tag,
        name: T.name + ' wall',
        art: { kind: 'wall', role: inward ? 'party' : 'tower', idx: i, B: TB }
      })
    );
  }
  if (T.doorDir) {
    let bi = -1,
      bd = -2;
    walls.forEach((id, i) => {
      const f = M.faces[id];
      const d = f.fr.n[0] * T.doorDir[0] + f.fr.n[2] * T.doorDir[1];
      if (d > bd) {
        bd = d;
        bi = i;
      }
    });
    if (bi >= 0) M.faces[walls[bi]].art.door = true;
  }
  const half = Math.ceil(T.n / 2);
  M.groups.push({
    title: T.name + ' walls',
    faces: walls,
    pref: 'chain',
    mid: [walls.slice(0, half), walls.slice(half)]
  });
  if (T.top === 'none') {
  } else if (T.top === 'crenel') {
    const d = mkFace(
      M,
      ring.map(p => [p[0], T.h, p[1]]),
      { edge: ring.map(() => 'attach'), art: { kind: 'deck', pal: T.pal }, name: T.name + ' deck' }
    );
    M.groups.push({ title: T.name + ' deck', faces: [d] });
  } else {
    const ov = 0.6,
      sc = (T.r + ov) / T.r,
      drop = (ov * T.coneH) / T.r,
      apex = [T.cx, T.h + T.coneH, T.cz];
    const tri = [];
    for (let i = 0; i < T.n; i++) {
      const a = ring[i],
        b = ring[(i + 1) % T.n];
      const A = [T.cx + (a[0] - T.cx) * sc, T.h - drop, T.cz + (a[1] - T.cz) * sc],
        B = [T.cx + (b[0] - T.cx) * sc, T.h - drop, T.cz + (b[1] - T.cz) * sc];
      tri.push(
        mkFace(M, [A, B, apex], {
          edge: ['free', 'auto', 'auto'],
          tag: ['eave', 'hip', 'hip'],
          art: { kind: 'roof', finish: T.roofFinish, pal: T.pal },
          name: T.name + ' roof'
        })
      );
    }
    M.groups.push({
      title: T.name + ' roof',
      faces: tri,
      pref: 'chain',
      check: true,
      mid: [tri.slice(0, half), tri.slice(half)]
    });
  }
  return walls;
}

export function flagPole(M, pal, x, z, h) {
  const s = 0.35,
    E = ['attach', 'auto', 'free', 'auto'],
    art = { kind: 'post', pal },
    q = [];
  q.push(
    wallFace(M, [x - s / 2, 0, z + s / 2], [1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Flagpole' }),
    wallFace(M, [x + s / 2, 0, z + s / 2], [0, 0, -1], rectP(0, 0, s, h), { edge: E, art, name: 'Flagpole' }),
    wallFace(M, [x + s / 2, 0, z - s / 2], [-1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Flagpole' }),
    wallFace(M, [x - s / 2, 0, z - s / 2], [0, 0, 1], rectP(0, 0, s, h), { edge: E, art, name: 'Flagpole' })
  );
  M.groups.push({ title: 'Flagpole', faces: q, pref: 'chain' });
  const f = wallFace(M, [x + s / 2, h - 4.8, z], [1, 0, 0], rectP(0, 0, 7.2, 4.4), {
    edge: ['free', 'free', 'free', 'attach'],
    art: { kind: 'flag', pal },
    name: 'Flag'
  });
  M.groups.push({ title: 'Flag', faces: [f] });
}

export function rotateFaces(M, i0) {
  const r = p => [-p[2], p[1], p[0]];
  for (let i = i0; i < M.faces.length; i++) {
    const f = M.faces[i];
    f.pts = f.pts.map(r);
    f.fr = { o: r(f.fr.o), u: r(f.fr.u), v: r(f.fr.v), n: r(f.fr.n) };
  }
}

export function civicExtras(M, B) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2,
    K = B.civKind;
  if (K === 'fire') {
    const s = 9;
    buildTower(M, {
      cx: xL - s / 2,
      cz: zB + s / 2 + 2,
      r: s / Math.SQRT2,
      n: 4,
      phi0: Math.PI / 4,
      h: B.H + 14,
      top: 'cone',
      coneH: 4,
      pal: B.pal,
      finish: B.finish,
      found: B.found,
      style: 'hose',
      roofFinish: 'seam',
      name: 'Hose tower',
      inward: [B.cx, B.cz]
    });
    flagPole(M, B.pal, xR + 4, zF + 6, 24);
  } else if (K === 'police' || K === 'post') flagPole(M, B.pal, B.cx + B.W * 0.36, zF + 8, 24);
  else if (K === 'library')
    buildPorch(M, B, B.cx - Math.min(10, B.W * 0.22), B.cx + Math.min(10, B.W * 0.22), true);
  else if (K === 'station') buildPorch(M, B, xL + 1, xR - 1, false);
  else if (K === 'church') {
    const s = 10;
    buildTower(M, {
      cx: xR + s / 2,
      cz: B.cz,
      r: s / Math.SQRT2,
      n: 4,
      phi0: Math.PI / 4,
      h: B.H + ((B.D / 2) * B.pitch) / 12 + 8,
      top: 'cone',
      coneH: 22,
      pal: B.pal,
      finish: B.finish,
      found: B.found,
      style: 'steeple',
      roofFinish: B.roofFinish,
      name: 'Steeple',
      inward: [B.cx, B.cz],
      doorDir: [1, 0]
    });
  }
}
