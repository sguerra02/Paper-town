/* Artwork for ground tiles and streets. */
import { poly } from '../../lib/draw.js';
import { bbox, circ, rectP } from '../../lib/geometry.js';
import { rng } from '../../lib/math.js';
import { clipPolyRect } from '../../print/split.js';

export function groundArt(f) {
  const A = f.art,
    c = A.pal,
    P = f.l2,
    bb = bbox(P),
    rnd = rng(f.id * 97 + 3),
    it = [],
    W = bb.x1 - bb.x0,
    Hh = bb.y1 - bb.y0,
    area = W * Hh;
  const L = c.L,
    rp = () => [bb.x0 + rnd() * W, bb.y0 + rnd() * Hh];
  const stip = (n, col, len, wd) => {
    const s = [];
    for (let k = 0; k < n; k++) {
      const [x, y] = rp();
      const a = rnd() * Math.PI;
      s.push([
        [x, y],
        [x + Math.cos(a) * len, y + Math.sin(a) * len]
      ]);
    }
    it.push({ t: 'segs', s, stroke: col, w: wd });
  };
  const col = (a, b) => (L ? b || '#ffffff' : a);
  switch (A.sk) {
    case 'lawn': {
      it.push(poly(P, { fill: c.grass }));
      const raw = [];
      for (let k = 0; k < Math.round(area * 2.5); k++) {
        const [x, y] = rp();
        raw.push([
          [x, y],
          [x + (rnd() - 0.5) * 0.2, y + 0.25 + rnd() * 0.2]
        ]);
      }
      it.push({ t: 'segs', s: raw, stroke: c.grassD, w: 0.3 });
      if (A.path) {
        const cx = (bb.x0 + bb.x1) / 2;
        for (let y = bb.y0 + 1; y < bb.y1 - 1; y += 2.2)
          it.push(
            poly(
              circ(cx + (rnd() - 0.5) * 0.6, y, 0.9, 10).map(([a, b]) => [a, y + (b - y) * 0.6]),
              { fill: c.concrete, stroke: c.concreteLine, w: 0.25 }
            )
          );
      }
      return it;
    }
    case 'cobble': {
      it.push(poly(P, { fill: col('#6d675e') }));
      const shades = ['#9a938a', '#8a8379', '#a59f95', '#7f786f', '#938c82'];
      let j = 0;
      for (let y = bb.y0; y < bb.y1; y += 0.5, j++) {
        let x = bb.x0 - (j % 2 ? 0.25 : 0);
        while (x < bb.x1) {
          const w = 0.38 + rnd() * 0.3,
            q = [
              [x + 0.05, y + 0.06],
              [x + w - 0.05, y + 0.06],
              [x + w - 0.02, y + 0.25],
              [x + w - 0.05, y + 0.44],
              [x + 0.05, y + 0.44],
              [x + 0.02, y + 0.25]
            ];
          it.push(
            poly(q, {
              fill: L ? '#ffffff' : shades[Math.floor(rnd() * 5)],
              stroke: L ? '#9a9a9a' : null,
              w: 0.2
            })
          );
          x += w;
        }
      }
      return it
        .map(q =>
          q.t === 'poly' && q !== it[0]
            ? Object.assign(q, { p: clipPolyRect(q.p, { x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 }) })
            : q
        )
        .filter(q => q.t !== 'poly' || q.p.length >= 3);
    }
    case 'gravel': {
      it.push(poly(P, { fill: col('#a39c90') }));
      ['#8a8378', '#bdb6aa', '#6f6a62', '#cfc8bb'].forEach(cc =>
        stip(Math.round(area * 1.6), L ? '#9a9a9a' : cc, 0.07, 1.1)
      );
      return it;
    }
    case 'sand': {
      it.push(poly(P, { fill: col('#dcc79e') }));
      stip(Math.round(area * 1.2), L ? '#bbbbbb' : '#c4ad80', 0.04, 0.6);
      const rip = [];
      for (let y = bb.y0 + 0.8; y < bb.y1; y += 1.4) {
        let prev = null;
        for (let x = bb.x0; x <= bb.x1 + 0.01; x += 0.5) {
          const q = [x, y + 0.25 * Math.sin(x * 0.9 + y)];
          if (prev) rip.push([prev, q]);
          prev = q;
        }
      }
      it.push({ t: 'segs', s: rip, stroke: L ? '#bbbbbb' : '#c9b184', w: 0.35 });
      return it;
    }
    case 'water': {
      it.push(poly(P, { fill: col('#3d7fa6') }));
      const wv = [];
      for (let k = 0; k < Math.round(area * 0.35); k++) {
        const [x, y] = rp();
        const w = 0.5 + rnd() * 0.9;
        wv.push(
          [
            [x, y],
            [x + w / 2, y + 0.12]
          ],
          [
            [x + w / 2, y + 0.12],
            [x + w, y]
          ]
        );
      }
      it.push({ t: 'segs', s: wv, stroke: L ? '#9a9a9a' : '#9cc8e0', w: 0.45 });
      stip(Math.round(area * 0.15), L ? '#cccccc' : '#e4f2fa', 0.12, 0.5);
      return it;
    }
    case 'forest': {
      it.push(poly(P, { fill: col('#5a4a36') }));
      const lc = ['#9a5a2a', '#c07a2a', '#7a6a2a', '#5f7a3a', '#8a3a22', '#b39a4a'];
      for (let k = 0; k < Math.round(area * 1.1); k++) {
        const [x, y] = rp(),
          a = rnd() * Math.PI,
          s = 0.12 + rnd() * 0.12;
        const q = [];
        for (let i = 0; i < 6; i++) {
          const t = (i / 6) * Math.PI * 2;
          q.push([
            x + Math.cos(t) * s * 1.6 * Math.cos(a) - Math.sin(t) * s * 0.8 * Math.sin(a),
            y + Math.cos(t) * s * 1.6 * Math.sin(a) + Math.sin(t) * s * 0.8 * Math.cos(a)
          ]);
        }
        it.push(
          poly(q, { fill: L ? '#ffffff' : lc[Math.floor(rnd() * 6)], stroke: L ? '#aaaaaa' : null, w: 0.2 })
        );
      }
      stip(Math.round(area * 0.12), L ? '#777777' : '#3a2e22', 0.6, 0.4);
      for (let k = 0; k < Math.round(area * 0.02); k++) {
        const [x, y] = rp();
        it.push(poly(circ(x, y, 0.4 + rnd() * 0.6, 9), { fill: L ? '#ffffff' : '#4f6a34' }));
      }
      return it.filter(
        q =>
          q.t !== 'poly' ||
          q === it[0] ||
          q.p.every(pt => pt[0] >= bb.x0 && pt[0] <= bb.x1 && pt[1] >= bb.y0 && pt[1] <= bb.y1)
      );
    }
    case 'dirt': {
      it.push(poly(P, { fill: col('#8a6a48') }));
      stip(Math.round(area * 1.2), L ? '#aaaaaa' : '#6e5236', 0.05, 0.8);
      stip(Math.round(area * 0.4), L ? '#cccccc' : '#a8876a', 0.05, 0.8);
      return it;
    }
    case 'tracks': {
      it.push(poly(P, { fill: col('#8b857a') }));
      ['#6f6a62', '#a8a196'].forEach(cc => stip(Math.round(area * 1.4), L ? '#aaaaaa' : cc, 0.07, 1));
      const cy = (bb.y0 + bb.y1) / 2,
        g = 4.708 / 2 + 0.12;
      for (let x = bb.x0 + 0.9; x < bb.x1 - 0.3; x += 1.8)
        it.push(
          poly(rectP(x - 0.37, cy - 4.25, 0.75, 8.5), {
            fill: L ? '#ffffff' : '#5a4332',
            stroke: L ? '#777777' : '#3e2e22',
            w: 0.2
          })
        );
      [cy - g, cy + g].forEach(y => {
        it.push(
          poly(rectP(bb.x0, y - 0.12, W, 0.24), {
            fill: L ? '#ffffff' : '#8f9498',
            stroke: '#444444',
            w: 0.25
          })
        );
      });
      return it;
    }
    case 'parking': {
      groundBase(it, P, bb, c, rnd, area);
      const X0 = bb.x0,
        X1 = bb.x1,
        Y0 = bb.y0,
        Y1 = bb.y1,
        sd = 18,
        sw = 9;
      [
        [Y0, Y0 + sd],
        [Y1 - sd, Y1]
      ].forEach(([a, b], ri) => {
        if (b - a < sd - 0.1) return;
        for (let x = X0 + 1; x <= X1 - 1 + 1e-6; x += sw)
          it.push(poly(rectP(x - 0.12, a, 0.25, b - a), { fill: c.paint }));
        for (let x = X0 + 1 + sw / 2; x < X1 - 1; x += sw) {
          const wy = ri === 0 ? a + 1 : b - 1.6;
          it.push(poly(rectP(x - 2.2, wy, 4.4, 0.6), { fill: c.concrete, stroke: c.concreteLine, w: 0.2 }));
        }
      });
      const my = (Y0 + Y1) / 2;
      for (let x = X0 + 3; x < X1 - 6; x += 12)
        it.push(
          poly(
            [
              [x, my - 0.4],
              [x + 4, my - 0.4],
              [x + 4, my - 1],
              [x + 6, my],
              [x + 4, my + 1],
              [x + 4, my + 0.4],
              [x, my + 0.4]
            ],
            { fill: c.paint }
          )
        );
      return it;
    }
    case 'street':
      return streetArt(it, P, bb, A, c, rnd, area);
  }
  return it;
}

export function groundBase(it, P, bb, c, rnd, area) {
  it.push(poly(P, { fill: c.ground }));
  const raw = [];
  for (let k = 0; k < Math.round(area * 0.6); k++) {
    const x = bb.x0 + rnd() * (bb.x1 - bb.x0),
      y = bb.y0 + rnd() * (bb.y1 - bb.y0);
    raw.push([
      [x, y],
      [x + 0.08, y + 0.05]
    ]);
  }
  it.push({ t: 'segs', s: raw, stroke: c.groundL, w: 0.4 });
}

export function streetArt(it, P, bb, A, c, rnd, area) {
  const X0 = bb.x0,
    Y0 = bb.y0,
    W = bb.x1 - bb.x0,
    H = bb.y1 - bb.y0,
    sw = A.sidewalks,
    s = sw ? 6.5 : 0,
    curb = c.L ? '#ffffff' : '#e2e0da';
  const walk = (x, y, w, h) => {
    it.push(poly(rectP(x, y, w, h), { fill: c.concrete, stroke: c.concreteLine, w: 0.3 }));
    const j = [];
    if (w >= h) {
      for (let xx = x + 5; xx < x + w; xx += 5)
        j.push([
          [xx, y],
          [xx, y + h]
        ]);
    } else {
      for (let yy = y + 5; yy < y + h; yy += 5)
        j.push([
          [x, yy],
          [x + w, yy]
        ]);
    }
    it.push({ t: 'segs', s: j, stroke: c.concreteLine, w: 0.3 });
  };
  if (A.street === 'straight') {
    groundBase(it, P, bb, c, rnd, area);
    let y = Y0;
    if (sw) {
      walk(X0, y, W, 6);
      it.push(poly(rectP(X0, y + 6, W, 0.5), { fill: curb, stroke: c.concreteLine, w: 0.3 }));
      y += 6.5;
    }
    const r0 = y,
      r1 = y + 24;
    it.push(
      poly(rectP(X0, r0 + 0.6, W, 0.3), { fill: c.paint }),
      poly(rectP(X0, r1 - 0.9, W, 0.3), { fill: c.paint })
    );
    const cy = (r0 + r1) / 2;
    it.push(
      poly(rectP(X0, cy - 0.28, W, 0.18), { fill: c.yellow }),
      poly(rectP(X0, cy + 0.1, W, 0.18), { fill: c.yellow })
    );
    if (A.crosswalk) {
      const cx0 = X0 + 3;
      for (let yy = r0 + 1.2; yy < r1 - 1.4; yy += 2.2)
        it.push(poly(rectP(cx0, yy, 8, 1.2), { fill: c.paint }));
      it.push(poly(rectP(cx0 + 9, r0 + 0.9, 0.9, cy - r0 - 1), { fill: c.paint }));
    }
    if (sw) {
      it.push(poly(rectP(X0, r1, W, 0.5), { fill: curb, stroke: c.concreteLine, w: 0.3 }));
      walk(X0, r1 + 0.5, W, 6);
    }
    return it;
  }
  const Q = W,
    arms = { cross: ['E', 'W', 'N', 'S'], tee: ['E', 'W', 'S'], corner: ['E', 'S'] }[A.street];
  groundBase(it, P, bb, c, rnd, area);
  if (sw) {
    [
      [X0, Y0],
      [X0 + Q - s, Y0],
      [X0, Y0 + Q - s],
      [X0 + Q - s, Y0 + Q - s]
    ].forEach(([x, y]) => walk(x, y, s, s));
    const sides = {
      S: [X0 + s, Y0, Q - 2 * s, s],
      N: [X0 + s, Y0 + Q - s, Q - 2 * s, s],
      W: [X0, Y0 + s, s, Q - 2 * s],
      E: [X0 + Q - s, Y0 + s, s, Q - 2 * s]
    };
    Object.entries(sides).forEach(([d, r]) => {
      if (!arms.includes(d)) {
        walk(...r);
        const cb =
          d === 'S'
            ? [r[0], r[1] + r[3] - 0.5, r[2], 0.5]
            : d === 'N'
              ? [r[0], r[1], r[2], 0.5]
              : d === 'W'
                ? [r[0] + r[2] - 0.5, r[1], 0.5, r[3]]
                : [r[0], r[1], 0.5, r[3]];
        it.push(poly(rectP(...cb), { fill: curb, stroke: c.concreteLine, w: 0.3 }));
      } else if (A.crosswalk) {
        if (d === 'E' || d === 'W') {
          for (let yy = r[1] + 1; yy < r[1] + r[3] - 1.4; yy += 2.2)
            it.push(poly(rectP(r[0] + 0.6, yy, r[2] - 1.2, 1.2), { fill: c.paint }));
        } else {
          for (let xx = r[0] + 1; xx < r[0] + r[2] - 1.4; xx += 2.2)
            it.push(poly(rectP(xx, r[1] + 0.6, 1.2, r[3] - 1.2), { fill: c.paint }));
        }
      }
    });
    [
      [X0 + s - 0.5, Y0, 0.5, s],
      [X0 + Q - s, Y0, 0.5, s],
      [X0 + s - 0.5, Y0 + Q - s, 0.5, s],
      [X0 + Q - s, Y0 + Q - s, 0.5, s],
      [X0, Y0 + s - 0.5, s, 0.5],
      [X0 + Q - s, Y0 + s - 0.5, s, 0.5],
      [X0, Y0 + Q - s, s, 0.5],
      [X0 + Q - s, Y0 + Q - s, s, 0.5]
    ].forEach(r => it.push(poly(rectP(...r), { fill: curb, stroke: c.concreteLine, w: 0.25 })));
  }
  return it;
}
