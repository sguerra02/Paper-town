/* Unfolds groups of faces flat into printable pieces with glue tabs and fold lines. */
import { artFor } from '../art/index.js';
import { CUT, FOLD, LABEL, MM, TABFILL, THICK } from '../config/constants.js';
import { S } from '../config/state.js';
import { mapItems, pl, poly, txt } from '../lib/draw.js';
import { inPoly, insetPoly } from '../lib/geometry.js';
import { clamp } from '../lib/math.js';

export const applyT = (t, p) => [t.c * p[0] - t.s * p[1] + t.tx, t.s * p[0] + t.c * p[1] + t.ty];

export function unfold(M, fids, pref) {
  const T = new Map(),
    fold = new Set();
  T.set(fids[0], { c: 1, s: 0, tx: 0, ty: 0, ang: 0 });
  for (let q = 1; q < fids.length; q++) {
    const f = M.faces[fids[q]];
    let placed = false;
    const cands =
      pref === 'root'
        ? [fids[0], ...fids.slice(0, q).reverse()]
        : [fids[q - 1], ...fids.slice(0, q).reverse()];
    for (const gid of cands) {
      if (!T.has(gid)) continue;
      const g = M.faces[gid],
        tg = T.get(gid),
        n = f.pts.length,
        m = g.pts.length;
      for (let i = 0; i < n && !placed; i++) {
        const pr = M.partner(f, i);
        if (!pr || pr.f !== gid) continue;
        const j = pr.i;
        const A = applyT(tg, g.l2[(j + 1) % m]),
          Bp = applyT(tg, g.l2[j]),
          a = f.l2[i],
          b = f.l2[(i + 1) % n];
        const ang = Math.atan2(Bp[1] - A[1], Bp[0] - A[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
        const c = Math.cos(ang),
          s = Math.sin(ang);
        T.set(f.id, { c, s, tx: A[0] - (c * a[0] - s * a[1]), ty: A[1] - (s * a[0] + c * a[1]), ang });
        fold.add(f.id + ':' + i);
        fold.add(gid + ':' + j);
        placed = true;
      }
      if (placed) break;
    }
    if (!placed) return null;
  }
  return { T, fold };
}

export function segCross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const e = 1e-7;
  const d1 = o(c, d, a),
    d2 = o(c, d, b),
    d3 = o(a, b, c),
    d4 = o(a, b, d);
  return ((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e));
}

export function overlap(P, Q) {
  for (let i = 0; i < P.length; i++)
    for (let j = 0; j < Q.length; j++)
      if (segCross(P[i], P[(i + 1) % P.length], Q[j], Q[(j + 1) % Q.length])) return true;
  const cen = R => {
    let x = 0,
      y = 0;
    R.forEach(p => {
      x += p[0];
      y += p[1];
    });
    return [x / R.length, y / R.length];
  };
  return inPoly(cen(P), Q) || inPoly(cen(Q), P);
}

export function makeTab(a, b, d) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy) || 1;
  const t = [dx / len, dy / len],
    n = [t[1], -t[0]];
  const ins = Math.min(d, len * 0.45);
  return [
    a,
    [a[0] + n[0] * d + t[0] * ins, a[1] + n[1] * d + t[1] * ins],
    [b[0] + n[0] * d - t[0] * ins, b[1] + n[1] * d - t[1] * ins],
    b
  ];
}

export function toPaper(items, k) {
  return items.map(it => {
    if (it.t === 'text')
      return Object.assign({}, it, {
        x: it.x * k,
        y: -it.y * k,
        ang: -it.ang,
        size: it.sizeFt ? it.sizeFt * k * 72 : it.size,
        sizeFt: undefined
      });
    const m = p => [p[0] * k, -p[1] * k];
    if (it.t === 'segs') return Object.assign({}, it, { s: it.s.map(([a, b]) => [m(a), m(b)]) });
    return Object.assign({}, it, { p: it.p.map(m) });
  });
}

export function finalize(id, title, items) {
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1e9,
    y1 = -1e9;
  const see = p => {
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  };
  items.forEach(it => {
    if (it.p) it.p.forEach(see);
    if (it.t === 'segs')
      it.s.forEach(([a, b]) => {
        see(a);
        see(b);
      });
  });
  const shifted = mapItems(items, ([x, y]) => [x - x0, y - y0 + LABEL]);
  const label = `${id} · ${title}`;
  shifted.push(
    Object.assign(txt(label, 0, LABEL - 0.05, { size: 6.5, bold: true, fill: '#222222' }), { isLabel: true })
  );
  return {
    id,
    title,
    items: shifted,
    w: Math.max(x1 - x0, (label.length * 6.5 * 0.52) / 72),
    h: y1 - y0 + LABEL
  };
}

export function buildPiece(M, id, title, fids, pref, k, d, art, tpFt, check) {
  const U = unfold(M, fids, pref);
  if (!U) return null;
  const nets = fids.map(fid => {
    const f = M.faces[fid],
      t = U.T.get(fid);
    let l2 = f.l2;
    if (f.art.kind === 'base' || f.art.kind === 'pad') l2 = insetPoly(l2, tpFt);
    return { f, t, l2, net: l2.map(p => applyT(t, p)) };
  });
  if (check && nets.length > 1) {
    for (let i = 0; i < nets.length; i++)
      for (let j = i + 1; j < nets.length; j++) if (overlap(nets[i].net, nets[j].net)) return null;
  }
  const items = [],
    tabs = [],
    cuts = [],
    folds = [];
  const dFt = d / k;
  nets.forEach(({ f, t, l2, net }) => {
    if (art) {
      const fa = f.art.kind === 'base' || f.art.kind === 'pad' ? Object.assign({}, f, { l2 }) : f;
      const ai = mapItems(artFor(fa), p => applyT(t, p), (t.ang * 180) / Math.PI);
      ai[0] = Object.assign({}, ai[0], { sil: true });
      items.push(...ai);
    } else items.push(poly(net, { sil: true }));
    const n = net.length;
    for (let i = 0; i < n; i++) {
      const a = net[i],
        b = net[(i + 1) % n],
        key = f.id + ':' + i;
      if (U.fold.has(key)) {
        const pr = M.partner(f, i);
        if (!pr || pr.f > f.id) folds.push([a, b]);
        continue;
      }
      const lab = f.edge[i];
      let tab = lab === 'attach';
      if (lab === 'auto') {
        const pr = M.partner(f, i);
        if (pr && pr.f < f.id && !f.noTab) tab = true;
      }
      (tab ? tabs : cuts).push([a, b]);
    }
  });
  tabs.forEach(([a, b]) => {
    const tp = makeTab(a, b, dFt);
    items.push(poly(tp, { fill: TABFILL, sil: true }), pl(tp, CUT));
    folds.push([a, b]);
  });
  folds.forEach(e => items.push(pl(e, { stroke: '#ffffff', w: 1.1 }), pl(e, FOLD)));
  cuts.forEach(e => items.push(pl(e, CUT)));
  return finalize(id, title, toPaper(items, k));
}

export const fits = (p, a) =>
  (p.w <= a.w + 1e-6 && p.h <= a.h + 1e-6) || (p.h <= a.w + 1e-6 && p.w <= a.h + 1e-6);

export const letterName = i =>
  i < 26
    ? String.fromCharCode(65 + i)
    : String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));

export function buildPieces(M, den, area, art) {
  const k = 12 / den,
    tpFt = (THICK[S.thick] * MM) / k,
    d = clamp(M.maxH * k * 0.12, 0.13, 0.26);
  const pieces = [];
  M.groups.forEach((g, gi) => {
    const L = letterName(gi);
    const opts = [[g.faces]];
    if (g.mid) opts.push(g.mid);
    if (g.faces.length > 1) opts.push(g.faces.map(f => [f]));
    const nm = fs =>
      fs.length === g.faces.length
        ? g.title
        : g.title + ': ' + [...new Set(fs.map(f => M.faces[f].name))].join(' + ');
    let chosen = null,
      bestOp = null,
      bestN = 1e9;
    const secs = p => {
      const f = (w, h) => Math.ceil(w / (area.w - 0.3)) * Math.ceil(h / (area.h - 0.5));
      return Math.min(f(p.w, p.h), f(p.h, p.w));
    };
    for (const op of opts) {
      const ps = op.map((fs, i) =>
        buildPiece(M, op.length > 1 ? L + (i + 1) : L, nm(fs), fs, g.pref, k, d, false, tpFt, g.check)
      );
      if (ps.some(p => !p)) continue;
      if (!area || ps.every(p => fits(p, area))) {
        chosen = op;
        break;
      }
      const n = ps.reduce((a, p) => a + secs(p), 0);
      if (n < bestN) {
        bestN = n;
        bestOp = op;
      }
    }
    if (!chosen) chosen = bestOp || opts[opts.length - 1];
    chosen.forEach((fs, i) => {
      const p = buildPiece(
        M,
        chosen.length > 1 ? L + (i + 1) : L,
        nm(fs),
        fs,
        g.pref,
        k,
        d,
        art,
        tpFt,
        false
      );
      if (p) {
        p.sheet = g.sheet || '';
        pieces.push(p);
      }
    });
  });
  return pieces;
}
