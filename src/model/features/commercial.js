/* Commercial features: awnings, canopies, marquees, penthouses and signs. */
import { S } from '../../config/state.js';
import { rectP } from '../../lib/geometry.js';
import { boxFaces, mkFace, wallFace } from '../faces.js';

export function awningFaces(M, B) {
  const xL = B.cx - B.W / 2 + 1.2,
    xR = B.cx + B.W / 2 - 1.2,
    zF = B.cz + B.D / 2,
    ya = B.found + B.G - 2.5,
    pj = 3.6,
    dr = 1.8,
    va = 0.7;
  const art = { kind: 'awning', pal: B.pal };
  const lo = ya - dr,
    zo = zF + pj;
  const s = mkFace(
    M,
    [
      [xL, lo, zo],
      [xR, lo, zo],
      [xR, ya, zF],
      [xL, ya, zF]
    ],
    { edge: ['auto', 'auto', 'attach', 'auto'], art, name: 'Awning' }
  );
  const v = mkFace(
    M,
    [
      [xL, lo - va, zo],
      [xR, lo - va, zo],
      [xR, lo, zo],
      [xL, lo, zo]
    ],
    {
      edge: ['free', 'free', 'auto', 'free'],
      art: { kind: 'awning', pal: B.pal, valance: true },
      name: 'Valance'
    }
  );
  const r = mkFace(
    M,
    [
      [xR, lo, zo],
      [xR, lo, zF],
      [xR, ya, zF]
    ],
    { edge: ['free', 'attach', 'auto'], art: { kind: 'awnSide', pal: B.pal }, name: 'Awning side' }
  );
  const l = mkFace(
    M,
    [
      [xL, lo, zF],
      [xL, lo, zo],
      [xL, ya, zF]
    ],
    { edge: ['free', 'auto', 'attach'], art: { kind: 'awnSide', pal: B.pal }, name: 'Awning side' }
  );
  return [s, v, r, l];
}

export function buildCanopy(M, B) {
  const Wc = Math.min(B.W * 0.95, 34),
    Dc = 18,
    hc = 14,
    tc = 2.6,
    zc0 = B.cz + B.D / 2 + 8,
    zc1 = zc0 + Dc,
    x0 = B.cx - Wc / 2,
    x1 = B.cx + Wc / 2,
    pz = (zc0 + zc1) / 2;
  const pal = B.pal;
  const fa = t => ({ kind: 'fascia', pal, text: t ? B.sign : '' });
  const C = boxFaces(
    M,
    x0,
    x1,
    hc,
    hc + tc,
    zc0,
    zc1,
    {
      bottom: { kind: 'canopyBottom', pal },
      front: fa(true),
      back: fa(true),
      left: fa(false),
      right: fa(false),
      top: { kind: 'deck', pal }
    },
    true,
    {
      bottom: 'Underside',
      front: 'Front fascia',
      back: 'Back fascia',
      left: 'Side fascia',
      right: 'Side fascia',
      top: 'Top'
    }
  );
  M.groups.push({
    title: 'Canopy',
    faces: [C.bottom, C.front, C.right, C.back, C.left, C.top],
    pref: 'root',
    mid: [[C.bottom, C.front, C.right, C.back, C.left], [C.top]],
    check: true
  });
  [B.cx - Wc / 4, B.cx + Wc / 4].forEach((px, i) => {
    const s = 1.3,
      o = [px - s / 2, px + s / 2, pz - s / 2, pz + s / 2];
    const ids = [];
    const E = ['attach', 'auto', 'attach', 'auto'];
    const art = { kind: 'post', pal };
    ids.push(wallFace(M, [o[0], 0, o[3]], [1, 0, 0], rectP(0, 0, s, hc), { edge: E, art, name: 'Post' }));
    ids.push(wallFace(M, [o[1], 0, o[3]], [0, 0, -1], rectP(0, 0, s, hc), { edge: E, art, name: 'Post' }));
    ids.push(wallFace(M, [o[1], 0, o[2]], [-1, 0, 0], rectP(0, 0, s, hc), { edge: E, art, name: 'Post' }));
    ids.push(wallFace(M, [o[0], 0, o[2]], [0, 0, 1], rectP(0, 0, s, hc), { edge: E, art, name: 'Post' }));
    M.groups.push({
      title: `Canopy post ${i + 1}`,
      faces: ids,
      pref: 'chain',
      mid: [
        [ids[0], ids[1]],
        [ids[2], ids[3]]
      ]
    });
    const w = 2.8,
      d = 1.5,
      h = 5.2,
      qz = pz + 2.4;
    const pa = r => ({ kind: 'pump', pal, role: r });
    const P = boxFaces(
      M,
      px - w / 2,
      px + w / 2,
      0,
      h,
      qz - d / 2,
      qz + d / 2,
      { front: pa('face'), back: pa('face'), left: pa('side'), right: pa('side'), top: pa('top') },
      false,
      { front: 'Pump front', back: 'Pump back', left: 'Pump side', right: 'Pump side', top: 'Pump top' }
    );
    M.groups.push({
      title: `Fuel pump ${i + 1}`,
      faces: [P.front, P.right, P.back, P.left, P.top],
      pref: 'chain',
      check: true
    });
  });
  if (S.base) {
    const b = mkFace(
      M,
      [
        [x0 - 2, 0, zc1 + 2],
        [x1 + 2, 0, zc1 + 2],
        [x1 + 2, 0, zc0 - 2],
        [x0 - 2, 0, zc0 - 2]
      ],
      {
        edge: ['free', 'free', 'free', 'free'],
        art: { kind: 'pad', pal, islands: [B.cx - Wc / 4, B.cx + Wc / 4], pz },
        name: 'Canopy pad',
        noPreview: true
      }
    );
    M.groups.push({ title: 'Canopy pad', faces: [b] });
  }
}

export function flatCanopy(M, B) {
  const x0 = B.cx - B.W / 2 + 0.6,
    x1 = B.cx + B.W / 2 - 0.6,
    zF = B.cz + B.D / 2,
    p = 4,
    y0 = B.found + B.G - 1.9,
    y1 = y0 + 0.9,
    zp = zF + p;
  const fa = { kind: 'canopyFace', pal: B.pal },
    pa = { kind: 'canopyFlat', pal: B.pal };
  const front = mkFace(
    M,
    [
      [x0, y0, zp],
      [x1, y0, zp],
      [x1, y1, zp],
      [x0, y1, zp]
    ],
    { edge: ['auto', 'auto', 'auto', 'auto'], art: fa, name: 'Canopy front' }
  );
  const top = mkFace(
    M,
    [
      [x0, y1, zp],
      [x1, y1, zp],
      [x1, y1, zF],
      [x0, y1, zF]
    ],
    { edge: ['auto', 'auto', 'attach', 'auto'], art: pa, name: 'Canopy top' }
  );
  const bot = mkFace(
    M,
    [
      [x0, y0, zF],
      [x1, y0, zF],
      [x1, y0, zp],
      [x0, y0, zp]
    ],
    { edge: ['attach', 'auto', 'auto', 'auto'], art: pa, name: 'Canopy underside' }
  );
  const r = mkFace(
    M,
    [
      [x1, y0, zp],
      [x1, y0, zF],
      [x1, y1, zF],
      [x1, y1, zp]
    ],
    { edge: ['auto', 'attach', 'auto', 'auto'], art: fa, name: 'Canopy end' }
  );
  const l = mkFace(
    M,
    [
      [x0, y0, zF],
      [x0, y0, zp],
      [x0, y1, zp],
      [x0, y1, zF]
    ],
    { edge: ['auto', 'auto', 'auto', 'attach'], art: fa, name: 'Canopy end' }
  );
  return [front, top, bot, r, l];
}

export function penthouse(M, B) {
  const w = Math.min(12, B.W * 0.4),
    d = Math.min(8, B.D * 0.3),
    x0 = B.cx - w / 2,
    z0 = B.cz - B.D / 2 + 3,
    y0 = B.H,
    y1 = B.H + 7;
  const a = { kind: 'mech', pal: B.pal };
  const F = boxFaces(
    M,
    x0,
    x0 + w,
    y0,
    y1,
    z0,
    z0 + d,
    { front: a, back: a, left: a, right: a, top: { kind: 'deck', pal: B.pal } },
    false,
    {
      front: 'Mechanical',
      back: 'Mechanical',
      left: 'Mechanical',
      right: 'Mechanical',
      top: 'Mechanical top'
    }
  );
  M.groups.push({
    title: 'Rooftop mechanical',
    faces: [F.front, F.right, F.back, F.left, F.top],
    pref: 'chain',
    check: true
  });
}

export function flatCanopyX(M, B, o) {
  const x0 = o.x0,
    x1 = o.x1,
    zF = B.cz + B.D / 2,
    p = o.p,
    y0 = o.y0,
    y1 = y0 + (o.th || 0.9),
    zp = zF + p;
  const fa = { kind: 'canopyFace', pal: B.pal, text: o.text || '', bulbs: !!o.bulbs },
    pa = { kind: 'canopyFlat', pal: B.pal };
  const front = mkFace(
    M,
    [
      [x0, y0, zp],
      [x1, y0, zp],
      [x1, y1, zp],
      [x0, y1, zp]
    ],
    { edge: ['auto', 'auto', 'auto', 'auto'], art: fa, name: o.name + ' front' }
  );
  const top = mkFace(
    M,
    [
      [x0, y1, zp],
      [x1, y1, zp],
      [x1, y1, zF],
      [x0, y1, zF]
    ],
    { edge: ['auto', 'auto', 'attach', 'auto'], art: pa, name: o.name + ' top' }
  );
  const bot = mkFace(
    M,
    [
      [x0, y0, zF],
      [x1, y0, zF],
      [x1, y0, zp],
      [x0, y0, zp]
    ],
    { edge: ['attach', 'auto', 'auto', 'auto'], art: pa, name: o.name + ' underside' }
  );
  const r = mkFace(
    M,
    [
      [x1, y0, zp],
      [x1, y0, zF],
      [x1, y1, zF],
      [x1, y1, zp]
    ],
    {
      edge: ['auto', 'attach', 'auto', 'auto'],
      art: Object.assign({}, fa, { text: o.sideText ? fa.text : '' }),
      name: o.name + ' end'
    }
  );
  const l = mkFace(
    M,
    [
      [x0, y0, zF],
      [x0, y0, zp],
      [x0, y1, zp],
      [x0, y1, zF]
    ],
    {
      edge: ['auto', 'auto', 'auto', 'attach'],
      art: Object.assign({}, fa, { text: o.sideText ? fa.text : '' }),
      name: o.name + ' end'
    }
  );
  M.groups.push({
    title: o.title,
    faces: [front, top, bot, r, l],
    pref: 'root',
    check: true,
    mid: [[front, top, r, l], [bot]]
  });
}

/* vertical blade sign fixed to the front wall */
export function bladeSign(M, B, xc, y0, y1, proj, text) {
  const zF = B.cz + B.D / 2,
    t = 1.2,
    x0 = xc - t / 2,
    x1 = xc + t / 2,
    zp = zF + proj,
    pal = B.pal;
  const fa = { kind: 'blade', pal, text },
    ea = { kind: 'canopyFace', pal, bulbs: true };
  const L = mkFace(
    M,
    [
      [x0, y0, zF],
      [x0, y0, zp],
      [x0, y1, zp],
      [x0, y1, zF]
    ],
    { edge: ['auto', 'auto', 'auto', 'attach'], art: fa, name: 'Blade sign side' }
  );
  const F = mkFace(
    M,
    [
      [x0, y0, zp],
      [x1, y0, zp],
      [x1, y1, zp],
      [x0, y1, zp]
    ],
    { edge: ['auto', 'auto', 'auto', 'auto'], art: ea, name: 'Blade sign edge' }
  );
  const R = mkFace(
    M,
    [
      [x1, y0, zp],
      [x1, y0, zF],
      [x1, y1, zF],
      [x1, y1, zp]
    ],
    { edge: ['auto', 'attach', 'auto', 'auto'], art: fa, name: 'Blade sign side' }
  );
  const T = mkFace(
    M,
    [
      [x0, y1, zp],
      [x1, y1, zp],
      [x1, y1, zF],
      [x0, y1, zF]
    ],
    { edge: ['auto', 'auto', 'attach', 'auto'], art: { kind: 'canopyFlat', pal }, name: 'Blade sign top' }
  );
  const Bt = mkFace(
    M,
    [
      [x0, y0, zF],
      [x1, y0, zF],
      [x1, y0, zp],
      [x0, y0, zp]
    ],
    { edge: ['attach', 'auto', 'auto', 'auto'], art: { kind: 'canopyFlat', pal }, name: 'Blade sign bottom' }
  );
  M.groups.push({ title: 'Blade sign', faces: [F, L, R, T, Bt], pref: 'root', check: true });
}

/* free-standing pylon sign: post + sign box */
export function pylonSign(M, pal, cx, cz, h, bw, bh, text, sub) {
  const s = 1,
    ids = [],
    E = ['attach', 'auto', 'attach', 'auto'],
    art = { kind: 'post', pal };
  ids.push(
    wallFace(M, [cx - s / 2, 0, cz + s / 2], [1, 0, 0], rectP(0, 0, s, h), {
      edge: E,
      art,
      name: 'Sign post'
    })
  );
  ids.push(
    wallFace(M, [cx + s / 2, 0, cz + s / 2], [0, 0, -1], rectP(0, 0, s, h), {
      edge: E,
      art,
      name: 'Sign post'
    })
  );
  ids.push(
    wallFace(M, [cx + s / 2, 0, cz - s / 2], [-1, 0, 0], rectP(0, 0, s, h), {
      edge: E,
      art,
      name: 'Sign post'
    })
  );
  ids.push(
    wallFace(M, [cx - s / 2, 0, cz - s / 2], [0, 0, 1], rectP(0, 0, s, h), {
      edge: E,
      art,
      name: 'Sign post'
    })
  );
  M.groups.push({ title: 'Sign post', faces: ids, pref: 'chain' });
  const fa = { kind: 'signFace', pal, text, sub: sub || '' },
    ea = { kind: 'canopyFace', pal, bulbs: true };
  const Bx = boxFaces(
    M,
    cx - bw / 2,
    cx + bw / 2,
    h,
    h + bh,
    cz - 0.6,
    cz + 0.6,
    {
      bottom: { kind: 'canopyFlat', pal },
      front: fa,
      back: fa,
      left: ea,
      right: ea,
      top: { kind: 'canopyFlat', pal }
    },
    true,
    {
      bottom: 'Sign bottom',
      front: 'Sign face',
      back: 'Sign face',
      left: 'Sign edge',
      right: 'Sign edge',
      top: 'Sign top'
    }
  );
  M.groups.push({
    title: 'Sign box',
    faces: [Bx.front, Bx.bottom, Bx.back, Bx.top, Bx.left, Bx.right],
    pref: 'chain',
    check: true,
    mid: [[Bx.front, Bx.bottom, Bx.back, Bx.top], [Bx.left], [Bx.right]]
  });
}
