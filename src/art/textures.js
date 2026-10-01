/* Wall and roof surface textures: siding, brick, shingles, half-timber and more. */
import { poly, txt } from '../lib/draw.js';
import { bbox, clipAll, clipConvex, edgeBand, rectP } from '../lib/geometry.js';
import { rng, shade } from '../lib/math.js';

export function wallTexture(fin, P, F, rnd) {
  const bb = bbox(P),
    raw = [];
  const { x0, x1, y1 } = bb;
  if (fin === 'siding') {
    for (let y = F + 0.5; y < y1; y += 0.5)
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
  } else if (fin === 'brick' || fin === 'block') {
    const co = fin === 'brick' ? 2.667 / 12 : 8 / 12,
      bl = fin === 'brick' ? 8 / 12 : 16 / 12;
    let j = 0;
    for (let y = F; y < y1; y += co, j++) {
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
      for (let x = x0 + (j % 2 ? bl / 2 : 0); x < x1; x += bl)
        raw.push([
          [x, y],
          [x, y + co]
        ]);
    }
  } else if (fin === 'log') {
    for (let y = F + 0.85; y < y1; y += 0.85) {
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
      raw.push([
        [x0 - 1, y - 0.28],
        [x1 + 1, y - 0.28]
      ]);
    }
  } else if (fin === 'shingle') {
    const ex = 0.6;
    for (let y = F; y < y1; y += ex) {
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
      let x = x0 + rnd() * 0.5;
      while (x < x1) {
        raw.push([
          [x, y],
          [x, y + ex]
        ]);
        x += 0.35 + rnd() * 0.55;
      }
    }
  } else if (fin === 'stone') {
    let y = F;
    while (y < y1) {
      const ch = 1 + rnd() * 0.6;
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
      let x = x0 + rnd() * 1.5;
      while (x < x1) {
        raw.push([
          [x, y],
          [x, y + ch]
        ]);
        x += 1.2 + rnd() * 1.6;
      }
      y += ch;
    }
  } else if (fin === 'panel') {
    for (let x = x0 + 4; x < x1; x += 4)
      raw.push([
        [x, F],
        [x, y1 + 1]
      ]);
    for (let y = F + 5; y < y1; y += 5)
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
  } else if (fin === 'stave') {
    const co = 2.5,
      bl = 10 / 12;
    let j = 0;
    for (let y = F; y < y1; y += co, j++) {
      raw.push([
        [x0 - 1, y],
        [x1 + 1, y]
      ]);
      for (let x = x0 + (j % 2 ? bl / 2 : 0); x < x1; x += bl)
        raw.push([
          [x, y],
          [x, y + co]
        ]);
    }
  } else if (fin === 'batten') {
    for (let x = x0 + 0.5; x < x1; x += 1) {
      raw.push([
        [x, F - 1],
        [x, y1 + 1]
      ]);
      raw.push([
        [x + 0.14, F - 1],
        [x + 0.14, y1 + 1]
      ]);
    }
  } else if (fin === 'stucco') {
    const n = Math.round((x1 - x0) * (y1 - F) * 0.8);
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0),
        y = F + rnd() * (y1 - F),
        l = 0.06 + rnd() * 0.1,
        a = rnd() * Math.PI;
      raw.push([
        [x, y],
        [x + Math.cos(a) * l, y + Math.sin(a) * l]
      ]);
    }
  }
  return clipAll(raw, P);
}

export function tudorTimbers(P, B, c) {
  const it = [],
    bb = bbox(P),
    F = B.found,
    H = B.H,
    w = bb.x1,
    tw = 0.45,
    col = { fill: c.L ? '#ffffff' : c.trim, stroke: c.L ? '#222222' : shade(c.trim, -0.3), w: 0.25 };
  const add = q => {
    const r = clipConvex(q, P);
    if (r.length >= 3) it.push(poly(r, col));
  };
  const levels = [F];
  for (let s = 1; s <= B.stories; s++) levels.push(F + s * B.storyH);
  levels.forEach(y => add(rectP(-1, y - tw / 2, w + 2, tw)));
  const first = F + B.storyH;
  for (let x = 0.2; x < w; x += 2.4) add(rectP(x, first, tw, bb.y1 - first + 1));
  for (let s = 1; s < B.stories; s++) {
    const y0 = F + s * B.storyH,
      y1 = y0 + B.storyH;
    [
      [0.2, 2.6],
      [w - 0.2, w - 2.6]
    ].forEach(([a, b]) =>
      add(
        Object.assign(
          [],
          [
            [a, y0],
            [a + (b > a ? tw : -tw), y0],
            [b + (b > a ? tw : -tw), y1],
            [b, y1]
          ]
        )
      )
    );
  }
  if (bb.y1 > H + 2) {
    const cx = w / 2;
    add(rectP(cx - tw / 2, H, tw, bb.y1 - H));
    add([
      [cx - 4, H],
      [cx - 4 + tw, H],
      [cx + tw / 2, H + Math.min(4, bb.y1 - H - 0.5)],
      [cx - tw / 2, H + Math.min(4, bb.y1 - H - 0.5)]
    ]);
    add([
      [cx + 4 - tw, H],
      [cx + 4, H],
      [cx + tw / 2, H + Math.min(4, bb.y1 - H - 0.5)],
      [cx - tw / 2, H + Math.min(4, bb.y1 - H - 0.5)]
    ]);
  }
  return it;
}

export function fishSegs(P, y0) {
  const bb = bbox(P),
    raw = [],
    ex = 5 / 12,
    sw = 0.5;
  let j = 0;
  for (let y = y0 + ex; y < bb.y1 + ex; y += ex, j++) {
    for (let x = bb.x0 - sw + (j % 2 ? sw / 2 : 0); x < bb.x1; x += sw) {
      let prev = [x, y];
      for (let i = 1; i <= 6; i++) {
        const q = [x + (sw * i) / 6, y - 0.17 * Math.sin((Math.PI * i) / 6)];
        raw.push([prev, q]);
        prev = q;
      }
      raw.push([
        [x, y],
        [x, y + ex * 0.9]
      ]);
    }
  }
  return raw;
}

export function clipRectToWall(x, y, w, h, P) {
  return rectP(x, y, w, h);
}

export function roofArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    rnd = rng(f.id * 131 + 7);
  const raw = [];
  const { x0, x1, y0, y1 } = bb;
  switch (A.finish) {
    case 'asphalt': {
      const ex = 5 / 12;
      for (let y = y0 + ex; y < y1; y += ex)
        raw.push([
          [x0, y],
          [x1, y]
        ]);
      let j = 0;
      for (let y = y0; y < y1; y += ex, j++)
        for (let x = x0 + (j % 2 ? 0.5 : 0) + 0.25; x < x1; x += 1)
          raw.push([
            [x, y],
            [x, y + ex * 0.62]
          ]);
      break;
    }
    case 'arch': {
      const ex = 5.6 / 12;
      for (let y = y0; y < y1; y += ex) {
        raw.push([
          [x0, y + ex],
          [x1, y + ex]
        ]);
        let x = x0 + rnd() * 1.2;
        while (x < x1) {
          raw.push([
            [x, y],
            [x, y + ex * 0.85]
          ]);
          const wd = 0.6 + rnd() * 1.2;
          if (rnd() < 0.5)
            raw.push([
              [x + 0.05, y + ex * 0.3],
              [x + wd * 0.7, y + ex * 0.3]
            ]);
          x += wd;
        }
      }
      break;
    }
    case 'shake': {
      const ex = 7.5 / 12;
      for (let y = y0; y < y1; y += ex) {
        raw.push([
          [x0, y + ex],
          [x1, y + ex]
        ]);
        let x = x0 + rnd() * 0.6;
        while (x < x1) {
          raw.push([
            [x, y],
            [x, y + ex]
          ]);
          const wd = 0.3 + rnd() * 0.6;
          if (rnd() < 0.35) {
            const gx = x + wd * (0.3 + rnd() * 0.4);
            raw.push([
              [gx, y + 0.05],
              [gx, y + ex * (0.4 + rnd() * 0.4)]
            ]);
          }
          x += wd;
        }
      }
      break;
    }
    case 'slate': {
      const ex = 7 / 12;
      let j = 0;
      for (let y = y0; y < y1; y += ex, j++) {
        raw.push([
          [x0, y + ex],
          [x1, y + ex]
        ]);
        for (let x = x0 + (j % 2 ? 0.5 : 0); x < x1; x += 1)
          raw.push([
            [x, y],
            [x, y + ex]
          ]);
      }
      break;
    }
    case 'fish': {
      const ex = 5 / 12,
        sw = 0.5;
      let j = 0;
      for (let y = y0 + ex; y < y1 + ex; y += ex, j++) {
        for (let x = x0 - sw + (j % 2 ? sw / 2 : 0); x < x1; x += sw) {
          let prev = [x, y];
          for (let i = 1; i <= 6; i++) {
            const q = [x + (sw * i) / 6, y - 0.17 * Math.sin((Math.PI * i) / 6)];
            raw.push([prev, q]);
            prev = q;
          }
          raw.push([
            [x, y],
            [x, y + ex * 0.9]
          ]);
        }
      }
      break;
    }
    case 'tile': {
      const rw = 10 / 12;
      for (let x = x0 + 0.2; x < x1; x += rw) {
        raw.push([
          [x, y0],
          [x, y1]
        ]);
        raw.push([
          [x + 0.17, y0],
          [x + 0.17, y1]
        ]);
      }
      for (let y = y0 + 1.1; y < y1; y += 1.1)
        raw.push([
          [x0, y],
          [x1, y]
        ]);
      break;
    }
    case 'glass': {
      const it0 = [];
      break;
    }
    case 'seam': {
      for (let x = x0 + 0.6; x < x1; x += 1.5) {
        raw.push([
          [x, y0],
          [x, y1]
        ]);
        raw.push([
          [x + 0.09, y0],
          [x + 0.09, y1]
        ]);
      }
      break;
    }
    case 'corr': {
      for (let x = x0 + 0.11; x < x1; x += 0.22)
        raw.push([
          [x, y0],
          [x, y1]
        ]);
      break;
    }
  }
  if (A.finish === 'glass') {
    const g = [];
    for (let x = x0 + 2; x < x1; x += 2)
      g.push([
        [x, y0],
        [x, y1]
      ]);
    for (let y = y0 + 2.2; y < y1; y += 2.2)
      g.push([
        [x0, y],
        [x1, y]
      ]);
    const it = [
      poly(P, { fill: c.L ? '#ffffff' : '#bcd9d3', stroke: c.windowLine || c.roofLine, w: 0.3 }),
      { t: 'segs', s: clipAll(g, P), stroke: c.L ? '#222222' : '#f4f4f2', w: 0.9 }
    ];
    f.tag.forEach((t, i) => {
      if (t === 'ridge')
        it.push(
          poly(edgeBand(P[i], P[(i + 1) % P.length], 0.3), {
            fill: c.L ? '#ffffff' : '#f4f4f2',
            stroke: '#9a9a9a',
            w: 0.25
          })
        );
    });
    return it;
  }
  const it = [
    poly(P, { fill: c.roof }),
    { t: 'segs', s: clipAll(raw, P), stroke: c.roofLine, w: A.finish === 'corr' ? 0.2 : 0.3 }
  ];
  const n = P.length;
  f.tag.forEach((t, i) => {
    const a = P[i],
      b = P[(i + 1) % n];
    if (t === 'ridge' || t === 'hip')
      it.push(poly(edgeBand(a, b, 0.45), { fill: c.ridge, stroke: c.roofLine, w: 0.3 }));
    else if (t === 'eave') it.push(poly(edgeBand(a, b, 0.14), { fill: c.drip, stroke: c.roofLine, w: 0.25 }));
    else if (t === 'rake')
      it.push(
        poly(edgeBand(a, b, 0.3), {
          fill: c.L ? '#ffffff' : shade(c.roof, -0.22),
          stroke: c.roofLine,
          w: 0.25
        })
      );
  });
  return it;
}

export function deckArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    raw = [];
  for (let x = bb.x0 + 3; x < bb.x1; x += 3)
    raw.push([
      [x, bb.y0],
      [x, bb.y1]
    ]);
  const it = [poly(P, { fill: c.deck }), { t: 'segs', s: clipAll(raw, P), stroke: c.deckLine, w: 0.3 }];
  const cx = (bb.x0 + bb.x1) / 2,
    cy = (bb.y0 + bb.y1) * 0.6;
  if (bb.x1 - bb.x0 > 9 && bb.y1 - bb.y0 > 8) {
    it.push(
      poly(rectP(cx - 2, cy - 1.5, 4, 3), { fill: c.L ? '#ffffff' : '#a9aeb0', stroke: c.deckLine, w: 0.35 })
    );
    const g = [];
    for (let x = cx - 1.6; x < cx + 1.7; x += 0.4)
      g.push([
        [x, cy - 1.2],
        [x, cy + 1.2]
      ]);
    it.push({ t: 'segs', s: g, stroke: c.deckLine, w: 0.25 });
  }
  return it;
}

export function baseArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P);
  return [
    poly(P, { fill: c.base }),
    txt('FRONT', (bb.x0 + bb.x1) / 2, bb.y0 + 0.6, {
      sizeFt: 1.1,
      anchor: 'middle',
      bold: true,
      fill: '#888888'
    })
  ];
}

export function padArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    raw = [];
  for (let x = bb.x0 + 10; x < bb.x1; x += 10)
    raw.push([
      [x, bb.y0],
      [x, bb.y1]
    ]);
  for (let y = bb.y0 + 10; y < bb.y1; y += 10)
    raw.push([
      [bb.x0, y],
      [bb.x1, y]
    ]);
  const it = [poly(P, { fill: c.concrete }), { t: 'segs', s: raw, stroke: c.concreteLine, w: 0.3 }];
  const cy = (bb.y0 + bb.y1) / 2;
  f.art.islands.forEach(x => {
    const lx = x - f.fr.o[0];
    it.push(
      poly(rectP(lx - 1.8, cy - 5, 3.6, 8), {
        fill: c.L ? '#ffffff' : '#e0dfd9',
        stroke: c.concreteLine,
        w: 0.35
      })
    );
  });
  it.push(
    txt('FRONT', (bb.x0 + bb.x1) / 2, bb.y0 + 0.6, {
      sizeFt: 1.1,
      anchor: 'middle',
      bold: true,
      fill: '#888888'
    })
  );
  return it;
}
