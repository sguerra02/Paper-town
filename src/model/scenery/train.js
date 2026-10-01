/* Locomotive and freight cars. */
import { S } from '../../config/state.js';
import { clamp, shade } from '../../lib/math.js';
import { boxFaces, mkFace } from '../faces.js';
import { outward } from './ground.js';

/* trains */
export function trainModel(M, p) {
  const n = clamp(Math.round(S.scCount), 0, 8),
    seq = ['loco'];
  for (let i = 0; i < n; i++)
    seq.push(i === n - 1 && n >= 2 ? 'caboose' : ['box', 'tank', 'box', 'hopper'][i % 4]);
  const LEN = { loco: 48, box: 40, tank: 36, caboose: 30, hopper: 34 };
  const total = seq.reduce((a, k) => a + LEN[k] + 2, 0);
  let x = total / 2;
  const tp = col =>
    Object.assign({}, p, { accent: p.L ? '#ffffff' : col, accentLine: p.L ? '#222222' : shade(col, -0.4) });
  seq.forEach((k, i) => {
    const L = LEN[k],
      x1 = x,
      x0 = x - L;
    x -= L + 2;
    const col = {
      loco: S.accentColor,
      box: ['#8a3b2a', '#6b4a2f', '#3f5a6b'][i % 3],
      tank: '#2b2d30',
      caboose: '#b3282d',
      hopper: '#5a5e62'
    }[k];
    const q = tp(col),
      nm =
        { loco: 'Locomotive', box: 'Boxcar', tank: 'Tank car', caboose: 'Caboose', hopper: 'Hopper' }[k] +
        (i ? ` ${i}` : '');
    const fr = { kind: 'trainFrame', pal: q };
    const Fr = boxFaces(
      M,
      x0 + 1,
      x1 - 1,
      1.2,
      3.4,
      -4.4,
      4.4,
      {
        front: fr,
        back: fr,
        left: { kind: 'trainEnd', pal: q },
        right: { kind: 'trainEnd', pal: q },
        top: { kind: 'trainDeck', pal: q }
      },
      false,
      { front: 'Frame', back: 'Frame', left: 'Frame end', right: 'Frame end', top: 'Deck' }
    );
    M.groups.push({
      title: nm + ' frame',
      faces: [Fr.top, Fr.front, Fr.back, Fr.left, Fr.right],
      pref: 'root',
      check: true,
      mid: [[Fr.top, Fr.front, Fr.back], [Fr.left], [Fr.right]]
    });
    const box = (a0, a1, y0, y1, hw, arts, title) => {
      const B = boxFaces(M, a0, a1, y0, y1, -hw, hw, arts, false, {});
      M.groups.push({
        title,
        faces: [B.front, B.top, B.back, B.left, B.right],
        pref: 'root',
        check: true,
        mid: [[B.front, B.top, B.back], [B.left], [B.right]]
      });
    };
    const A = role => ({ kind: 'trainBody', pal: q, role, car: k, num: 4012 + i * 37 });
    if (k === 'loco') {
      box(
        x0 + 2,
        x1 - 13,
        3.4,
        12.2,
        3.8,
        { front: A('hood'), back: A('hood'), left: A('hoodEnd'), right: A('hoodEnd'), top: A('hoodTop') },
        nm + ' hood'
      );
      box(
        x1 - 13,
        x1 - 3,
        3.4,
        14.6,
        4.6,
        { front: A('cab'), back: A('cab'), left: A('cabEnd'), right: A('cabFront'), top: A('roof') },
        nm + ' cab'
      );
      box(
        x1 - 3,
        x1 - 0.5,
        3.4,
        8,
        3.2,
        { front: A('nose'), back: A('nose'), left: A('nose'), right: A('noseFront'), top: A('roof') },
        nm + ' nose'
      );
    } else if (k === 'box')
      box(
        x0 + 1,
        x1 - 1,
        3.4,
        15,
        5,
        { front: A('boxSide'), back: A('boxSide'), left: A('boxEnd'), right: A('boxEnd'), top: A('boxRoof') },
        nm + ' body'
      );
    else if (k === 'hopper')
      box(
        x0 + 1.5,
        x1 - 1.5,
        3.4,
        13,
        5,
        { front: A('hopSide'), back: A('hopSide'), left: A('boxEnd'), right: A('boxEnd'), top: A('hopTop') },
        nm + ' body'
      );
    else if (k === 'caboose') {
      box(
        x0 + 2,
        x1 - 2,
        3.4,
        13,
        4.6,
        {
          front: A('cabooseSide'),
          back: A('cabooseSide'),
          left: A('cabooseEnd'),
          right: A('cabooseEnd'),
          top: A('roof')
        },
        nm + ' body'
      );
      box(
        (x0 + x1) / 2 - 4,
        (x0 + x1) / 2 + 4,
        13,
        17,
        4,
        { front: A('cupola'), back: A('cupola'), left: A('cupola'), right: A('cupola'), top: A('roof') },
        nm + ' cupola'
      );
    } else {
      const R = 4.6,
        yc = 3.6 + R,
        nn = 12,
        ring = [];
      for (let j = 0; j < nn; j++) {
        const a = (j / nn) * Math.PI * 2;
        ring.push([yc + R * Math.cos(a), R * Math.sin(a)]);
      }
      const sides = [];
      for (let j = 0; j < nn; j++) {
        const a = ring[j],
          b = ring[(j + 1) % nn],
          mid = [0, (a[0] + b[0]) / 2 - yc, (a[1] + b[1]) / 2];
        sides.push(
          mkFace(
            M,
            outward(
              [
                [x0 + 2, a[0], a[1]],
                [x1 - 2, a[0], a[1]],
                [x1 - 2, b[0], b[1]],
                [x0 + 2, b[0], b[1]]
              ],
              mid
            ),
            { edge: ['auto', 'auto', 'auto', 'auto'], art: A('tank'), name: 'Tank' }
          )
        );
      }
      const c0 = mkFace(
        M,
        outward(
          ring.map(([y, z]) => [x0 + 2, y, z]),
          [-1, 0, 0]
        ),
        { edge: ring.map(() => 'auto'), art: A('tankEnd'), name: 'Tank end' }
      );
      const c1 = mkFace(
        M,
        outward(
          ring.map(([y, z]) => [x1 - 2, y, z]),
          [1, 0, 0]
        ),
        { edge: ring.map(() => 'auto'), art: A('tankEnd'), name: 'Tank end' }
      );
      M.groups.push({
        title: nm + ' tank',
        faces: sides,
        pref: 'chain',
        check: true,
        mid: [sides.slice(0, 6), sides.slice(6)]
      });
      M.groups.push({ title: nm + ' tank ends', faces: [c0] });
      M.groups.push({ title: nm + ' tank ends', faces: [c1] });
    }
  });
  M.maxH = 17;
}
