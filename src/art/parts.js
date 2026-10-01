/* Artwork for smaller parts: chimneys, signs, porches, columns, canopies, railings and pumps. */
import { bulbs, signText, stackText } from './facades/venues.js';
import { wallTexture } from './textures.js';
import { pl, poly } from '../lib/draw.js';
import { bbox, clipAll, rectP } from '../lib/geometry.js';
import { rng, shade } from '../lib/math.js';

export function railingArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1 - bb.x0,
    h = bb.y1 - bb.y0,
    col = { fill: c.trim, stroke: c.trimLine, w: 0.25 };
  const it = [poly(P, { fill: c.L ? '#ffffff' : '#d9d5cb', stroke: c.trimLine, w: 0.3 })];
  it.push(
    poly(rectP(bb.x0, bb.y1 - 0.4, w, 0.4), col),
    poly(rectP(bb.x0, bb.y0 + 0.25, w, 0.3), col),
    poly(rectP(bb.x0, bb.y0, w, 0.25), {
      fill: c.L ? '#ffffff' : shade(c.trim, -0.12),
      stroke: c.trimLine,
      w: 0.25
    })
  );
  const n = Math.max(1, Math.round(w / 0.5));
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + ((i + 0.5) * w) / n;
    it.push(poly(rectP(x - 0.09, bb.y0 + 0.55, 0.18, h - 0.95), col));
  }
  [bb.x0, bb.x1 - 0.42].forEach(x => it.push(poly(rectP(x, bb.y0, 0.42, h), col)));
  return it;
}

export function trimPlainArt(f) {
  const c = f.art.pal;
  return [poly(f.l2, { fill: c.trim, stroke: c.trimLine, w: 0.3 })];
}

export function chimneyArt(f) {
  const A = f.art,
    P = f.l2,
    bb = bbox(P),
    c = A.pal;
  const col = c.L ? '#ffffff' : A.brick;
  return [
    poly(P, { fill: col }),
    {
      t: 'segs',
      s: wallTexture('brick', P, bb.y0, rng(f.id)),
      stroke: c.L ? '#9a9a9a' : shade(col, -0.3),
      w: 0.3
    },
    poly(rectP(bb.x0, bb.y1 - 0.7, bb.x1 - bb.x0, 0.7), {
      fill: c.L ? '#ffffff' : shade(col, -0.25),
      stroke: '#222222',
      w: 0.25
    })
  ];
}

export function canopyFaceArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: A.bulbs && !c.L ? c.accent : c.metal, stroke: c.metalLine, w: 0.3 })];
  if (A.text)
    it.push(
      ...signText(A.text, bb.x0, bb.x1, bb.y0, bb.y1, c, c.L ? '#222222' : A.bulbs ? '#ffffff' : c.accent)
    );
  if (A.bulbs) {
    const st = Math.max(0.6, Math.min(1.2, (bb.y1 - bb.y0) / 3));
    bulbs(it, bb.x0 + 0.3, bb.y0 + 0.25, bb.x1 - 0.3, bb.y1 - 0.25, st, c);
  }
  return it;
}

export function bladeArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.35 })];
  bulbs(it, bb.x0 + 0.3, bb.y0 + 0.3, bb.x1 - 0.3, bb.y1 - 0.3, 0.8, c);
  it.push(
    ...stackText(A.text || '', (bb.x0 + bb.x1) / 2, bb.y0 + 0.8, bb.y1 - 0.6, c, c.L ? '#222222' : '#fff3b0')
  );
  return it;
}

export function signFaceArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    h = bb.y1 - bb.y0,
    it = [poly(P, { fill: c.accent, stroke: c.accentLine, w: 0.35 })];
  it.push(...signText(A.text, bb.x0, bb.x1, bb.y0 + h * 0.32, bb.y1, c, c.L ? '#222222' : '#ffffff'));
  if (A.sub)
    it.push(
      poly(rectP(bb.x0 + 0.5, bb.y0 + 0.3, bb.x1 - bb.x0 - 1, h * 0.26), {
        fill: c.L ? '#ffffff' : '#1e2327'
      }),
      ...signText(
        A.sub,
        bb.x0 + 0.5,
        bb.x1 - 0.5,
        bb.y0 + 0.3,
        bb.y0 + 0.3 + h * 0.26,
        c,
        c.L ? '#222222' : '#ff5a5a'
      )
    );
  bulbs(it, bb.x0 + 0.3, bb.y0 + 0.2, bb.x1 - 0.3, bb.y1 - 0.2, 0.9, c);
  return it;
}

export function porchDeckArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    ls = [];
  for (let x = bb.x0 + 0.35; x < bb.x1; x += 0.35)
    ls.push([
      [x, bb.y0],
      [x, bb.y1]
    ]);
  return [
    poly(P, { fill: c.L ? '#ffffff' : '#8a7560' }),
    { t: 'segs', s: ls, stroke: c.L ? '#9a9a9a' : '#6b5845', w: 0.25 }
  ];
}

export function porchSkirtArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: c.trim, stroke: c.trimLine, w: 0.3 })];
  const raw = [];
  const h = bb.y1 - bb.y0;
  if (h > 0.9) {
    for (let x = bb.x0 - h; x < bb.x1; x += 0.5) {
      raw.push([
        [x, bb.y0 + 0.15],
        [x + h, bb.y1 - 0.15]
      ]);
      raw.push([
        [x + h, bb.y0 + 0.15],
        [x, bb.y1 - 0.15]
      ]);
    }
    it.push({
      t: 'segs',
      s: clipAll(raw, rectP(bb.x0 + 0.3, bb.y0 + 0.15, bb.x1 - bb.x0 - 0.6, h - 0.3)),
      stroke: c.trimLine,
      w: 0.25
    });
  }
  if (f.art.steps) {
    const cx = (bb.x0 + bb.x1) / 2,
      n = Math.max(1, Math.round(h / 0.6));
    for (let i = 0; i < n; i++) {
      const y = bb.y0 + (i * h) / n;
      it.push(
        poly(rectP(cx - 2.2 + i * 0.1, y, 4.4 - i * 0.2, h / n), {
          fill: c.L ? '#ffffff' : '#9a8a78',
          stroke: c.trimLine,
          w: 0.25
        })
      );
    }
  }
  return it;
}

export function columnArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1 - bb.x0,
    it = [poly(P, { fill: c.trim, stroke: c.trimLine, w: 0.25 })];
  it.push(
    poly(rectP(bb.x0, bb.y0, w, Math.min(1, bb.y1 * 0.08)), {
      fill: c.L ? '#ffffff' : shade(c.trim, -0.1),
      stroke: c.trimLine,
      w: 0.25
    }),
    poly(rectP(bb.x0, bb.y1 - 0.6, w, 0.6), {
      fill: c.L ? '#ffffff' : shade(c.trim, -0.1),
      stroke: c.trimLine,
      w: 0.25
    })
  );
  if (f.art.tall) {
    const ls = [];
    for (let x = bb.x0 + w / 4; x < bb.x1 - 0.05; x += w / 4)
      ls.push([
        [x, bb.y0 + 1.2],
        [x, bb.y1 - 0.8]
      ]);
    it.push({ t: 'segs', s: ls, stroke: c.trimLine, w: 0.25 });
  }
  return it;
}

export function sawGlassArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: c.window, stroke: c.windowLine, w: 0.3 })];
  const cols = Math.max(4, Math.round((bb.x1 - bb.x0) / 1.4)),
    rows = Math.max(2, Math.round((bb.y1 - bb.y0) / 1.4));
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++)
      it.push(
        poly(
          rectP(
            bb.x0 + (k * (bb.x1 - bb.x0)) / cols + 0.08,
            bb.y0 + (r * (bb.y1 - bb.y0)) / rows + 0.08,
            (bb.x1 - bb.x0) / cols - 0.16,
            (bb.y1 - bb.y0) / rows - 0.16
          ),
          { fill: c.glass }
        )
      );
  return it;
}

export function mechArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    ls = [];
  for (let y = bb.y0 + 0.6; y < bb.y1 - 0.4; y += 0.4)
    ls.push([
      [bb.x0 + 0.5, y],
      [bb.x1 - 0.5, y]
    ]);
  return [
    poly(P, { fill: c.metal, stroke: c.metalLine, w: 0.3 }),
    { t: 'segs', s: ls, stroke: c.metalLine, w: 0.25 }
  ];
}

export function awningArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: c.trim })];
  const sw = 1.2;
  let i = 0;
  for (let x = bb.x0; x < bb.x1; x += sw, i++) {
    if (i % 2 === 0)
      it.push(poly(rectP(x, bb.y0, Math.min(sw, bb.x1 - x), bb.y1 - bb.y0), { fill: c.accent }));
  }
  it.push(pl([...P, P[0]], { stroke: c.accentLine, w: 0.3 }));
  return it;
}

export function fasciaArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    h = bb.y1 - bb.y0,
    it = [
      poly(P, { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
      poly(rectP(bb.x0, bb.y0 + h * 0.3, bb.x1 - bb.x0, h * 0.4), { fill: c.accent })
    ];
  if (f.art.text)
    it.push(
      ...signText(f.art.text, bb.x0, bb.x1, bb.y0, bb.y1, c, c.L ? '#222222' : '#ffffff').map(t =>
        Object.assign(t, { sizeFt: Math.min(t.sizeFt, h * 0.34) })
      )
    );
  return it;
}

export function canopyBottomArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    it = [poly(P, { fill: c.L ? '#ffffff' : '#e9ebe6' })];
  for (let x = bb.x0 + 4; x < bb.x1 - 2; x += 6)
    for (let y = bb.y0 + 4; y < bb.y1 - 2; y += 6)
      it.push(
        poly(rectP(x - 0.8, y - 0.8, 1.6, 1.6), {
          fill: c.L ? '#ffffff' : '#fbfbf2',
          stroke: c.metalLine,
          w: 0.3
        })
      );
  return it;
}

export function postArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P);
  return [
    poly(P, { fill: c.trim, stroke: c.trimLine, w: 0.25 }),
    poly(rectP(bb.x0, 0, bb.x1 - bb.x0, 2.2), { fill: c.accent, stroke: c.accentLine, w: 0.25 })
  ];
}

export function pumpArt(f) {
  const c = f.art.pal,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1 - bb.x0,
    it = [poly(P, { fill: f.art.role === 'top' ? c.trim : c.accent, stroke: c.accentLine, w: 0.3 })];
  if (f.art.role === 'face') {
    it.push(
      poly(rectP(bb.x0 + 0.3, 3.3, w - 0.6, 1.4), {
        fill: c.L ? '#ffffff' : '#f4f4ee',
        stroke: c.accentLine,
        w: 0.3
      }),
      poly(rectP(bb.x0 + 0.5, 3.9, w - 1, 0.5), { fill: c.glass, stroke: c.glassLine, w: 0.25 }),
      poly(rectP(bb.x0 + 0.4, 1.4, w * 0.3, 1.3), {
        fill: c.L ? '#ffffff' : '#2a2e31',
        stroke: c.accentLine,
        w: 0.3
      })
    );
  }
  return it;
}
