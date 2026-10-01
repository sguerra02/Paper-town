/* Artwork for ponds, rocks, stone walls and trains. */
import { poly, txt } from '../../lib/draw.js';
import { bbox, circ, clipAll, inPoly, insetPoly, rectP } from '../../lib/geometry.js';
import { rng } from '../../lib/math.js';
import { clipPolyRect } from '../../print/split.js';

export function sceneryArt3(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    rnd = rng(f.id * 41 + 9),
    it = [],
    L = c.L,
    W = bb.x1 - bb.x0,
    H = bb.y1 - bb.y0;
  switch (A.kind) {
    case 'pond': {
      it.push(poly(P, { fill: L ? '#ffffff' : '#cdb88f', stroke: L ? '#999999' : null, w: 0.2 }));
      const inner = insetPoly(P, Math.min(1.4, W * 0.08));
      it.push(poly(inner, { fill: L ? '#ffffff' : '#3d7fa6', stroke: L ? '#777777' : '#2d5f7e', w: 0.35 }));
      const wv = [];
      for (let k = 0; k < Math.round(W * H * 0.25); k++) {
        const x = bb.x0 + rnd() * W,
          y = bb.y0 + rnd() * H;
        if (!inPoly([x, y], inner)) continue;
        wv.push(
          [
            [x, y],
            [x + 0.4, y + 0.1]
          ],
          [
            [x + 0.4, y + 0.1],
            [x + 0.8, y]
          ]
        );
      }
      it.push({ t: 'segs', s: wv, stroke: L ? '#9a9a9a' : '#9cc8e0', w: 0.45 });
      for (let i = 0; i < P.length; i += 2) {
        const a = P[i],
          b = inner[i];
        const x = (a[0] + b[0]) / 2,
          y = (a[1] + b[1]) / 2;
        it.push(
          poly(circ(x, y, 0.35 + rnd() * 0.3, 7), {
            fill: L ? '#ffffff' : ['#8a8580', '#a39e96', '#76716b'][i % 3],
            stroke: L ? '#888888' : null,
            w: 0.2
          })
        );
      }
      [0.25, 0.6].forEach(t => {
        const x = bb.x0 + W * t,
          y = bb.y0 + H * (0.35 + t * 0.3);
        if (inPoly([x, y], inner))
          it.push(
            poly(circ(x, y, 0.9, 10), { fill: L ? '#ffffff' : '#5f8a3a' }),
            poly(circ(x + 0.3, y + 0.1, 0.25, 6), { fill: L ? '#ffffff' : '#f2e6f0' })
          );
      });
      return it;
    }
    case 'rock': {
      it.push(
        poly(P, {
          fill: L ? '#ffffff' : ['#8f8a82', '#9a958c', '#85807a'][f.id % 3],
          stroke: L ? '#777777' : '#6a655f',
          w: 0.3
        })
      );
      const s = [];
      for (let k = 0; k < 3; k++) {
        const x = bb.x0 + rnd() * W,
          y = bb.y0 + rnd() * H;
        s.push([
          [x, y],
          [x + (rnd() - 0.5) * W * 0.4, y + (rnd() - 0.5) * H * 0.4]
        ]);
      }
      it.push({ t: 'segs', s: clipAll(s, P), stroke: L ? '#999999' : '#6a655f', w: 0.35 });
      for (let k = 0; k < Math.round(W * H * 0.6); k++) {
        const x = bb.x0 + rnd() * W,
          y = bb.y0 + rnd() * H;
        if (inPoly([x, y], P)) it.push(poly(circ(x, y, 0.08, 5), { fill: L ? '#ffffff' : '#b4aea4' }));
      }
      return it;
    }
    case 'stoneWall': {
      it.push(poly(P, { fill: L ? '#ffffff' : '#8f8a80' }));
      let y = bb.y0;
      while (y < bb.y1) {
        const ch = 0.5 + rnd() * 0.35;
        let x = bb.x0 + rnd() * 0.5 - 0.5;
        while (x < bb.x1) {
          const w = 0.7 + rnd() * 1.1;
          const q = clipPolyRect(
            [
              [x + 0.06, y + 0.06],
              [x + w - 0.06, y + 0.06],
              [x + w - 0.03, y + ch * 0.5],
              [x + w - 0.06, y + ch - 0.06],
              [x + 0.06, y + ch - 0.06],
              [x + 0.03, y + ch * 0.5]
            ],
            { x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 }
          );
          if (q.length >= 3)
            it.push(
              poly(q, {
                fill: L ? '#ffffff' : ['#a39e94', '#948f86', '#b1aca2', '#8a857c'][Math.floor(rnd() * 4)],
                stroke: L ? '#999999' : '#6a655f',
                w: 0.2
              })
            );
          x += w;
        }
        y += ch;
      }
      return it;
    }
    case 'stoneTop':
      it.push(poly(P, { fill: L ? '#ffffff' : '#7f7a72', stroke: '#6a655f', w: 0.25 }));
      return it;
    case 'trainFrame': {
      it.push(poly(P, { fill: L ? '#ffffff' : '#2a2b2d', stroke: '#111111', w: 0.3 }));
      [bb.x0 + W * 0.14, bb.x1 - W * 0.14].forEach(cx => {
        it.push(
          poly(rectP(cx - 3.2, bb.y0 + 0.1, 6.4, H * 0.55), {
            fill: L ? '#ffffff' : '#3a3b3e',
            stroke: '#111111',
            w: 0.25
          })
        );
        [cx - 1.8, cx + 1.8].forEach(wx =>
          it.push(
            poly(circ(wx, bb.y0 + 0.9, 0.85, 14), {
              fill: L ? '#ffffff' : '#1a1a1c',
              stroke: '#555555',
              w: 0.3
            }),
            poly(circ(wx, bb.y0 + 0.9, 0.3, 8), { fill: L ? '#ffffff' : '#8a8f93' })
          )
        );
      });
      return it;
    }
    case 'trainEnd':
      it.push(
        poly(P, { fill: L ? '#ffffff' : '#2a2b2d', stroke: '#111111', w: 0.3 }),
        poly(rectP((bb.x0 + bb.x1) / 2 - 0.6, bb.y0 + 0.4, 1.2, 1), {
          fill: L ? '#ffffff' : '#55585c',
          stroke: '#111111',
          w: 0.25
        })
      );
      return it;
    case 'trainDeck':
      it.push(poly(P, { fill: L ? '#ffffff' : '#3a3b3e', stroke: '#111111', w: 0.25 }));
      return it;
    case 'trainBody':
      return trainBodyArt(f, A, c, P, bb, W, H, L, rnd);
  }
  return it;
}

export function trainBodyArt(f, A, c, P, bb, W, H, L, rnd) {
  const it = [poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.3 })],
    r = A.role,
    cx = (bb.x0 + bb.x1) / 2,
    g = c.glass,
    gl = c.glassLine,
    white = L ? '#222222' : '#f4f1e6';
  const win = (x, y, w, h) =>
    it.push(poly(rectP(x, y, w, h), { fill: L ? '#ffffff' : g, stroke: L ? '#222222' : gl, w: 0.25 }));
  const lab = (s, x, y, sz, fill) =>
    it.push(txt(s, x, y, { sizeFt: sz, anchor: 'middle', bold: true, fill: fill || white }));
  if (r === 'hood') {
    it.push(
      poly(rectP(bb.x0, bb.y0 + H * 0.35, W, 0.9), {
        fill: L ? '#ffffff' : '#f2c200',
        stroke: c.accentLine,
        w: 0.2
      })
    );
    const lv = [];
    for (let x = bb.x0 + 2; x < bb.x1 - 2; x += 3) {
      for (let y = bb.y0 + H * 0.55; y < bb.y1 - 0.6; y += 0.35)
        lv.push([
          [x, y],
          [x + 2, y]
        ]);
    }
    it.push({ t: 'segs', s: lv, stroke: c.accentLine, w: 0.25 });
    lab(String(A.num), cx, bb.y0 + H * 0.12, 1.2);
  } else if (r === 'cab') {
    win(bb.x0 + 1.5, bb.y0 + H * 0.58, W * 0.3, H * 0.26);
    win(bb.x1 - 1.5 - W * 0.3, bb.y0 + H * 0.58, W * 0.3, H * 0.26);
    it.push(poly(rectP(bb.x0, bb.y0 + H * 0.3, W, 0.9), { fill: L ? '#ffffff' : '#f2c200' }));
  } else if (r === 'cabFront') {
    win(bb.x0 + 0.8, bb.y0 + H * 0.58, W / 2 - 1.2, H * 0.26);
    win(cx + 0.4, bb.y0 + H * 0.58, W / 2 - 1.2, H * 0.26);
    it.push(
      poly(circ(cx, bb.y1 - 1, 0.4, 10), { fill: L ? '#ffffff' : '#fff6cc', stroke: '#222222', w: 0.2 })
    );
  } else if (r === 'noseFront') {
    it.push(
      poly(circ(cx - 1.6, bb.y0 + H * 0.6, 0.35, 10), {
        fill: L ? '#ffffff' : '#fff6cc',
        stroke: '#222222',
        w: 0.2
      }),
      poly(circ(cx + 1.6, bb.y0 + H * 0.6, 0.35, 10), {
        fill: L ? '#ffffff' : '#fff6cc',
        stroke: '#222222',
        w: 0.2
      })
    );
    const st = [];
    for (let x = bb.x0; x < bb.x1 + H; x += 1)
      st.push([
        [x, bb.y0],
        [x - H * 0.5, bb.y0 + H * 0.4]
      ]);
    it.push({ t: 'segs', s: clipAll(st, P), stroke: L ? '#222222' : '#f2c200', w: 1.2 });
  } else if (r === 'boxSide') {
    const rb = [];
    for (let x = bb.x0 + 1.2; x < bb.x1; x += 1.4)
      rb.push([
        [x, bb.y0],
        [x, bb.y1]
      ]);
    it.push({ t: 'segs', s: rb, stroke: c.accentLine, w: 0.35 });
    const dw = Math.min(8, W * 0.22);
    it.push(
      poly(rectP(cx - dw / 2, bb.y0 + 0.2, dw, H - 0.6), { fill: c.accent, stroke: c.accentLine, w: 0.4 })
    );
    const xb = [];
    for (let x = cx - dw / 2 + 1; x < cx + dw / 2; x += 2)
      xb.push([
        [x, bb.y0 + 0.2],
        [x, bb.y1 - 0.4]
      ]);
    it.push({ t: 'segs', s: xb, stroke: c.accentLine, w: 0.3 });
    lab('GC&W', bb.x0 + W * 0.2, bb.y0 + H * 0.62, 1.1);
    lab(String(A.num), bb.x0 + W * 0.2, bb.y0 + H * 0.45, 0.9);
    lab('SCALE FREIGHT', bb.x1 - W * 0.2, bb.y0 + H * 0.55, 0.7);
  } else if (r === 'boxRoof' || r === 'hopTop') {
    const s = [];
    for (let x = bb.x0 + 1.2; x < bb.x1; x += 1.4)
      s.push([
        [x, bb.y0],
        [x, bb.y1]
      ]);
    it.push({ t: 'segs', s, stroke: c.accentLine, w: 0.3 });
    if (r === 'boxRoof')
      it.push(
        poly(rectP(bb.x0, (bb.y0 + bb.y1) / 2 - 0.4, W, 0.8), {
          fill: L ? '#ffffff' : '#5a4332',
          stroke: '#222222',
          w: 0.2
        })
      );
    else {
      for (let x = bb.x0 + 2; x < bb.x1 - 3; x += 5)
        it.push(
          poly(rectP(x, bb.y0 + 1, 3.4, H - 2), {
            fill: L ? '#ffffff' : '#2a2b2d',
            stroke: '#111111',
            w: 0.2
          })
        );
    }
  } else if (r === 'hopSide') {
    const rb = [];
    for (let x = bb.x0 + 2; x < bb.x1; x += 3)
      rb.push([
        [x, bb.y0],
        [x, bb.y1]
      ]);
    it.push({ t: 'segs', s: rb, stroke: c.accentLine, w: 0.5 });
    it.push(
      poly(
        [
          [bb.x0 + 2, bb.y0],
          [bb.x0 + 6, bb.y0],
          [bb.x0 + 8, bb.y0 + 2.5],
          [bb.x0 + 0.5, bb.y0 + 2.5]
        ],
        { fill: c.accentLine }
      ),
      poly(
        [
          [bb.x1 - 6, bb.y0],
          [bb.x1 - 2, bb.y0],
          [bb.x1 - 0.5, bb.y0 + 2.5],
          [bb.x1 - 8, bb.y0 + 2.5]
        ],
        { fill: c.accentLine }
      )
    );
    lab('GC&W ' + A.num, cx, bb.y0 + H * 0.6, 1);
  } else if (r === 'tank') {
    it.push(
      poly(rectP(bb.x0 + W * 0.2, bb.y0, 0.4, H), { fill: c.accentLine }),
      poly(rectP(bb.x1 - W * 0.2, bb.y0, 0.4, H), { fill: c.accentLine })
    );
    if (f.id % 12 === 3) lab('GC&W ' + A.num, cx, bb.y0 + H * 0.2, Math.min(0.9, H * 0.5));
  } else if (r === 'tankEnd') {
    it.push(poly(insetPoly(P, 0.4), { fill: c.accent, stroke: c.accentLine, w: 0.3 }));
  } else if (r === 'cabooseSide') {
    [0.2, 0.4, 0.6, 0.8].forEach(t => win(bb.x0 + W * t - 1, bb.y0 + H * 0.5, 2, 2.2));
    lab('GC&W', cx, bb.y0 + H * 0.2, 1);
    it.push(poly(rectP(bb.x0, bb.y1 - 0.8, W, 0.4), { fill: L ? '#ffffff' : '#f2c200' }));
  } else if (r === 'cabooseEnd') {
    it.push(poly(rectP(cx - 1.4, bb.y0, 2.8, H * 0.72), { fill: c.accentLine, stroke: '#111111', w: 0.25 }));
    win(cx - 1, bb.y0 + H * 0.42, 2, H * 0.22);
  } else if (r === 'cupola') {
    win(bb.x0 + W * 0.2, bb.y0 + H * 0.35, W * 0.6, H * 0.4);
  } else if (r === 'boxEnd' || r === 'hoodEnd' || r === 'cabEnd') {
    const l = [];
    for (let y = bb.y0 + 1; y < bb.y1; y += 1.5)
      l.push([
        [bb.x0, y],
        [bb.x1, y]
      ]);
    it.push({ t: 'segs', s: l, stroke: c.accentLine, w: 0.3 });
  }
  return it;
}
