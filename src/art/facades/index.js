/* Draws a wall: its texture, then the facade for the building type, then any openings from the editor. */
import { castleArt, towerArt } from './castle.js';
import { civicArt, gardenArt } from './civic.js';
import { officeArt, roadArt, storeArt } from './commercial.js';
import { barnArt, industrialArt } from './rural.js';
import { venueArt } from './venues.js';
import { drawOpening, houseOpenings } from '../openings/index.js';
import { tex } from '../scenery/objects.js';
import { fishSegs, tudorTimbers, wallTexture } from '../textures.js';
import { EDIT, S } from '../../config/state.js';
import { poly } from '../../lib/draw.js';
import { bbox, circ, clipAll, edgeBand, rectP } from '../../lib/geometry.js';
import { rng, shade } from '../../lib/math.js';

export function wallArt(f) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1,
    F = B.found,
    H = B.H;
  const it = [poly(P, { fill: c.wall })];
  let tex = wallTexture(B.finish === 'tudor' ? 'stucco' : B.finish, P, F, rng(f.id * 97 + 13));
  if (B.gableFish && bb.y1 > H + 1) {
    tex = tex.filter(([a, b]) => (a[1] + b[1]) / 2 < H);
    tex.push(...clipAll(fishSegs(P, H + 0.4), P).filter(([a, b]) => (a[1] + b[1]) / 2 > H + 0.2));
  }
  it.push({ t: 'segs', s: tex, stroke: c.wallLine, w: 0.3 });
  if (B.finish === 'log' && A.role !== 'party' && B.type !== 'dormer') {
    for (let y = F + 0.42; y < Math.min(H, bb.y1) - 0.2; y += 0.85)
      [0.42, w - 0.42].forEach(x => {
        it.push(
          poly(circ(x, y, 0.4, 10), {
            fill: c.L ? '#ffffff' : shade(c.wall, 0.25),
            stroke: c.wallLine,
            w: 0.25
          }),
          poly(circ(x, y, 0.2, 8), { stroke: c.wallLine, w: 0.2 })
        );
      });
  }
  if (B.finish === 'tudor' && B.type !== 'dormer') it.push(...tudorTimbers(P, B, c));
  if (F > 0 && B.type !== 'dormer') {
    it.push(poly(rectP(0, 0, w, F), { fill: c.found, stroke: c.foundLine, w: 0.3 }));
    const fs = [];
    for (let y = 8 / 12; y < F; y += 8 / 12)
      fs.push([
        [0, y],
        [w, y]
      ]);
    it.push({ t: 'segs', s: fs, stroke: c.foundLine, w: 0.25 });
  }
  const pitched = B.roof !== 'flat';
  const n = P.length;
  if (B.type === 'tower') {
    f.tag.forEach((t, i) => {
      if (t === 'top')
        it.push(
          poly(edgeBand(P[i], P[(i + 1) % n], 0.45), {
            fill: c.L ? '#ffffff' : shade(c.wall, -0.12),
            stroke: c.wallLine,
            w: 0.25
          })
        );
    });
    it.push(...towerArt(f, w, P));
    return it;
  }
  if (B.type === 'dormer') {
    f.tag.forEach((t, i) => {
      if (t === 'top')
        it.push(poly(edgeBand(P[i], P[(i + 1) % n], 0.35), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
    });
    if (A.role === 'dormer') {
      const ww = Math.min(2.8, w - 1.4),
        wh = Math.min(3.6, B.H - bb.y0 - 1.1);
      if (wh > 1.2)
        it.push(
          ...drawOpening({ type: 'win', x: w / 2 - ww / 2, y: bb.y0 + 0.7, w: ww, h: wh, attic: true }, c, {
            winStyle: B.winStyle,
            spooky: B.spooky
          })
        );
    }
    return it;
  }
  if (
    (B.type === 'house' || B.type === 'barn') &&
    ['siding', 'batten', 'shingle'].includes(B.finish) &&
    A.role !== 'party'
  ) {
    it.push(
      poly(rectP(0, F, 0.45, H - F), { fill: c.trim, stroke: c.trimLine, w: 0.25 }),
      poly(rectP(w - 0.45, F, 0.45, H - F), { fill: c.trim, stroke: c.trimLine, w: 0.25 })
    );
  }
  if (pitched && B.roof !== 'saw')
    it.push(poly(rectP(0, H - 0.6, w, 0.6), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
  const cop = B.type === 'castle' ? (c.L ? '#ffffff' : shade(c.wall, -0.12)) : c.trim;
  f.tag.forEach((t, i) => {
    if (t === 'top')
      it.push(
        poly(edgeBand(P[i], P[(i + 1) % n], pitched ? 0.5 : 0.45), {
          fill: cop,
          stroke: B.type === 'castle' ? c.wallLine : c.trimLine,
          w: 0.25
        })
      );
  });
  const ck = A.key && S.custom && S.custom[A.key],
    skipO = A.key && EDIT.skip === A.key;
  const drawCustom = () => {
    if (ck && !skipO)
      ck.forEach(o => it.push(...drawOpening(o, c, Object.assign({}, B, { winStyle: o.style || 'rect' }))));
  };
  if (B.type === 'house') {
    if (ck) drawCustom();
    else if (!skipO) houseOpenings(f).forEach(o => it.push(...drawOpening(o, c, B)));
  } else if (B.type === 'store') it.push(...storeArt(f, w, P));
  else if (B.type === 'office') it.push(...officeArt(f, w, P));
  else if (B.type === 'barn') it.push(...barnArt(f, w, P));
  else if (B.type === 'castle') it.push(...castleArt(f, w, P));
  else if (B.type === 'venue') it.push(...venueArt(f, w, P));
  else if (B.type === 'industrial') it.push(...industrialArt(f, w, P));
  else if (B.type === 'civic') it.push(...civicArt(f, w, P));
  else if (B.type === 'garden') it.push(...gardenArt(f, w, P));
  else it.push(...roadArt(f, w, P));
  if (B.type !== 'house') drawCustom();
  return it;
}
