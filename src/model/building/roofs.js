/* Roofs: gable, hip, gambrel, shed, flat and sawtooth. */
import { poly } from '../../lib/draw.js';
import { Vdot, newell } from '../../lib/geometry.js';
import { mkFace } from '../faces.js';

export function gamb(t2) {
  return { t1: Math.min(2.4, Math.max(1.4, 2.4 * t2)), t2 };
}

export function planesOf(M, ids) {
  return ids.map(id => {
    const f = M.faces[id];
    const n = newell(f.pts);
    return { n, d: Vdot(n, f.pts[0]) };
  });
}

export function roofFaces(M, B) {
  const e = B.eave,
    r = B.rake,
    t = B.pitch / 12,
    H = B.H,
    W = B.W,
    D = B.D,
    xL = B.cx - W / 2,
    xR = B.cx + W / 2,
    zF = B.cz + D / 2,
    zB = B.cz - D / 2,
    cz = B.cz,
    cx = B.cx;
  const art = { kind: 'roof', finish: B.roofFinish, pal: B.pal };
  const ids = [];
  let pref = 'chain';
  const add = (pts, edge, tag, name) => ids.push(mkFace(M, pts, { edge, tag, art, name }));
  if (B.roof === 'gable') {
    const ye = H - e * t,
      yr = H + (D / 2) * t;
    add(
      [
        [xL - r, ye, zF + e],
        [xR + r, ye, zF + e],
        [xR + r, yr, cz],
        [xL - r, yr, cz]
      ],
      ['free', 'free', 'auto', 'free'],
      ['eave', 'rake', 'ridge', 'rake'],
      'Front slope'
    );
    add(
      [
        [xR + r, ye, zB - e],
        [xL - r, ye, zB - e],
        [xL - r, yr, cz],
        [xR + r, yr, cz]
      ],
      ['free', 'free', 'auto', 'free'],
      ['eave', 'rake', 'ridge', 'rake'],
      'Back slope'
    );
    const planes = planesOf(M, ids);
    planes.push({ n: [1, 0, 0], d: xR + r }, { n: [-1, 0, 0], d: -(xL - r) });
    return { ids, pref, planes };
  }
  if (B.roof === 'hip') {
    const ye = H - e * t,
      X0 = xL - e,
      X1 = xR + e,
      Z0 = zB - e,
      Z1 = zF + e;
    pref = 'root';
    const E4 = ['free', 'auto', 'auto', 'auto'],
      T4 = ['eave', 'hip', 'ridge', 'hip'],
      E3 = ['free', 'auto', 'auto'],
      T3 = ['eave', 'hip', 'hip'];
    if (X1 - X0 >= Z1 - Z0) {
      const h = (Z1 - Z0) / 2,
        yr = ye + h * t,
        r0 = X0 + h,
        r1 = X1 - h;
      if (r1 - r0 > 0.01) {
        add(
          [
            [X0, ye, Z1],
            [X1, ye, Z1],
            [r1, yr, cz],
            [r0, yr, cz]
          ],
          E4,
          T4,
          'Front slope'
        );
        add(
          [
            [X1, ye, Z0],
            [X0, ye, Z0],
            [r0, yr, cz],
            [r1, yr, cz]
          ],
          E4,
          T4,
          'Back slope'
        );
      } else {
        add(
          [
            [X0, ye, Z1],
            [X1, ye, Z1],
            [cx, yr, cz]
          ],
          E3,
          T3,
          'Front slope'
        );
        add(
          [
            [X1, ye, Z0],
            [X0, ye, Z0],
            [cx, yr, cz]
          ],
          E3,
          T3,
          'Back slope'
        );
      }
      const a = r1 - r0 > 0.01 ? r1 : cx,
        b = r1 - r0 > 0.01 ? r0 : cx;
      add(
        [
          [X1, ye, Z1],
          [X1, ye, Z0],
          [a, yr, cz]
        ],
        E3,
        T3,
        'Right hip'
      );
      add(
        [
          [X0, ye, Z0],
          [X0, ye, Z1],
          [b, yr, cz]
        ],
        E3,
        T3,
        'Left hip'
      );
    } else {
      const h = (X1 - X0) / 2,
        yr = ye + h * t,
        z0 = Z0 + h,
        z1 = Z1 - h;
      add(
        [
          [X1, ye, Z1],
          [X1, ye, Z0],
          [cx, yr, z0],
          [cx, yr, z1]
        ],
        E4,
        T4,
        'Right slope'
      );
      add(
        [
          [X0, ye, Z0],
          [X0, ye, Z1],
          [cx, yr, z1],
          [cx, yr, z0]
        ],
        E4,
        T4,
        'Left slope'
      );
      add(
        [
          [X0, ye, Z1],
          [X1, ye, Z1],
          [cx, yr, z1]
        ],
        E3,
        T3,
        'Front hip'
      );
      add(
        [
          [X1, ye, Z0],
          [X0, ye, Z0],
          [cx, yr, z0]
        ],
        E3,
        T3,
        'Back hip'
      );
    }
    return { ids, pref, planes: planesOf(M, ids) };
  }
  if (B.roof === 'gambrel') {
    const g = gamb(t),
      b = D * 0.2,
      yl = H - e * g.t1,
      yb = H + b * g.t1,
      yr = yb + (D / 2 - b) * g.t2;
    add(
      [
        [xL - r, yl, zF + e],
        [xR + r, yl, zF + e],
        [xR + r, yb, zF - b],
        [xL - r, yb, zF - b]
      ],
      ['free', 'free', 'auto', 'free'],
      ['eave', 'rake', '', 'rake'],
      'Front lower'
    );
    add(
      [
        [xL - r, yb, zF - b],
        [xR + r, yb, zF - b],
        [xR + r, yr, cz],
        [xL - r, yr, cz]
      ],
      ['auto', 'free', 'auto', 'free'],
      ['', 'rake', 'ridge', 'rake'],
      'Front upper'
    );
    add(
      [
        [xR + r, yb, zB + b],
        [xL - r, yb, zB + b],
        [xL - r, yr, cz],
        [xR + r, yr, cz]
      ],
      ['auto', 'free', 'auto', 'free'],
      ['', 'rake', 'ridge', 'rake'],
      'Back upper'
    );
    add(
      [
        [xR + r, yl, zB - e],
        [xL - r, yl, zB - e],
        [xL - r, yb, zB + b],
        [xR + r, yb, zB + b]
      ],
      ['free', 'free', 'auto', 'free'],
      ['eave', 'rake', '', 'rake'],
      'Back lower'
    );
    return { ids, pref, planes: planesOf(M, ids) };
  }
  if (B.roof === 'shed') {
    const yf = H - e * t,
      yb = H + D * t + e * t;
    add(
      [
        [xL - r, yf, zF + e],
        [xR + r, yf, zF + e],
        [xR + r, yb, zB - e],
        [xL - r, yb, zB - e]
      ],
      ['free', 'free', 'free', 'free'],
      ['eave', 'rake', 'ridge', 'rake'],
      'Roof'
    );
    return { ids, pref, planes: planesOf(M, ids) };
  }
  if (B.roof === 'saw') return { ids: sawFaces(M, B), pref: 'chain', planes: [] };
  // flat deck
  ids.push(
    mkFace(
      M,
      [
        [xL, H, zF],
        [xR, H, zF],
        [xR, H, zB],
        [xL, H, zB]
      ],
      { edge: ['attach', 'attach', 'attach', 'attach'], art: { kind: 'deck', pal: B.pal }, name: 'Roof deck' }
    )
  );
  return { ids, pref, planes: [], deck: true };
}

export function ridgeInfo(B) {
  const t = B.pitch / 12,
    H = B.H,
    D = B.D;
  if (B.roof === 'gable' || (B.roof === 'hip' && B.W >= B.D)) return { yr: H + (D / 2) * t, t };
  if (B.roof === 'gambrel') {
    const g = gamb(t),
      b = D * 0.2;
    return { yr: H + b * g.t1 + (D / 2 - b) * g.t2, t: g.t2 };
  }
  return null;
}

/* sawtooth roof (factory) */
export function sawInfo(B) {
  const n = Math.max(2, Math.round(B.D / 12)),
    tw = B.D / n;
  return { n, tw, h: Math.min(7, tw * 0.5) };
}

export function sawFaces(M, B) {
  const { n, tw, h } = sawInfo(B),
    xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    H = B.H,
    ids = [];
  for (let i = 0; i < n; i++) {
    const zi = zF - i * tw,
      zn = zi - tw;
    ids.push(
      mkFace(
        M,
        [
          [xL, H, zi],
          [xR, H, zi],
          [xR, H + h, zi],
          [xL, H + h, zi]
        ],
        {
          edge: [i === 0 ? 'free' : 'auto', 'free', 'auto', 'free'],
          art: { kind: 'sawGlass', pal: B.pal },
          name: 'Clerestory glass'
        }
      )
    );
    ids.push(
      mkFace(
        M,
        [
          [xR, H, zn],
          [xL, H, zn],
          [xL, H + h, zi],
          [xR, H + h, zi]
        ],
        {
          edge: [i === n - 1 ? 'free' : 'auto', 'free', 'auto', 'free'],
          tag: [i === n - 1 ? 'eave' : '', '', '', ''],
          art: { kind: 'roof', finish: B.roofFinish, pal: B.pal },
          name: 'Roof slope'
        }
      )
    );
  }
  return ids;
}

export function sawSide(B, w, right) {
  const { n, tw, h } = sawInfo(B),
    H = B.H;
  // local x runs from front (0) to back (w) on the right wall
  let top = [[w, H]];
  for (let i = n - 1; i >= 0; i--) {
    top.push([i * tw, H + h]);
    if (i > 0) top.push([i * tw, H]);
  }
  let poly = [[0, 0], [w, 0], ...top, [0, H]];
  if (!right) {
    poly = poly.map(([x, y]) => [w - x, y]);
    poly = [poly[0], ...poly.slice(1).reverse()];
    poly = poly.map(p => p);
  }
  // rotate so it starts at [0,0] then [w,0]
  let k = poly.findIndex(p => Math.abs(p[0]) < 1e-9 && Math.abs(p[1]) < 1e-9);
  poly = poly.slice(k).concat(poly.slice(0, k));
  const edge = [],
    tag = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    if (i === 0) {
      edge.push('attach');
      tag.push('');
    } else if (
      Math.abs(a[0] - b[0]) < 1e-9 &&
      (Math.abs(a[0]) < 1e-9 || Math.abs(a[0] - w) < 1e-9) &&
      Math.min(a[1], b[1]) < 1e-9
    ) {
      edge.push('auto');
      tag.push('');
    } else if (Math.abs(a[0] - b[0]) < 1e-9 && (Math.abs(a[0]) < 1e-9 || Math.abs(a[0] - w) < 1e-9)) {
      edge.push('free');
      tag.push('');
    } else {
      edge.push('attach');
      tag.push('');
    }
  }
  return { poly, edge, tag };
}
