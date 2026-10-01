/* 2D and 3D geometry: vectors, polygons, clipping and shape builders. Units are feet unless noted. */
import { S } from '../config/state.js';

export const rectP = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h]
];

export const Vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  Vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  Vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

export const Vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  Vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const Vnorm = a => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function newell(P) {
  let n = [0, 0, 0];
  for (let i = 0; i < P.length; i++) {
    const a = P[i],
      b = P[(i + 1) % P.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return Vnorm(n);
}

export function bbox(P) {
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1e9,
    y1 = -1e9;
  P.forEach(p => {
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  });
  return { x0, y0, x1, y1 };
}

export function inPoly(pt, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i],
      b = P[j];
    if (a[1] > pt[1] !== b[1] > pt[1] && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0])
      c = !c;
  }
  return c;
}

export function area2(P) {
  let a = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i],
      q = P[(i + 1) % P.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function clipLine(a, b, P, bb) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  if (
    bb &&
    (Math.max(a[0], b[0]) < bb.x0 ||
      Math.min(a[0], b[0]) > bb.x1 ||
      Math.max(a[1], b[1]) < bb.y0 ||
      Math.min(a[1], b[1]) > bb.y1)
  )
    return [];
  const ts = [0, 1];
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const p = P[i],
      q = P[(i + 1) % n];
    const ex = q[0] - p[0],
      ey = q[1] - p[1];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den,
      s = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / den;
    if (t > 0 && t < 1 && s >= 0 && s <= 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i],
      t1 = ts[i + 1];
    if (t1 - t0 < 1e-9) continue;
    const tm = (t0 + t1) / 2;
    if (inPoly([a[0] + dx * tm, a[1] + dy * tm], P))
      out.push([
        [a[0] + dx * t0, a[1] + dy * t0],
        [a[0] + dx * t1, a[1] + dy * t1]
      ]);
  }
  return out;
}

export function clipAll(raw, P) {
  const bb = bbox(P);
  const out = [];
  raw.forEach(([a, b]) => {
    const r = clipLine(a, b, P, bb);
    for (const s of r) out.push(s);
  });
  return out;
}

export function edgeBand(a, b, t) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = Math.hypot(dx, dy) || 1;
  const n = [(-dy / l) * t, (dx / l) * t];
  return [a, b, [b[0] + n[0], b[1] + n[1]], [a[0] + n[0], a[1] + n[1]]];
}

export function insetPoly(P, t) {
  const n = P.length;
  const lines = P.map((p, i) => {
    const q = P[(i + 1) % n];
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l,
      ny = dx / l;
    return { p: [p[0] + nx * t, p[1] + ny * t], d: [dx, dy] };
  });
  return P.map((_, i) => {
    const L1 = lines[(i - 1 + n) % n],
      L2 = lines[i];
    const den = L1.d[0] * L2.d[1] - L1.d[1] * L2.d[0];
    if (Math.abs(den) < 1e-12) return L2.p;
    const s = ((L2.p[0] - L1.p[0]) * L2.d[1] - (L2.p[1] - L1.p[1]) * L2.d[0]) / den;
    return [L1.p[0] + L1.d[0] * s, L1.p[1] + L1.d[1] * s];
  });
}

/* half-plane clipping with edge labels (for roof valleys) */
export function clipHalf(P, lab, a, b, c) {
  const out = [],
    ol = [],
    n = P.length;
  for (let i = 0; i < n; i++) {
    const p = P[i],
      q = P[(i + 1) % n];
    const fp = a * p[0] + b * p[1] - c,
      fq = a * q[0] + b * q[1] - c;
    const ip = fp <= 1e-9,
      iq = fq <= 1e-9;
    if (ip) {
      out.push(p);
      ol.push(lab[i]);
    }
    if (ip !== iq) {
      const t = fp / (fp - fq);
      const x = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      out.push(x);
      ol.push(ip ? 'CUT' : lab[i]);
    }
  }
  return { P: out, lab: ol };
}

export function dedupe(P, lab) {
  const oP = [],
    oL = [];
  for (let i = 0; i < P.length; i++) {
    const q = P[(i + 1) % P.length];
    if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) < 1e-6) continue;
    oP.push(P[i]);
    oL.push(lab[i]);
  }
  return { P: oP, lab: oL };
}

export function onSeg(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l2 = dx * dx + dy * dy;
  if (l2 < 1e-12) return -1;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  if (t < -1e-6 || t > 1 + 1e-6) return -1;
  const cx = a[0] + dx * t - p[0],
    cy = a[1] + dy * t - p[1];
  return Math.hypot(cx, cy) < 1e-5 * (1 + Math.sqrt(l2)) ? t : -1;
}

/* F minus (F ∩ C), C = intersection of half-planes. Returns {P,lab} or null (fully inside) or same */
export function subtractConvex(P, lab, hps) {
  let K = { P: P.slice(), lab: lab.map((_, i) => i) };
  for (const h of hps) {
    K = clipHalf(K.P, K.lab, h[0], h[1], h[2]);
    if (K.P.length < 3) return { P, lab };
  }
  K = dedupe(K.P, K.lab);
  if (K.P.length < 3) return { P, lab };
  const n = K.P.length;
  const isCut = K.lab.map(l => l === 'CUT');
  if (!isCut.some(Boolean)) return null;
  let blocks = 0,
    s = -1;
  for (let i = 0; i < n; i++) {
    if (isCut[i] && !isCut[(i - 1 + n) % n]) {
      blocks++;
      s = i;
    }
  }
  if (blocks !== 1) return { P, lab };
  let e = s;
  while (isCut[(e + 1) % n]) e = (e + 1) % n;
  const ks = K.P[s],
    ke = K.P[(e + 1) % n];
  const m = P.length;
  let is = -1,
    ie = -1,
    ts = 0,
    te = 0;
  for (let i = 0; i < m; i++) {
    const t = onSeg(ks, P[i], P[(i + 1) % m]);
    if (t >= 0 && is < 0) {
      is = i;
      ts = t;
    }
  }
  for (let i = 0; i < m; i++) {
    const t = onSeg(ke, P[i], P[(i + 1) % m]);
    if (t >= 0 && ie < 0) {
      ie = i;
      te = t;
    }
  }
  if (is < 0 || ie < 0) return { P, lab };
  const R = [ks],
    RL = [lab[is]];
  if (!(is === ie && te >= ts)) {
    let i = (is + 1) % m;
    let guard = 0;
    while (guard++ < m + 1) {
      R.push(P[i]);
      RL.push(lab[i]);
      if (i === ie) break;
      i = (i + 1) % m;
    }
  }
  R.push(ke);
  RL.push('valley');
  let j = e;
  while (j !== s) {
    R.push(K.P[j]);
    RL.push('valley');
    j = (j - 1 + n) % n;
  }
  const D = dedupe(R, RL);
  if (D.P.length < 3 || Math.abs(area2(D.P)) < 1e-4) return null;
  return D;
}

export function freeIntervals(w, occl) {
  let iv = [[0, w]];
  (occl || []).forEach(([a, b]) => {
    const nx = [];
    iv.forEach(([p, q]) => {
      if (b <= p || a >= q) {
        nx.push([p, q]);
        return;
      }
      if (a > p) nx.push([p, a]);
      if (b < q) nx.push([b, q]);
    });
    iv = nx;
  });
  return iv;
}

export function spread(iv, margin, spacing, ww) {
  const xs = [];
  iv.forEach(([p, q]) => {
    p += margin;
    q -= margin;
    const len = q - p;
    if (len < ww + 0.4) return;
    const n = Math.max(1, Math.floor(len / spacing));
    for (let i = 0; i < n; i++) xs.push(p + (len * (i + 0.5)) / n);
  });
  return xs;
}

export function circ(cx, cy, r, n = 12) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}

export function archPoly(x, y, w, h) {
  const r = w / 2,
    sy = y + h - r,
    p = [
      [x, y],
      [x + w, y],
      [x + w, sy]
    ];
  for (let i = 1; i < 10; i++) {
    const a = (i / 10) * Math.PI;
    p.push([x + r + r * Math.cos(a), sy + r * Math.sin(a)]);
  }
  p.push([x, sy]);
  return p;
}

export function lancetPoly(x, y, w, h) {
  const r = w,
    sy = y + h - w * 0.866,
    p = [
      [x, y],
      [x + w, y],
      [x + w, sy]
    ];
  for (let i = 1; i <= 6; i++) {
    const a = ((i / 6) * Math.PI) / 3;
    p.push([x + r * Math.cos(a), sy + r * Math.sin(a)]);
  }
  for (let i = 1; i < 6; i++) {
    const a = (2 * Math.PI) / 3 + ((i / 6) * Math.PI) / 3;
    p.push([x + w + r * Math.cos(a), sy + r * Math.sin(a)]);
  }
  p.push([x, sy]);
  return p;
}

export function clipConvex(S, C) {
  let out = S;
  const n = C.length;
  let ar = area2(C) > 0 ? 1 : -1;
  for (let i = 0; i < n && out.length; i++) {
    const a = C[i],
      b = C[(i + 1) % n];
    const f = p => ar * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const inp = out;
    out = [];
    for (let j = 0; j < inp.length; j++) {
      const cur = inp[j],
        prv = inp[(j - 1 + inp.length) % inp.length];
      const fc = f(cur),
        fp = f(prv);
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

export function ellP(cx, cy, rx, ry, a0, a1, n) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return p;
}

export function barP(p, q, th) {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    l = Math.hypot(dx, dy) || 1,
    n = [((-dy / l) * th) / 2, ((dx / l) * th) / 2];
  return [
    [p[0] + n[0], p[1] + n[1]],
    [q[0] + n[0], q[1] + n[1]],
    [q[0] - n[0], q[1] - n[1]],
    [p[0] - n[0], p[1] - n[1]]
  ];
}

export function clipConvexSafe(S, C) {
  const r = clipConvex(S, C);
  return r.length >= 3 ? r : S;
}
