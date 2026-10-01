/* Scenery models: picks the builder for the chosen scenery piece. Trees and small objects are built here. */
import { slit } from '../../art/openings/doors.js';
import { S } from '../../config/state.js';
import { poly } from '../../lib/draw.js';
import { Vcross, rectP } from '../../lib/geometry.js';
import { clamp, rng, shade } from '../../lib/math.js';
import { boxFaces, mkFace, wallFace } from '../faces.js';
import { GROUND, boulderModel, groundModel, pondModel, stoneWallModel } from './ground.js';
import { sceneryModel2 } from './objects.js';
import { trainModel } from './train.js';

export function scPal() {
  const L = S.mode === 'line',
    w = '#ffffff';
  return {
    L,
    leaf: L ? w : S.wallColor,
    leafD: L ? '#9a9a9a' : shade(S.wallColor, -0.3),
    leafL: L ? w : shade(S.wallColor, 0.22),
    trunk: L ? w : S.trimColor,
    trunkD: L ? '#555555' : shade(S.trimColor, -0.35),
    ground: L ? w : S.roofColor,
    groundL: L ? '#9a9a9a' : shade(S.roofColor, 0.25),
    accent: L ? w : S.accentColor,
    accentLine: L ? '#222222' : shade(S.accentColor, -0.4),
    glass: L ? w : '#2e3c44',
    glassLine: L ? '#222222' : '#1a2327',
    metal: L ? w : '#c9ced0',
    metalLine: L ? '#222222' : '#8c9294',
    concrete: L ? w : '#cfcdc6',
    concreteLine: L ? '#9a9a9a' : '#a9a79f',
    paint: L ? '#222222' : '#f4f4ef',
    yellow: L ? '#222222' : '#e8c33a',
    white: '#ffffff',
    black: L ? w : '#1c1c1e',
    grass: L ? w : '#6f9a4c',
    grassD: L ? '#9a9a9a' : '#557a38'
  };
}

export function crownSil(H, R, tw, seed) {
  const rnd = rng(seed),
    cy = H - R,
    pts = [
      [-tw / 2, 0],
      [tw / 2, 0]
    ];
  const a0 = -Math.PI / 2 + Math.asin(Math.min(0.9, tw / 2 / R)),
    a1 = (3 * Math.PI) / 2 - Math.asin(Math.min(0.9, tw / 2 / R));
  const ph = rnd() * 6;
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const r = R * (1 + 0.07 * Math.sin(7 * a + ph) + 0.04 * Math.sin(13 * a + ph * 2));
    pts.push([r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return { pts, cy };
}

export function foldPair(M, o3, u, poly, opts, groupTitle) {
  const n = Vcross(u, [0, 1, 0]);
  const mir = poly.map(([x, y]) => [-x, y]).reverse();
  const e1 = poly.map((_, i) => (i === 0 ? 'auto' : 'free'));
  const idx0 = mir.findIndex((p, i) => {
    const q = mir[(i + 1) % mir.length];
    return Math.abs(p[1]) < 1e-9 && Math.abs(q[1]) < 1e-9;
  });
  const e2 = mir.map((_, i) => (i === idx0 ? 'auto' : 'free'));
  const A = wallFace(M, o3, u, poly, Object.assign({}, opts, { edge: e1, noTab: true }));
  const B = wallFace(
    M,
    o3,
    [-u[0], -u[1], -u[2]],
    mir,
    Object.assign({}, opts, { edge: e2, noPreview: true, noTab: true })
  );
  M.groups.push({ title: groupTitle, faces: [A, B], pref: 'chain' });
}

export function sceneryModel(M) {
  const K = S.scKind,
    n = clamp(Math.round(S.scCount), 1, 12),
    p = scPal(),
    H = S.scH,
    L = S.scL,
    Wd = S.scW;
  if (sceneryModel2(M, K, p)) return;
  const row = sp => {
    const xs = [];
    for (let i = 0; i < n; i++) xs.push((i - (n - 1) / 2) * sp);
    return xs;
  };
  if (K === 'tree') {
    const R = H * 0.36,
      tw = Math.max(0.9, H * 0.05);
    row(R * 2.3).forEach((x, i) => {
      const cs = crownSil(H, R, tw, i * 17 + 3);
      const art = slit => ({ kind: 'treeSil', pal: p, slit, R, cy: cs.cy, tw, H, seed: i });
      foldPair(M, [x, 0, 0], [1, 0, 0], cs.pts, { art: art('top'), name: 'Tree' }, `Tree ${i + 1} side A`);
      foldPair(
        M,
        [x, 0, 0],
        [0, 0, -1],
        cs.pts,
        { art: art('bottom'), name: 'Tree' },
        `Tree ${i + 1} side B`
      );
    });
  } else if (K === 'pine') {
    const R = H * 0.22,
      hb = H * 0.16,
      nn = 8;
    row(R * 2.6).forEach((x, i) => {
      const ring = [];
      for (let k = 0; k < nn; k++) {
        const a = Math.PI / 2 - (k * 2 * Math.PI) / nn;
        ring.push([x + R * Math.cos(a), R * Math.sin(a)]);
      }
      const apex = [x, H, 0],
        ids = [];
      const disc = mkFace(
        M,
        ring
          .slice()
          .reverse()
          .map(([a, b]) => [a, hb, b]),
        { edge: ring.map(() => 'auto'), art: { kind: 'leafFlat', pal: p }, name: 'Pine base' }
      );
      ids.push(disc);
      for (let k = 0; k < nn; k++) {
        const a = ring[k],
          b = ring[(k + 1) % nn];
        ids.push(
          mkFace(M, [[a[0], hb, a[1]], [b[0], hb, b[1]], apex], {
            edge: ['auto', 'auto', 'auto'],
            art: { kind: 'pineSide', pal: p },
            name: 'Pine'
          })
        );
      }
      M.groups.push({ title: `Pine ${i + 1} base`, faces: [disc] });
      const tr = ids.slice(1);
      M.groups.push({
        title: `Pine ${i + 1}`,
        faces: tr,
        pref: 'chain',
        check: true,
        mid: [tr.slice(0, 4), tr.slice(4)]
      });
      const s = Math.max(0.6, H * 0.05),
        E = ['attach', 'auto', 'attach', 'auto'],
        ta = { kind: 'trunk', pal: p },
        q = [];
      q.push(
        wallFace(M, [x - s / 2, 0, s / 2], [1, 0, 0], rectP(0, 0, s, hb), { edge: E, art: ta, name: 'Trunk' })
      );
      q.push(
        wallFace(M, [x + s / 2, 0, s / 2], [0, 0, -1], rectP(0, 0, s, hb), {
          edge: E,
          art: ta,
          name: 'Trunk'
        })
      );
      q.push(
        wallFace(M, [x + s / 2, 0, -s / 2], [-1, 0, 0], rectP(0, 0, s, hb), {
          edge: E,
          art: ta,
          name: 'Trunk'
        })
      );
      q.push(
        wallFace(M, [x - s / 2, 0, -s / 2], [0, 0, 1], rectP(0, 0, s, hb), {
          edge: E,
          art: ta,
          name: 'Trunk'
        })
      );
      M.groups.push({ title: `Pine ${i + 1} trunk`, faces: q, pref: 'chain' });
    });
  } else if (K === 'bush' || K === 'hedge') {
    const len = K === 'hedge' ? L : Math.max(2, H * 0.9),
      dep = K === 'hedge' ? Math.max(2, Wd) : len,
      hh = H;
    const a = { kind: 'leafBox', pal: p };
    (K === 'hedge' ? [0] : row(len + 2)).forEach((x, i) => {
      const F = boxFaces(
        M,
        x - len / 2,
        x + len / 2,
        0,
        hh,
        -dep / 2,
        dep / 2,
        { front: a, back: a, left: a, right: a, top: a },
        false,
        { front: 'Front', back: 'Back', left: 'End', right: 'End', top: 'Top' }
      );
      M.groups.push({
        title: K === 'hedge' ? 'Hedgerow' : `Bush ${i + 1}`,
        faces: [F.front, F.right, F.back, F.left, F.top],
        pref: 'chain',
        check: true,
        mid: [[F.front, F.top, F.back], [F.left], [F.right]]
      });
    });
  } else if (K === 'fence') {
    const len = L,
      pw = 0.3,
      gap = 0.22,
      hh = H,
      solid = Math.min(hh * 0.7, hh - 0.8);
    const top = [];
    let x = len;
    const cnt = Math.max(2, Math.round(len / (pw + gap)));
    const step = len / cnt;
    for (let k = 0; k < cnt; k++) {
      const x1 = len - k * step,
        x0 = x1 - Math.min(pw, step * 0.6);
      if (k > 0) top.push([x1, solid]);
      top.push([x1, hh - 0.3], [(x0 + x1) / 2, hh], [x0, hh - 0.3]);
      if (k < cnt - 1) top.push([x0, solid]);
    }
    const polyF = [[0, 0], [len, 0], ...top].map(([a, b]) => [a - len / 2, b]);
    foldPair(
      M,
      [0, 0, 0],
      [1, 0, 0],
      polyF,
      { art: { kind: 'fence', pal: p, solid, step, pw: Math.min(pw, step * 0.6), len }, name: 'Fence' },
      'Picket fence'
    );
  } else if (GROUND[K]) groundModel(M, K, p);
  else if (K === 'pond') pondModel(M, p);
  else if (K === 'rocks') boulderModel(M, p);
  else if (K === 'wall') stoneWallModel(M, p);
  else if (K === 'train') trainModel(M, p);
  else if (K === 'lamp' || K === 'hydrant' || K === 'mailbox') {
    row(4).forEach((x, i) => {
      if (K === 'lamp') {
        const s = 0.45,
          h = Math.max(6, H),
          E = ['attach', 'auto', 'attach', 'auto'],
          art = { kind: 'lampPost', pal: p },
          q = [];
        q.push(
          wallFace(M, [x - s / 2, 0, s / 2], [1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x + s / 2, 0, s / 2], [0, 0, -1], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x + s / 2, 0, -s / 2], [-1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x - s / 2, 0, -s / 2], [0, 0, 1], rectP(0, 0, s, h), { edge: E, art, name: 'Post' })
        );
        M.groups.push({ title: `Lamp ${i + 1} post`, faces: q, pref: 'chain' });
        const la = { kind: 'lantern', pal: p };
        const Bx = boxFaces(
          M,
          x - 0.7,
          x + 0.7,
          h,
          h + 2,
          -0.7,
          0.7,
          {
            bottom: { kind: 'lampPost', pal: p },
            front: la,
            back: la,
            left: la,
            right: la,
            top: { kind: 'lampPost', pal: p }
          },
          true,
          {}
        );
        M.groups.push({
          title: `Lamp ${i + 1} lantern`,
          faces: [Bx.bottom, Bx.front, Bx.right, Bx.back, Bx.left, Bx.top],
          pref: 'root',
          check: true
        });
      } else if (K === 'hydrant') {
        const r = 0.45,
          h = 2.4,
          nn = 8,
          ring = [];
        for (let k = 0; k < nn; k++) {
          const a = Math.PI / 2 - (k * 2 * Math.PI) / nn;
          ring.push([x + r * Math.cos(a), r * Math.sin(a)]);
        }
        const w = [];
        for (let k = 0; k < nn; k++) {
          const a = ring[k],
            b = ring[(k + 1) % nn],
            ww = Math.hypot(b[0] - a[0], b[1] - a[1]);
          w.push(
            wallFace(M, [a[0], 0, a[1]], [(b[0] - a[0]) / ww, 0, (b[1] - a[1]) / ww], rectP(0, 0, ww, h), {
              edge: ['attach', 'auto', 'auto', 'auto'],
              art: { kind: 'hydrant', pal: p, k },
              name: 'Hydrant'
            })
          );
        }
        M.groups.push({ title: `Hydrant ${i + 1}`, faces: w, pref: 'chain' });
        const cap = [];
        for (let k = 0; k < nn; k++) {
          const a = ring[k],
            b = ring[(k + 1) % nn];
          cap.push(
            mkFace(
              M,
              [
                [a[0], h, a[1]],
                [b[0], h, b[1]],
                [x, h + 0.55, 0]
              ],
              { edge: ['auto', 'auto', 'auto'], art: { kind: 'hydrantCap', pal: p }, name: 'Cap' }
            )
          );
        }
        M.groups.push({ title: `Hydrant ${i + 1} cap`, faces: cap, pref: 'chain', check: true });
      } else {
        const s = 0.35,
          h = 3.3,
          E = ['attach', 'auto', 'attach', 'auto'],
          art = { kind: 'trunk', pal: p },
          q = [];
        q.push(
          wallFace(M, [x - s / 2, 0, s / 2], [1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x + s / 2, 0, s / 2], [0, 0, -1], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x + s / 2, 0, -s / 2], [-1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name: 'Post' }),
          wallFace(M, [x - s / 2, 0, -s / 2], [0, 0, 1], rectP(0, 0, s, h), { edge: E, art, name: 'Post' })
        );
        M.groups.push({ title: `Mailbox ${i + 1} post`, faces: q, pref: 'chain' });
        const ma = { kind: 'mailbox', pal: p };
        const Bx = boxFaces(
          M,
          x - 0.45,
          x + 0.45,
          h,
          h + 0.9,
          -0.9,
          0.9,
          { bottom: ma, front: { kind: 'mailboxEnd', pal: p }, back: ma, left: ma, right: ma, top: ma },
          true,
          {}
        );
        M.groups.push({
          title: `Mailbox ${i + 1}`,
          faces: [Bx.bottom, Bx.front, Bx.right, Bx.back, Bx.left, Bx.top],
          pref: 'root',
          check: true
        });
      }
    });
  } else if (K === 'car') {
    row(20).forEach((x, i) => {
      const L2 = 7.5,
        W2 = 3,
        hb = 2.7,
        yt = 4.5,
        col = [S.accentColor, '#2a4a7a', '#e6e3da', '#3b3f44', '#7a8a3a'][i % 5];
      const cp = Object.assign({}, p, {
        accent: p.L ? '#ffffff' : col,
        accentLine: p.L ? '#222222' : shade(col, -0.4)
      });
      const a = r => ({ kind: 'carBody', pal: cp, role: r });
      const Bd = boxFaces(
        M,
        x - L2,
        x + L2,
        0,
        hb,
        -W2,
        W2,
        { front: a('side'), back: a('side'), left: a('rear'), right: a('nose'), top: a('hood') },
        false,
        { front: 'Body side', back: 'Body side', left: 'Rear', right: 'Nose', top: 'Hood' }
      );
      M.groups.push({
        title: `Car ${i + 1} body`,
        faces: [Bd.top, Bd.front, Bd.right, Bd.back, Bd.left],
        pref: 'root',
        check: true,
        mid: [[Bd.top, Bd.right, Bd.left], [Bd.front], [Bd.back]]
      });
      const xa0 = x - 4.4,
        xa1 = x + 3.2,
        xb0 = x - 3.2,
        xb1 = x + 1.4,
        z1 = W2 - 0.3,
        z0 = -W2 + 0.3,
        g = { kind: 'carGlass', pal: cp },
        rf = { kind: 'carRoof', pal: cp };
      const s1 = mkFace(
        M,
        [
          [xa0, hb, z1],
          [xa1, hb, z1],
          [xb1, yt, z1],
          [xb0, yt, z1]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: g, name: 'Cabin side' }
      );
      const ws = mkFace(
        M,
        [
          [xa1, hb, z1],
          [xa1, hb, z0],
          [xb1, yt, z0],
          [xb1, yt, z1]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: g, name: 'Windshield' }
      );
      const s0 = mkFace(
        M,
        [
          [xa1, hb, z0],
          [xa0, hb, z0],
          [xb0, yt, z0],
          [xb1, yt, z0]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: g, name: 'Cabin side' }
      );
      const rw = mkFace(
        M,
        [
          [xa0, hb, z0],
          [xa0, hb, z1],
          [xb0, yt, z1],
          [xb0, yt, z0]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: g, name: 'Rear window' }
      );
      const top = mkFace(
        M,
        [
          [xb0, yt, z1],
          [xb1, yt, z1],
          [xb1, yt, z0],
          [xb0, yt, z0]
        ],
        { edge: ['auto', 'auto', 'auto', 'auto'], art: rf, name: 'Roof' }
      );
      M.groups.push({ title: `Car ${i + 1} cabin`, faces: [top, s1, ws, s0, rw], pref: 'root', check: true });
    });
  }
  M.maxH = Math.max(4, H);
}

export function tube(M, x, z, y0, h, s, art, name) {
  const E = ['attach', 'auto', 'attach', 'auto'],
    q = [];
  q.push(
    wallFace(M, [x - s / 2, y0, z + s / 2], [1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [x + s / 2, y0, z + s / 2], [0, 0, -1], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [x + s / 2, y0, z - s / 2], [-1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [x - s / 2, y0, z - s / 2], [0, 0, 1], rectP(0, 0, s, h), { edge: E, art, name })
  );
  return q;
}
