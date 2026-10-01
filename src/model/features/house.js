/* House features: porches, dormers and chimneys. */
import { Vdot, rectP, subtractConvex } from '../../lib/geometry.js';
import { ridgeInfo } from '../building/roofs.js';
import { loc, mkFace, tmpFrame, unloc, wallFace } from '../faces.js';

export function buildChimney(M, B, xc, label) {
  const ri = ridgeInfo(B);
  if (!ri) return;
  const c = 2.4,
    d = 2.4,
    top = ri.yr + 3.5,
    x0 = xc - c / 2,
    x1 = xc + c / 2,
    cz = B.cz,
    z0 = cz - d / 2,
    z1 = cz + d / 2,
    yb = ri.yr - (d / 2) * ri.t,
    yr = ri.yr;
  const art = { kind: 'chimney', pal: B.pal, brick: B.finish === 'brick' ? B.col.wall : '#8a4535' };
  const ids = [
    mkFace(
      M,
      [
        [x0, yb, z1],
        [x1, yb, z1],
        [x1, top, z1],
        [x0, top, z1]
      ],
      { edge: ['attach', 'auto', 'auto', 'auto'], art, name: 'Chimney' }
    ),
    mkFace(
      M,
      [
        [x1, yb, z1],
        [x1, yr, cz],
        [x1, yb, z0],
        [x1, top, z0],
        [x1, top, z1]
      ],
      { edge: ['attach', 'attach', 'auto', 'auto', 'auto'], art, name: 'Chimney' }
    ),
    mkFace(
      M,
      [
        [x1, yb, z0],
        [x0, yb, z0],
        [x0, top, z0],
        [x1, top, z0]
      ],
      { edge: ['attach', 'auto', 'auto', 'auto'], art, name: 'Chimney' }
    ),
    mkFace(
      M,
      [
        [x0, yb, z0],
        [x0, yr, cz],
        [x0, yb, z1],
        [x0, top, z1],
        [x0, top, z0]
      ],
      { edge: ['attach', 'attach', 'auto', 'auto', 'auto'], art, name: 'Chimney' }
    ),
    mkFace(
      M,
      [
        [x0, top, z1],
        [x1, top, z1],
        [x1, top, z0],
        [x0, top, z0]
      ],
      { edge: ['auto', 'auto', 'auto', 'auto'], art: { kind: 'chimTop', pal: B.pal }, name: 'Chimney cap' }
    )
  ];
  M.groups.push({ title: label, faces: ids, pref: 'chain', check: true });
}

/* covered porch: shed roof on posts + floor box */
export function buildPorch(M, B, x0, x1, tall) {
  const zF = B.cz + B.D / 2,
    P = tall ? 10 : 7,
    fh = Math.max(0.6, B.found),
    tp = 3 / 12,
    pal = B.pal;
  const ytop = tall ? B.H - 1.0 : B.stories > 1 ? B.found + B.storyH + 0.2 : B.H - 1.3,
    ov = 0.8,
    zo = zF + P + ov,
    yl = ytop - (P + ov) * tp;
  const roof = mkFace(
    M,
    [
      [x0 - 0.5, yl, zo],
      [x1 + 0.5, yl, zo],
      [x1 + 0.5, ytop, zF],
      [x0 - 0.5, ytop, zF]
    ],
    {
      edge: ['free', 'free', 'attach', 'free'],
      tag: ['eave', 'rake', '', 'rake'],
      art: { kind: 'roof', finish: B.roofFinish, pal },
      name: 'Porch roof'
    }
  );
  M.groups.push({ title: tall ? 'Portico roof' : 'Porch roof', faces: [roof] });
  const zp = zF + P,
    fa = { kind: 'porchDeck', pal },
    sa = { kind: 'porchSkirt', pal };
  const top = mkFace(
    M,
    [
      [x0, fh, zp],
      [x1, fh, zp],
      [x1, fh, zF],
      [x0, fh, zF]
    ],
    { edge: ['auto', 'auto', 'attach', 'auto'], art: fa, name: 'Porch floor' }
  );
  const fr = mkFace(
    M,
    [
      [x0, 0, zp],
      [x1, 0, zp],
      [x1, fh, zp],
      [x0, fh, zp]
    ],
    { edge: ['attach', 'auto', 'auto', 'auto'], art: Object.assign({ steps: true }, sa), name: 'Porch front' }
  );
  const rs = mkFace(
    M,
    [
      [x1, 0, zp],
      [x1, 0, zF],
      [x1, fh, zF],
      [x1, fh, zp]
    ],
    { edge: ['attach', 'attach', 'auto', 'auto'], art: sa, name: 'Porch side' }
  );
  const ls = mkFace(
    M,
    [
      [x0, 0, zF],
      [x0, 0, zp],
      [x0, fh, zp],
      [x0, fh, zF]
    ],
    { edge: ['attach', 'auto', 'auto', 'attach'], art: sa, name: 'Porch side' }
  );
  M.groups.push({ title: 'Porch floor', faces: [top, fr, rs, ls], pref: 'root', check: true });
  const n = Math.max(2, Math.ceil((x1 - x0) / (tall ? 7 : 9)) + 1),
    s = tall ? 1.3 : 0.7,
    pz = zF + P - 0.4,
    ph = ytop - (P - 0.4) * tp - fh;
  const ids = [];
  for (let i = 0; i < n; i++) {
    const px = x0 + 0.5 + ((x1 - x0 - 1) * i) / (n - 1);
    const E = ['attach', 'auto', 'attach', 'auto'],
      art = { kind: 'column', pal, tall };
    const q = [];
    q.push(
      wallFace(M, [px - s / 2, fh, pz + s / 2], [1, 0, 0], rectP(0, 0, s, ph), {
        edge: E,
        art,
        name: 'Column'
      })
    );
    q.push(
      wallFace(M, [px + s / 2, fh, pz + s / 2], [0, 0, -1], rectP(0, 0, s, ph), {
        edge: E,
        art,
        name: 'Column'
      })
    );
    q.push(
      wallFace(M, [px + s / 2, fh, pz - s / 2], [-1, 0, 0], rectP(0, 0, s, ph), {
        edge: E,
        art,
        name: 'Column'
      })
    );
    q.push(
      wallFace(M, [px - s / 2, fh, pz - s / 2], [0, 0, 1], rectP(0, 0, s, ph), {
        edge: E,
        art,
        name: 'Column'
      })
    );
    ids.push(q);
  }
  ids.forEach((q, i) =>
    M.groups.push({
      title: `${tall ? 'Column' : 'Porch post'} ${i + 1}`,
      faces: q,
      pref: 'chain',
      mid: [
        [q[0], q[1]],
        [q[2], q[3]]
      ]
    })
  );
}

/* gable roof sitting on a main roof (dormers), clipped at the main roof */
export function roofOnRoof(M, a, bx, zFront, zBack, plate, t, e, planes, pal, finish, name) {
  const cxw = (a + bx) / 2,
    yr = plate + ((bx - a) / 2) * t,
    ye = plate - e * t,
    xlo = a - e,
    xhi = bx + e;
  const raw = [
    {
      pts: [
        [xlo, ye, zBack],
        [xlo, ye, zFront],
        [cxw, yr, zFront],
        [cxw, yr, zBack]
      ],
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'rake', 'ridge', 'back'],
      name: name + ' left'
    },
    {
      pts: [
        [xhi, ye, zFront],
        [xhi, ye, zBack],
        [cxw, yr, zBack],
        [cxw, yr, zFront]
      ],
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'back', 'ridge', 'rake'],
      name: name + ' right'
    }
  ];
  const out = [];
  raw.forEach(R => {
    const fr = tmpFrame(R.pts);
    const P = R.pts.map(p => loc(fr, p));
    const lab = R.pts.map((_, i) => i);
    const hps = planes.map(pn => [Vdot(pn.n, fr.u), Vdot(pn.n, fr.v), pn.d - Vdot(pn.n, fr.o)]);
    const res = subtractConvex(P, lab, hps);
    if (!res) return;
    out.push(
      mkFace(
        M,
        res.P.map(q => unloc(fr, q)),
        {
          frame: fr,
          edge: res.lab.map(l => (l === 'valley' ? 'attach' : R.edge[l])),
          tag: res.lab.map(l => (l === 'valley' ? 'valley' : R.tag[l])),
          art: { kind: 'roof', finish, pal },
          name: R.name
        }
      )
    );
  });
  return out;
}

export function buildDormer(M, B, xc, planes, idx) {
  const t = B.pitch / 12,
    zF = B.cz + B.D / 2,
    dw = 5,
    zd = zF - 1.5,
    y0 = B.H + (zF - zd) * t,
    td = 10 / 12;
  let h = 4.6;
  const zmin = B.cz + 1.2;
  if (B.H + (zF - zmin) * t < y0 + h) h = B.H + (zF - zmin) * t - y0;
  if (h < 2.4) return;
  const yp = y0 + h,
    zb = zF - (yp - B.H) / t,
    L = zd - zb,
    x0 = xc - dw / 2,
    x1 = xc + dw / 2;
  const DB = {
    type: 'dormer',
    pal: B.pal,
    finish: B.finish === 'log' || B.finish === 'brick' || B.finish === 'stone' ? 'siding' : B.finish,
    found: y0,
    H: yp,
    roof: 'gable',
    winStyle: B.winStyle,
    spooky: B.spooky,
    stories: 1,
    storyH: h
  };
  const w = [];
  w.push(
    wallFace(
      M,
      [x0, 0, zb],
      [0, 0, 1],
      [
        [0, yp],
        [L, y0],
        [L, yp]
      ],
      { edge: ['attach', 'auto', 'attach'], name: 'Dormer side', art: { kind: 'wall', role: 'dside', B: DB } }
    )
  );
  w.push(
    wallFace(
      M,
      [x0, 0, zd],
      [1, 0, 0],
      [
        [0, y0],
        [dw, y0],
        [dw, yp],
        [dw / 2, yp + (dw / 2) * td],
        [0, yp]
      ],
      {
        edge: ['attach', 'auto', 'attach', 'attach', 'auto'],
        tag: ['', '', 'top', 'top', ''],
        name: 'Dormer front',
        art: { kind: 'wall', role: 'dormer', B: DB }
      }
    )
  );
  w.push(
    wallFace(
      M,
      [x1, 0, zd],
      [0, 0, -1],
      [
        [0, y0],
        [L, yp],
        [0, yp]
      ],
      { edge: ['attach', 'attach', 'auto'], name: 'Dormer side', art: { kind: 'wall', role: 'dside', B: DB } }
    )
  );
  M.groups.push({ title: `Dormer ${idx} walls`, faces: w, pref: 'chain' });
  const r = roofOnRoof(M, x0, x1, zd + 0.5, B.cz, yp, td, 0.4, planes, B.pal, B.roofFinish, 'Dormer roof');
  if (r.length) M.groups.push({ title: `Dormer ${idx} roof`, faces: r, pref: 'chain', check: true });
}
