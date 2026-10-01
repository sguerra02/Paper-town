/* Faces are the building blocks of every model: a flat polygon in 3D with edge roles for tabs, folds and cuts. */
import { Vadd, Vcross, Vdot, Vmul, Vnorm, Vsub, newell } from '../lib/geometry.js';

export function mkFace(M, pts, o) {
  let fr = o.frame;
  if (!fr) {
    const n = newell(pts);
    let u = Vcross([0, 1, 0], n);
    if (Math.hypot(u[0], u[1], u[2]) < 1e-6) u = [1, 0, 0];
    u = Vnorm(u);
    const v = Vcross(n, u);
    const ox = Math.min(...pts.map(p => Vdot(p, u))),
      oy = Math.min(...pts.map(p => Vdot(p, v)));
    fr = { u, v, n, o: Vadd(Vadd(Vmul(u, ox), Vmul(v, oy)), Vmul(n, Vdot(pts[0], n))) };
  }
  const l2 = pts.map(p => {
    const d = Vsub(p, fr.o);
    return [Vdot(d, fr.u), Vdot(d, fr.v)];
  });
  const f = {
    id: M.faces.length,
    pts,
    fr,
    l2,
    edge: o.edge || pts.map(() => 'auto'),
    tag: o.tag || pts.map(() => ''),
    art: o.art || { kind: 'plain' },
    name: o.name || '',
    noPreview: !!o.noPreview,
    noTab: !!o.noTab
  };
  M.faces.push(f);
  return f.id;
}

export function wallFace(M, o3, u, poly2, opts) {
  const v = [0, 1, 0],
    n = Vcross(u, v);
  const pts = poly2.map(([x, y]) => Vadd(o3, Vadd(Vmul(u, x), Vmul(v, y))));
  return mkFace(M, pts, Object.assign({ frame: { o: o3, u, v, n } }, opts));
}

export function tmpFrame(pts) {
  const n = newell(pts);
  let u = Vcross([0, 1, 0], n);
  if (Math.hypot(u[0], u[1], u[2]) < 1e-6) u = [1, 0, 0];
  u = Vnorm(u);
  const v = Vcross(n, u);
  const ox = Math.min(...pts.map(p => Vdot(p, u))),
    oy = Math.min(...pts.map(p => Vdot(p, v)));
  return { u, v, n, o: Vadd(Vadd(Vmul(u, ox), Vmul(v, oy)), Vmul(n, Vdot(pts[0], n))) };
}

export const loc = (fr, p) => {
  const d = Vsub(p, fr.o);
  return [Vdot(d, fr.u), Vdot(d, fr.v)];
};

export const unloc = (fr, q) => Vadd(fr.o, Vadd(Vmul(fr.u, q[0]), Vmul(fr.v, q[1])));

export function baseFace(M, B, wings) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2;
  let Q = [[xL, -zF]];
  (wings || [])
    .slice()
    .sort((p, q) => p.a - q.a)
    .forEach(w => {
      Q.push([w.a, -zF], [w.a, -zF - w.P], [w.b, -zF - w.P], [w.b, -zF]);
    });
  Q.push([xR, -zF], [xR, -zB], [xL, -zB]);
  const D = [];
  Q.forEach(p => {
    const l = D[D.length - 1];
    if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) D.push(p);
  });
  if (Math.hypot(D[0][0] - D[D.length - 1][0], D[0][1] - D[D.length - 1][1]) < 1e-6) D.pop();
  const C = [];
  for (let i = 0; i < D.length; i++) {
    const a = D[(i - 1 + D.length) % D.length],
      b = D[i],
      c = D[(i + 1) % D.length];
    if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-9) C.push(b);
  }
  return mkFace(
    M,
    C.map(([x, y]) => [x, 0, -y]),
    { edge: C.map(() => 'free'), art: { kind: 'base', pal: B.pal }, name: 'Base', noPreview: true }
  );
}

export function boxFaces(M, x0, x1, y0, y1, z0, z1, arts, withBottom, names) {
  const F = {};
  const e4 = ['auto', 'auto', 'auto', 'auto'];
  if (withBottom)
    F.bottom = mkFace(
      M,
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1]
      ],
      { edge: e4, art: arts.bottom, name: names.bottom || 'Bottom' }
    );
  const sideEdge = withBottom ? e4 : ['attach', 'auto', 'auto', 'auto'];
  F.front = mkFace(
    M,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1]
    ],
    { edge: sideEdge, art: arts.front, name: names.front || 'Front' }
  );
  F.right = mkFace(
    M,
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1]
    ],
    { edge: sideEdge, art: arts.right, name: names.right || 'Right' }
  );
  F.back = mkFace(
    M,
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0]
    ],
    { edge: sideEdge, art: arts.back, name: names.back || 'Back' }
  );
  F.left = mkFace(
    M,
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0]
    ],
    { edge: sideEdge, art: arts.left, name: names.left || 'Left' }
  );
  F.top = mkFace(
    M,
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0]
    ],
    { edge: e4, art: arts.top, name: names.top || 'Top' }
  );
  return F;
}
