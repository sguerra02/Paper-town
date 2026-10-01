/* Paper sizes, scale resolution and packing pieces onto sheets. */
import { FOOTER, GAP, HEADER, MARGIN, PAPERS } from '../config/constants.js';
import { S } from '../config/state.js';
import { clamp } from '../lib/math.js';
import { buildPieces, fits } from './unfold.js';

export function paperSize(orient) {
  const p = PAPERS[S.paper];
  return orient === 'landscape' ? { w: p.h, h: p.w } : { w: p.w, h: p.h };
}

export function areaFor(sz) {
  return { w: sz.w - 2 * MARGIN, h: sz.h - 2 * MARGIN - FOOTER };
}

export function pack(pieces, sz) {
  const keys = [...new Set(pieces.map(p => p.sheet || ''))].sort((a, b) => (a ? 1 : 0) - (b ? 1 : 0));
  if (keys.length > 1) {
    const all = [];
    keys.forEach(k => {
      const pg = packOne(
        pieces.filter(p => (p.sheet || '') === k),
        sz,
        !all.length
      );
      all.push(...pg);
    });
    return all;
  }
  return packOne(pieces, sz, true);
}

export function packOne(pieces, sz, withHeader) {
  const aw = sz.w - 2 * MARGIN,
    ah = sz.h - 2 * MARGIN - FOOTER;
  const pages = [];
  const newPage = () => {
    const first = !pages.length && withHeader;
    const pg = { used: first ? HEADER : 0, shelves: [], place: [], first };
    pages.push(pg);
    return pg;
  };
  newPage();
  const oriented = pieces
    .map(p => {
      const c = [];
      if (p.w <= aw && p.h <= ah) c.push({ rot: false, w: p.w, h: p.h });
      if (p.h <= aw && p.w <= ah) c.push({ rot: true, w: p.h, h: p.w });
      let o = c.sort((a, b) => a.h - b.h)[0];
      const over = !o;
      if (!o) o = { rot: false, w: p.w, h: p.h };
      return Object.assign({ p, over }, o);
    })
    .sort((a, b) => b.h - a.h);
  const tryPage = (pg, o) => {
    for (const sh of pg.shelves) {
      if (sh.x + o.w <= aw + 1e-6 && o.h <= sh.h + 1e-6) {
        pg.place.push({ o, x: MARGIN + sh.x, y: MARGIN + sh.y });
        sh.x += o.w + GAP;
        return true;
      }
    }
    const y = pg.used + (pg.shelves.length ? GAP : 0);
    if (y + o.h <= ah + 1e-6 && o.w <= aw + 1e-6) {
      pg.shelves.push({ y, h: o.h, x: o.w + GAP });
      pg.used = y + o.h;
      pg.place.push({ o, x: MARGIN, y: MARGIN + y });
      return true;
    }
    return false;
  };
  oriented.forEach(o => {
    if (o.over) {
      const pg = pages[pages.length - 1].place.length ? newPage() : pages[pages.length - 1];
      pg.place.push({ o, x: MARGIN, y: MARGIN + pg.used });
      pg.used = 1e9;
      return;
    }
    if (!pages.some(pg => tryPage(pg, o))) tryPage(newPage(), o);
  });
  return pages;
}

export function fitDen(M) {
  const a = areaFor(paperSize('portrait'));
  const ok = den => buildPieces(M, den, a, false).every(p => fits(p, a));
  let lo = 5,
    hi = 600;
  if (!ok(hi)) return hi;
  if (ok(lo)) return lo;
  while (hi - lo > 1) {
    const m = Math.floor((lo + hi) / 2);
    if (ok(m)) hi = m;
    else lo = m;
  }
  return hi;
}

export function resolveDen(M) {
  if (S.scale === 'custom') return clamp(Math.round(+S.customDen || 84), 5, 1000);
  if (S.scale === 'fit') return fitDen(M);
  return +S.scale;
}
