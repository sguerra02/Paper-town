/* Splits parts that are bigger than the sheet into sections with glue strips. */
import { CUT, LABEL, TABFILL } from '../config/constants.js';
import { mapItems, poly, txt } from '../lib/draw.js';
import { bbox } from '../lib/geometry.js';
import { finalize } from './unfold.js';

export function clipPolyRect(P, r) {
  let out = P;
  const hp = [
    [1, 0, -r.x0],
    [-1, 0, r.x1],
    [0, 1, -r.y0],
    [0, -1, r.y1]
  ];
  for (const [a, b, c] of hp) {
    const inp = out;
    out = [];
    if (!inp.length) break;
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i],
        prv = inp[(i - 1 + inp.length) % inp.length];
      const fc = a * cur[0] + b * cur[1] + c,
        fp = a * prv[0] + b * prv[1] + c;
      const X = () => {
        const t = fp / (fp - fc);
        return [prv[0] + (cur[0] - prv[0]) * t, prv[1] + (cur[1] - prv[1]) * t];
      };
      if (fc >= 0) {
        if (fp < 0) out.push(X());
        out.push(cur);
      } else if (fp >= 0) out.push(X());
    }
  }
  return out;
}

export function clipSegRect(a, b, r) {
  let t0 = 0,
    t1 = 1;
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const ch = (p, q) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (
    ch(-dx, a[0] - r.x0) &&
    ch(dx, r.x1 - a[0]) &&
    ch(-dy, a[1] - r.y0) &&
    ch(dy, r.y1 - a[1]) &&
    t1 - t0 > 1e-9
  )
    return [
      [a[0] + dx * t0, a[1] + dy * t0],
      [a[0] + dx * t1, a[1] + dy * t1]
    ];
  return null;
}

export function clipItems(items, r) {
  const out = [];
  items.forEach(it => {
    if (it.t === 'poly') {
      const q = clipPolyRect(it.p, r);
      if (q.length >= 3) out.push(Object.assign({}, it, { p: q }));
    } else if (it.t === 'pl' || it.t === 'segs') {
      const src = it.t === 'pl' ? it.p.slice(1).map((p, i) => [it.p[i], p]) : it.s;
      const s = [];
      src.forEach(([a, b]) => {
        const c = clipSegRect(a, b, r);
        if (c) s.push(c);
      });
      if (s.length) out.push({ t: 'segs', s, stroke: it.stroke, w: it.w, dash: it.dash });
    } else if (it.t === 'text') {
      const hw = (it.s.length * it.size * 0.55) / 72 / (it.anchor === 'middle' ? 2 : 1);
      const vert = Math.abs(Math.sin((it.ang * Math.PI) / 180)) > 0.7;
      const ex = vert ? 0.05 : hw,
        ey = vert ? hw : 0.05;
      if (it.x - ex >= r.x0 && it.x + ex <= r.x1 && it.y - ey >= r.y0 && it.y + ey <= r.y1) out.push(it);
    }
  });
  return out;
}

export const GLUE = 0.3;

export function splitPiece(p, area) {
  const content = p.items.filter(it => !it.isLabel).map(it => it);
  const hc = p.h - LABEL;
  const base = mapItems(content, ([x, y]) => [x, y - LABEL]);
  const need = (w, h) => ({
    nx: w <= area.w + 1e-6 ? 1 : Math.ceil(w / (area.w - GLUE)),
    ny: h + LABEL <= area.h + 1e-6 ? 1 : Math.ceil(h / (area.h - LABEL - GLUE))
  });
  const A = need(p.w, hc),
    Bn = need(hc, p.w);
  let items = base,
    W = p.w,
    Hh = hc,
    g = A;
  if (Bn.nx * Bn.ny < A.nx * A.ny) {
    items = mapItems(base, ([x, y]) => [hc - y, x], 90);
    W = hc;
    Hh = p.w;
    g = Bn;
  }
  const sx = W / g.nx,
    sy = Hh / g.ny,
    N = g.nx * g.ny;
  const out = [];
  const sil = items.filter(it => it.sil && it.t === 'poly');
  const sid = (ix, iy) => `${p.id}.${iy * g.nx + ix + 1}`;
  for (let iy = 0; iy < g.ny; iy++)
    for (let ix = 0; ix < g.nx; ix++) {
      const r = {
        x0: ix * sx - (ix > 0 ? GLUE : 0),
        x1: (ix + 1) * sx,
        y0: iy * sy - (iy > 0 ? GLUE : 0),
        y1: (iy + 1) * sy
      };
      const it = clipItems(items, r);
      const seams = [];
      const addZone = (z, label, vertical) => {
        const polys = sil.map(s => clipPolyRect(s.p, z)).filter(q => q.length >= 3);
        if (!polys.length) return;
        polys.forEach(q => it.push(poly(q, { fill: TABFILL })));
        const zb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
        polys.forEach(q =>
          q.forEach(pt => {
            zb.x0 = Math.min(zb.x0, pt[0]);
            zb.y0 = Math.min(zb.y0, pt[1]);
            zb.x1 = Math.max(zb.x1, pt[0]);
            zb.y1 = Math.max(zb.y1, pt[1]);
          })
        );
        const cx = (zb.x0 + zb.x1) / 2,
          cy = (zb.y0 + zb.y1) / 2;
        it.push(
          txt(label, vertical ? cx + 0.03 : cx, vertical ? cy : cy + 0.03, {
            size: 5,
            anchor: 'middle',
            ang: vertical ? 90 : 0,
            fill: '#666666'
          })
        );
      };
      if (ix > 0)
        addZone({ x0: r.x0, x1: r.x0 + GLUE, y0: r.y0, y1: r.y1 }, 'glue under ' + sid(ix - 1, iy), true);
      if (iy > 0)
        addZone({ x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y0 + GLUE }, 'glue under ' + sid(ix, iy - 1), false);
      const edgesAt = (axis, v) => {
        sil.forEach(s => {
          const q = clipPolyRect(s.p, r);
          for (let i = 0; i < q.length; i++) {
            const a = q[i],
              b = q[(i + 1) % q.length];
            if (Math.abs(a[axis] - v) < 1e-6 && Math.abs(b[axis] - v) < 1e-6) seams.push([a, b]);
          }
        });
      };
      if (ix > 0) edgesAt(0, r.x0);
      if (ix < g.nx - 1) edgesAt(0, r.x1);
      if (iy > 0) edgesAt(1, r.y0);
      if (iy < g.ny - 1) edgesAt(1, r.y1);
      if (ix > 0) {
        const sg = [];
        sil.forEach(s => {
          const q = clipPolyRect(s.p, { x0: r.x0 + GLUE - 1e-4, x1: r.x0 + GLUE + 1e-4, y0: r.y0, y1: r.y1 });
          if (q.length >= 3) {
            const b = bbox(q);
            sg.push([
              [r.x0 + GLUE, b.y0],
              [r.x0 + GLUE, b.y1]
            ]);
          }
        });
        if (sg.length) it.push({ t: 'segs', s: sg, stroke: '#888888', w: 0.4, dash: [1, 1.2] });
      }
      if (iy > 0) {
        const sg = [];
        sil.forEach(s => {
          const q = clipPolyRect(s.p, { x0: r.x0, x1: r.x1, y0: r.y0 + GLUE - 1e-4, y1: r.y0 + GLUE + 1e-4 });
          if (q.length >= 3) {
            const b = bbox(q);
            sg.push([
              [b.x0, r.y0 + GLUE],
              [b.x1, r.y0 + GLUE]
            ]);
          }
        });
        if (sg.length) it.push({ t: 'segs', s: sg, stroke: '#888888', w: 0.4, dash: [1, 1.2] });
      }
      if (seams.length) it.push({ t: 'segs', s: seams, stroke: CUT.stroke, w: CUT.w });
      if (it.some(q => q.t === 'poly'))
        out.push(finalize(sid(ix, iy), `${p.title} (section ${iy * g.nx + ix + 1} of ${N})`, it));
    }
  return out;
}
