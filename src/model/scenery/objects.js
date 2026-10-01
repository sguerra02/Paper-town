/* Scenery objects built from simple boxes: tents, garden beds, benches, fences, lamps and more. */
import { S } from '../../config/state.js';
import { rectP } from '../../lib/geometry.js';
import { clamp } from '../../lib/math.js';
import { boxFaces, mkFace, wallFace } from '../faces.js';
import { colorsFromS, makePal } from '../palette.js';
import { tube } from './index.js';

export function sceneryModel2(M, K, p0) {
  const p = Object.assign({}, p0, {
      trim: p0.white,
      trimLine: '#9a9a9a',
      accent: p0.L ? '#ffffff' : '#f4f4f2',
      accentLine: '#9a9a9a'
    }),
    pc = p0;
  const n = clamp(Math.round(S.scCount), 1, 12),
    H = S.scH,
    L = S.scL,
    Wd = S.scW;
  const row = sp => {
    const xs = [];
    for (let i = 0; i < n; i++) xs.push((i - (n - 1) / 2) * sp);
    return xs;
  };
  if (K === 'gazebo') {
    const R = Math.max(4, Wd / 2),
      nn = 8,
      fh = 1.5,
      ph = Math.max(6, H),
      ring = r => {
        const o = [];
        for (let k = 0; k < nn; k++) {
          const a = Math.PI / 2 + Math.PI / 8 - (k * 2 * Math.PI) / nn;
          o.push([r * Math.cos(a), r * Math.sin(a)]);
        }
        return o;
      };
    const rg = ring(R),
      sk = [];
    for (let k = 0; k < nn; k++) {
      const a = rg[k],
        b = rg[(k + 1) % nn],
        w = Math.hypot(b[0] - a[0], b[1] - a[1]);
      sk.push(
        wallFace(M, [a[0], 0, a[1]], [(b[0] - a[0]) / w, 0, (b[1] - a[1]) / w], rectP(0, 0, w, fh), {
          edge: ['attach', 'auto', 'auto', 'auto'],
          art: { kind: 'lattice', pal: p },
          name: 'Skirt'
        })
      );
    }
    const deck = mkFace(
      M,
      rg.map(([x, z]) => [x, fh, z]),
      { edge: rg.map(() => 'auto'), art: { kind: 'deckBoards', pal: p }, name: 'Floor' }
    );
    M.groups.push({
      title: 'Gazebo floor',
      faces: [deck, ...sk],
      pref: 'root',
      check: true,
      mid: [[deck], sk.slice(0, 4), sk.slice(4)]
    });
    const pr = ring(R - 0.5);
    pr.forEach(([x, z], k) =>
      M.groups.push({
        title: `Gazebo post ${k + 1}`,
        faces: tube(M, x, z, fh, ph, 0.45, { kind: 'post', pal: p }, 'Post'),
        pref: 'chain'
      })
    );
    const rails = [];
    for (let k = 1; k < nn; k++) {
      const a = pr[k],
        b = pr[(k + 1) % nn],
        w = Math.hypot(b[0] - a[0], b[1] - a[1]),
        u = [(b[0] - a[0]) / w, 0, (b[1] - a[1]) / w];
      rails.push(
        wallFace(M, [a[0] + u[0] * 0.22, fh, a[1] + u[2] * 0.22], u, rectP(0, 0, w - 0.44, 3), {
          edge: ['attach', 'attach', 'free', 'attach'],
          art: { kind: 'railing', pal: p },
          name: 'Railing'
        })
      );
    }
    rails.forEach((r, k) => M.groups.push({ title: `Railing ${k + 1}`, faces: [r] }));
    const rr = ring(R + 1),
      y = fh + ph,
      apex = [0, y + R * 0.75, 0],
      tri = [];
    for (let k = 0; k < nn; k++) {
      const a = rr[k],
        b = rr[(k + 1) % nn];
      tri.push(
        mkFace(M, [[a[0], y, a[1]], [b[0], y, b[1]], apex], {
          edge: ['free', 'auto', 'auto'],
          tag: ['eave', 'hip', 'hip'],
          art: { kind: 'roof', finish: S.roofFinish, pal: makePal(colorsFromS()) },
          name: 'Gazebo roof'
        })
      );
    }
    M.groups.push({
      title: 'Gazebo roof',
      faces: tri,
      pref: 'chain',
      check: true,
      mid: [tri.slice(0, 4), tri.slice(4)]
    });
    M.maxH = y;
    return true;
  }
  if (K === 'tentA') {
    const Lt = Math.max(4, L),
      Wt = Math.max(3, Wd),
      Ht = Math.max(2, H);
    row(Wt + 3).forEach((x, i) => {
      const a = { kind: 'tent', pal: pc };
      const s1 = mkFace(
        M,
        [
          [x - Lt / 2, 0, Wt / 2],
          [x + Lt / 2, 0, Wt / 2],
          [x + Lt / 2, Ht, 0],
          [x - Lt / 2, Ht, 0]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: a, name: 'Tent side' }
      );
      const s2 = mkFace(
        M,
        [
          [x + Lt / 2, 0, -Wt / 2],
          [x - Lt / 2, 0, -Wt / 2],
          [x - Lt / 2, Ht, 0],
          [x + Lt / 2, Ht, 0]
        ],
        { edge: ['attach', 'auto', 'auto', 'auto'], art: a, name: 'Tent side' }
      );
      const fr = mkFace(
        M,
        [
          [x + Lt / 2, 0, Wt / 2],
          [x + Lt / 2, 0, -Wt / 2],
          [x + Lt / 2, Ht, 0]
        ],
        { edge: ['attach', 'auto', 'auto'], art: { kind: 'tentEnd', pal: pc, door: true }, name: 'Tent door' }
      );
      const bk = mkFace(
        M,
        [
          [x - Lt / 2, 0, -Wt / 2],
          [x - Lt / 2, 0, Wt / 2],
          [x - Lt / 2, Ht, 0]
        ],
        { edge: ['attach', 'auto', 'auto'], art: { kind: 'tentEnd', pal: pc }, name: 'Tent back' }
      );
      M.groups.push({ title: `Tent ${i + 1}`, faces: [s1, s2, fr, bk], pref: 'root', check: true });
    });
    M.maxH = H;
    return true;
  }
  if (K === 'tentParty') {
    const Wt = Math.max(8, Wd),
      ph = Math.max(6, H),
      hw = Wt / 2,
      y = ph,
      apex = [0, y + Wt * 0.28, 0],
      c4 = [
        [-hw, hw],
        [hw, hw],
        [hw, -hw],
        [-hw, -hw]
      ];
    const tri = [],
      val = [];
    for (let k = 0; k < 4; k++) {
      const a = c4[k],
        b = c4[(k + 1) % 4];
      tri.push(
        mkFace(M, [[a[0], y, a[1]], [b[0], y, b[1]], apex], {
          edge: ['auto', 'auto', 'auto'],
          art: { kind: 'tentRoof', pal: pc, k },
          name: 'Canopy'
        })
      );
      val.push(
        mkFace(
          M,
          [
            [a[0], y - 1.2, a[1]],
            [b[0], y - 1.2, b[1]],
            [b[0], y, b[1]],
            [a[0], y, a[1]]
          ],
          { edge: ['free', 'auto', 'auto', 'auto'], art: { kind: 'valance', pal: pc }, name: 'Valance' }
        )
      );
    }
    M.groups.push({
      title: 'Party tent canopy',
      faces: [...tri, ...val],
      pref: 'chain',
      check: true,
      mid: [tri.slice(0, 2), tri.slice(2), val.slice(0, 2), val.slice(2)]
    });
    c4.forEach(([x, z], k) =>
      M.groups.push({
        title: `Tent pole ${k + 1}`,
        faces: tube(
          M,
          x - Math.sign(x) * 0.25,
          z - Math.sign(z) * 0.25,
          0,
          y - 1.2,
          0.35,
          { kind: 'post', pal: p },
          'Pole'
        ),
        pref: 'chain'
      })
    );
    M.maxH = y;
    return true;
  }
  if (K === 'beds') {
    const Lb = Math.max(3, L),
      Wb = Math.max(2, Wd),
      hb = Math.max(0.6, H);
    row(Wb + 2).forEach((x, i) => {
      const a = { kind: 'bedSide', pal: pc };
      const F = boxFaces(
        M,
        x - Wb / 2,
        x + Wb / 2,
        0,
        hb,
        -Lb / 2,
        Lb / 2,
        { front: a, back: a, left: a, right: a, top: { kind: 'bedSoil', pal: pc, seed: i } },
        false,
        { front: 'Bed side', back: 'Bed side', left: 'Bed side', right: 'Bed side', top: 'Soil' }
      );
      M.groups.push({
        title: `Garden bed ${i + 1}`,
        faces: [F.top, F.front, F.right, F.back, F.left],
        pref: 'root',
        check: true,
        mid: [[F.top, F.front, F.back], [F.left], [F.right]]
      });
    });
    M.maxH = H;
    return true;
  }
  return false;
}
