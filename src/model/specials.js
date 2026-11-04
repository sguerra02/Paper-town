/* 3D builds for catalog variants that need more than a facade: cupolas, domes, barrel roofs, water and
   grain towers, open sheds, a windmill, castle ruins and more. Each builder takes the model and the
   building settings (B from baseB) and adds faces and print groups.
   Builders listed in SPECIALS replace the normal building; the helpers are shared between them. */
import { S } from '../config/state.js';
import { rectP } from '../lib/geometry.js';
import { rng } from '../lib/math.js';
import { crenelPoly, derive, buildUnit } from './building/shell.js';
import { ridgeInfo } from './building/roofs.js';
import { boxFaces, mkFace, wallFace } from './faces.js';
import { flatCanopyX } from './features/commercial.js';
import { buildTower } from './features/towers.js';
import { makePal } from './palette.js';

/* ---------- helpers ---------- */

/* mkFace, turned so its front faces away from `center` (for closed solids built from loose faces) */
function outFace(M, pts, o, center) {
  const n = pts.length;
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i],
      b = pts[(i + 1) % n];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const c = pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]);
  const d = nx * (c[0] - center[0]) + ny * (c[1] - center[1]) + nz * (c[2] - center[2]);
  if (d >= 0) return mkFace(M, pts, o);
  const flip = arr => (arr ? arr.map((_, i) => arr[(n - 2 - i + n) % n]) : arr);
  return mkFace(M, pts.slice().reverse(), Object.assign({}, o, { edge: flip(o.edge), tag: flip(o.tag) }));
}

/* move faces i0.. by (dx, dy, dz) */
function shift(M, i0, dx, dy, dz) {
  for (let i = i0; i < M.faces.length; i++) {
    const f = M.faces[i];
    f.pts = f.pts.map(p => [p[0] + dx, p[1] + dy, p[2] + dz]);
    f.fr = Object.assign({}, f.fr, { o: [f.fr.o[0] + dx, f.fr.o[1] + dy, f.fr.o[2] + dz] });
  }
}

/* a square post or leg from y0 up h, folded from four strips */
function post(M, pal, cx, cz, s, y0, h, name, sub = 'plank') {
  const E = ['attach', 'auto', 'attach', 'auto'],
    art = { kind: 'special', sub, pal };
  const ids = [
    wallFace(M, [cx - s / 2, y0, cz + s / 2], [1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [cx + s / 2, y0, cz + s / 2], [0, 0, -1], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [cx + s / 2, y0, cz - s / 2], [-1, 0, 0], rectP(0, 0, s, h), { edge: E, art, name }),
    wallFace(M, [cx - s / 2, y0, cz - s / 2], [0, 0, 1], rectP(0, 0, s, h), { edge: E, art, name })
  ];
  M.groups.push({
    title: name,
    faces: ids,
    pref: 'chain',
    mid: [
      [ids[0], ids[1]],
      [ids[2], ids[3]]
    ]
  });
  return ids;
}

/* a small square cupola straddling the ridge (ridge along x at B.cz), with a pyramid roof */
function cupola(M, B, x, s, h, label, clock) {
  const ri = ridgeInfo(B);
  if (!ri) return;
  const t = ri.t,
    yr = ri.yr,
    cz = B.cz,
    x0 = x - s / 2,
    x1 = x + s / 2,
    z0 = cz - s / 2,
    z1 = cz + s / 2,
    yb = yr - (s / 2) * t,
    top = yr + h;
  const art = { kind: 'special', sub: 'cupola', pal: B.pal },
    clk = Object.assign({}, art, { clock: !!clock });
  const walls = [
    mkFace(
      M,
      [
        [x0, yb, z1],
        [x1, yb, z1],
        [x1, top, z1],
        [x0, top, z1]
      ],
      { edge: ['attach', 'auto', 'attach', 'auto'], art: clk, name: label }
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
      { edge: ['attach', 'attach', 'auto', 'attach', 'auto'], art, name: label }
    ),
    mkFace(
      M,
      [
        [x1, yb, z0],
        [x0, yb, z0],
        [x0, top, z0],
        [x1, top, z0]
      ],
      { edge: ['attach', 'auto', 'attach', 'auto'], art: clk, name: label }
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
      { edge: ['attach', 'attach', 'auto', 'attach', 'auto'], art, name: label }
    )
  ];
  M.groups.push({ title: label, faces: walls, pref: 'chain', check: true });
  const ov = 0.4,
    apex = [x, top + s * 0.8, cz],
    c = [
      [x0 - ov, top, z1 + ov],
      [x1 + ov, top, z1 + ov],
      [x1 + ov, top, z0 - ov],
      [x0 - ov, top, z0 - ov]
    ],
    ctr = [x, top + 0.1, cz];
  const roof = c.map((p, i) =>
    outFace(
      M,
      [p, c[(i + 1) % 4], apex],
      {
        edge: ['free', 'auto', 'auto'],
        tag: ['eave', 'hip', 'hip'],
        art: { kind: 'roof', finish: B.roofFinish, pal: B.pal },
        name: label + ' roof'
      },
      ctr
    )
  );
  M.groups.push({ title: label + ' roof', faces: roof, pref: 'chain', check: true });
}

/* a dome made of gores: rings from radius r at y0 up to a point, rise high */
function dome(M, pal, cx, cz, r, n, y0, rise, finish, name, phi0 = Math.PI / 2) {
  const bands = 4,
    rings = [];
  for (let k = 0; k <= bands; k++) {
    const a = ((Math.PI / 2) * k) / bands,
      rr = r * Math.cos(a),
      y = y0 + rise * Math.sin(a);
    const ring = [];
    for (let i = 0; i < n; i++) {
      const ph = phi0 - (i * 2 * Math.PI) / n;
      ring.push([cx + rr * Math.cos(ph), y, cz + rr * Math.sin(ph)]);
    }
    rings.push(ring);
  }
  const art = { kind: 'roof', finish, pal },
    ctr = [cx, y0 + rise * 0.3, cz],
    gores = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n,
      gore = [];
    for (let k = 0; k < bands; k++) {
      const last = k === bands - 1;
      const pts = last
        ? [rings[k][i], rings[k][j], rings[bands][0]]
        : [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]];
      const edge = last
        ? [k === 0 ? 'attach' : 'auto', 'auto', 'auto']
        : [k === 0 ? 'attach' : 'auto', 'auto', 'auto', 'auto'];
      gore.push(outFace(M, last ? pts : pts, { edge, art, name }, ctr));
    }
    gores.push(gore);
  }
  /* the top ring collapses to one point: use the same apex for every gore */
  M.groups.push({ title: name, faces: gores.flat(), pref: 'chain', check: true, mid: gores });
}

/* a gable roof on posts with no walls (hay barn, saw shed). Gable ends are closed with boards. */
function openShed(M, B, x0, x1, z0, z1, h, pitch, name) {
  const t = pitch / 12,
    e = 1,
    cz = (z0 + z1) / 2,
    yr = h + ((z1 - z0) / 2) * t,
    ye = h - e * t,
    pal = B.pal;
  const rart = { kind: 'roof', finish: B.roofFinish, pal };
  const front = mkFace(
    M,
    [
      [x0 - e, ye, z1 + e],
      [x1 + e, ye, z1 + e],
      [x1 + e, yr, cz],
      [x0 - e, yr, cz]
    ],
    {
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'rake', 'ridge', 'rake'],
      art: rart,
      name: name + ' roof'
    }
  );
  const back = mkFace(
    M,
    [
      [x1 + e, ye, z0 - e],
      [x0 - e, ye, z0 - e],
      [x0 - e, yr, cz],
      [x1 + e, yr, cz]
    ],
    {
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'rake', 'ridge', 'rake'],
      art: rart,
      name: name + ' roof'
    }
  );
  M.groups.push({ title: name + ' roof', faces: [front, back], pref: 'chain' });
  const gart = { kind: 'special', sub: 'boards', pal };
  [
    [x0, [0, 0, 1]],
    [x1, [0, 0, -1]]
  ].forEach(([x, u], i) => {
    const o = u[2] > 0 ? [x, h, z0] : [x, h, z1];
    const g = wallFace(
      M,
      o,
      u,
      [
        [0, 0],
        [z1 - z0, 0],
        [(z1 - z0) / 2, yr - h]
      ],
      { edge: ['attach', 'attach', 'attach'], tag: ['', 'top', 'top'], art: gart, name: name + ' gable' }
    );
    M.groups.push({ title: name + ' gable ' + (i + 1), faces: [g] });
  });
  const nx = Math.max(2, Math.round((x1 - x0) / 10) + 1);
  for (let i = 0; i < nx; i++) {
    const px = x0 + 0.4 + ((x1 - x0 - 0.8) * i) / (nx - 1);
    [z0 + 0.4, z1 - 0.4].forEach((pz, k) =>
      post(M, pal, px, pz, 0.8, 0, h, `${name} post ${i + 1}${k ? 'b' : 'a'}`)
    );
  }
  M.maxH = Math.max(M.maxH || 0, h);
}

/* a barrel-roofed hall: arched end walls (front and back), low side walls, a roof of folded strips.
   wallH = height of the side walls (0 for a Quonset hut), rise = height of the arch above them. */
function barrel(M, B, wallH, rise) {
  const W = B.W,
    D = B.D,
    xL = B.cx - W / 2,
    xR = B.cx + W / 2,
    zF = B.cz + D / 2,
    zB = B.cz - D / 2,
    n = 10,
    ov = 0.8;
  const arch = [];
  for (let i = 0; i <= n; i++) {
    const th = (Math.PI * i) / n;
    arch.push([W / 2 + (W / 2) * Math.cos(th), wallH + rise * Math.sin(th)]);
  }
  const endPoly = () => {
    const pts = [[0, 0], [W, 0], ...arch.filter(p => p[1] > 1e-6 || (p[0] !== 0 && p[0] !== W))];
    const out = [];
    pts.forEach(p => {
      const l = out[out.length - 1];
      if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) out.push(p);
    });
    if (Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-6) out.pop();
    const edge = out.map((p, i) => (i === 0 ? 'attach' : 'attach'));
    const tag = out.map((p, i) => (i === 0 ? '' : 'top'));
    if (wallH > 0.2) {
      edge[1] = 'auto';
      edge[out.length - 1] = 'auto';
      tag[1] = '';
      tag[out.length - 1] = '';
    }
    return { poly: out, edge, tag };
  };
  const ends = [
    ['front', [xL, 0, zF], [1, 0, 0]],
    ['back', [xR, 0, zB], [-1, 0, 0]]
  ].map(([role, o, u]) => {
    const pr = endPoly();
    return wallFace(M, o, u, pr.poly, {
      edge: pr.edge,
      tag: pr.tag,
      name: role === 'front' ? 'Front wall' : 'Back wall',
      art: {
        kind: 'wall',
        role,
        side: role,
        B,
        occl: [],
        key: 'Main:' + role,
        label: role === 'front' ? 'Front wall' : 'Back wall'
      }
    });
  });
  const walls = [ends[0]];
  if (wallH > 0.2) {
    const side = (role, o, u) =>
      wallFace(M, o, u, rectP(0, 0, D, wallH), {
        edge: ['attach', 'auto', 'attach', 'auto'],
        tag: ['', '', 'top', ''],
        name: role === 'right' ? 'Right side' : 'Left side',
        art: {
          kind: 'wall',
          role,
          side: role,
          B,
          occl: [],
          key: 'Main:' + role,
          label: (role === 'right' ? 'Right' : 'Left') + ' side wall'
        }
      });
    walls.push(side('right', [xR, 0, zF], [0, 0, -1]), ends[1], side('left', [xL, 0, zB], [0, 0, 1]));
  } else walls.push(ends[1]);
  M.groups.push({
    title: 'Walls',
    faces: walls,
    pref: 'chain',
    mid: walls.length === 4 ? [walls.slice(0, 2), walls.slice(2)] : walls.map(w => [w])
  });
  const ctr = [B.cx, wallH, B.cz],
    strips = [];
  for (let i = 0; i < n; i++) {
    const a = arch[i],
      b = arch[i + 1];
    const pts = [
      [xL + a[0], a[1], zF + ov],
      [xL + b[0], b[1], zF + ov],
      [xL + b[0], b[1], zB - ov],
      [xL + a[0], a[1], zB - ov]
    ];
    strips.push(
      outFace(
        M,
        pts,
        {
          edge: ['free', i === n - 1 ? 'free' : 'auto', 'free', i === 0 ? 'free' : 'auto'],
          tag: ['rake', i === n - 1 ? 'eave' : '', 'rake', i === 0 ? 'eave' : ''],
          art: { kind: 'roof', finish: B.roofFinish, pal: B.pal },
          name: 'Roof'
        },
        ctr
      )
    );
  }
  M.groups.push({
    title: 'Roof',
    faces: strips,
    pref: 'chain',
    mid: [strips.slice(0, n / 2), strips.slice(n / 2)]
  });
  M.maxH = Math.max(M.maxH || 0, wallH + rise);
}

/* the building as usual, built by buildUnit, with extra parts added by `extra` */
const withUnit = extra => (M, B) => {
  buildUnit(M, B);
  extra(M, B);
};

/* ---------- the variants ---------- */

function burgerStand(M, B) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    p = 12,
    y0 = B.found + 8.4;
  flatCanopyX(M, B, {
    x0: xL + 0.3,
    x1: xR - 0.3,
    p,
    y0,
    th: 1.2,
    bulbs: true,
    name: 'Car-hop canopy',
    title: 'Car-hop canopy'
  });
  [xL + 1, xR - 1].forEach((x, i) =>
    post(M, B.pal, x, zF + p - 0.8, 0.7, 0, y0, `Canopy post ${i + 1}`, 'steel')
  );
}

function coffeeKiosk(M, B) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2;
  flatCanopyX(M, B, {
    x0: xL + 0.2,
    x1: xR - 0.2,
    p: 4,
    y0: B.found + 8,
    th: 0.9,
    name: 'Window awning',
    title: 'Window awning'
  });
}

function driveIn(M, B) {
  buildUnit(M, B);
  const sw = 44,
    sh = 24,
    y0 = 10,
    zs = B.cz - B.D / 2 - 34,
    x0 = B.cx - sw / 2,
    x1 = B.cx + sw / 2;
  const plain = { kind: 'trimPlain', pal: B.pal };
  const F = boxFaces(
    M,
    x0,
    x1,
    y0,
    y0 + sh,
    zs - 1,
    zs + 1,
    {
      bottom: plain,
      front: { kind: 'special', sub: 'screen', pal: B.pal },
      right: plain,
      back: plain,
      left: plain,
      top: plain
    },
    true,
    {
      bottom: 'Screen underside',
      front: 'Screen',
      right: 'Screen side',
      back: 'Screen back',
      left: 'Screen side',
      top: 'Screen top'
    }
  );
  M.groups.push({
    title: 'Movie screen',
    faces: [F.bottom, F.front, F.right, F.back, F.left, F.top],
    pref: 'root',
    check: true,
    mid: [[F.front], [F.back], [F.bottom, F.top, F.right, F.left]]
  });
  [x0 + 4, B.cx, x1 - 4].forEach((x, i) => post(M, B.pal, x, zs, 1.2, 0, y0, `Screen leg ${i + 1}`, 'steel'));
  M.maxH = Math.max(M.maxH || 0, y0 + sh);
}

function rink(M, B) {
  derive(B);
  B.roof = 'barrel';
  barrel(M, B, B.H, B.W * 0.2);
}

function quonset(M, B) {
  derive(B);
  B.roof = 'barrel';
  B.H = B.found;
  barrel(M, B, 0, B.W / 2);
}

const school = withUnit((M, B) => cupola(M, B, B.cx, 5, 6, 'Bell tower'));
const townHall = withUnit((M, B) => cupola(M, B, B.cx, 7, 8, 'Clock cupola', true));
const dairy = withUnit((M, B) =>
  [-0.3, 0, 0.3].forEach((k, i) => cupola(M, B, B.cx + B.W * k, 3.5, 4.5, `Cupola ${i + 1}`))
);
const stable = withUnit((M, B) => cupola(M, B, B.cx, 4, 5, 'Cupola'));

function courthouse(M, B) {
  buildUnit(M, B);
  const r = Math.min(B.W, B.D) * 0.2,
    n = 12,
    h = B.Hs - B.H + 7;
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    y0: B.H,
    r,
    n,
    h,
    top: 'none',
    pal: B.pal,
    finish: B.finish,
    found: 0,
    style: 'drum',
    name: 'Dome drum'
  });
  dome(M, B.pal, B.cx, B.cz, r, n, B.H + h, r * 0.95, 'seam', 'Dome');
  M.maxH = Math.max(M.maxH, B.H + h + r);
}

function waterTower(M, B) {
  derive(B);
  const legH = 34,
    r = 8.5,
    th = 13;
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    y0: legH,
    r,
    n: 12,
    h: th,
    top: 'cone',
    coneH: 4.5,
    pal: B.pal,
    finish: 'panel',
    found: 0,
    style: 'tank',
    roofFinish: B.roofFinish,
    name: 'Tank',
    sign: B.sign
  });
  const ring = [];
  for (let i = 0; i < 12; i++) {
    const ph = Math.PI / 2 - (i * 2 * Math.PI) / 12;
    ring.push([B.cx + r * Math.cos(ph), legH, B.cz + r * Math.sin(ph)]);
  }
  const bot = outFace(
    M,
    ring,
    { edge: ring.map(() => 'free'), art: { kind: 'trimPlain', pal: B.pal }, name: 'Tank bottom' },
    [B.cx, legH + 5, B.cz]
  );
  M.groups.push({ title: 'Tank bottom', faces: [bot] });
  const d = r * 0.62;
  [
    [-d, -d],
    [d, -d],
    [d, d],
    [-d, d]
  ].forEach(([dx, dz], i) => post(M, B.pal, B.cx + dx, B.cz + dz, 1.1, 0, legH, `Leg ${i + 1}`, 'steel'));
  M.maxH = legH + th;
}

function hutch(M, B) {
  const i0 = M.faces.length,
    legH = 2.2;
  buildUnit(M, B);
  shift(M, i0, 0, legH, 0);
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2;
  const floor = mkFace(
    M,
    [
      [xL, legH, zB],
      [xR, legH, zB],
      [xR, legH, zF],
      [xL, legH, zF]
    ],
    {
      edge: ['free', 'free', 'free', 'free'],
      art: { kind: 'special', sub: 'boards', pal: B.pal },
      name: 'Floor'
    }
  );
  M.groups.push({ title: 'Floor', faces: [floor] });
  [
    [xL + 0.3, zF - 0.3],
    [xR - 0.3, zF - 0.3],
    [xR - 0.3, zB + 0.3],
    [xL + 0.3, zB + 0.3]
  ].forEach(([x, z], i) => post(M, B.pal, x, z, 0.35, 0, legH, `Leg ${i + 1}`));
}

const mill = withUnit((M, B) =>
  buildTower(M, {
    cx: B.cx + B.W / 2 + 4,
    cz: B.cz - B.D / 4,
    r: 2.8,
    n: 12,
    h: B.H + 30,
    top: 'none',
    pal: B.pal,
    finish: 'brick',
    found: 0,
    style: 'stack',
    name: 'Smokestack'
  })
);

function elevator(M, B) {
  const H = Object.assign({}, B, {
    W: 16,
    D: 14,
    cx: B.cx - 14,
    stories: 1,
    storyH: 64,
    roof: 'gable',
    pitch: 8
  });
  buildUnit(M, H);
  const spal = makePal(Object.assign({}, B.col, { wall: '#c9c4b8', roof: '#8f9597' }));
  [0, 1, 2].forEach(i =>
    buildTower(M, {
      cx: B.cx + 1 + i * 14.2,
      cz: B.cz,
      r: 7,
      n: 16,
      h: 56,
      top: 'cone',
      coneH: 3,
      pal: spal,
      finish: 'stave',
      found: 0,
      style: 'silo',
      roofFinish: 'seam',
      name: `Silo ${i + 1}`
    })
  );
  M.maxH = Math.max(M.maxH, 64);
}

const lumberMill = withUnit((M, B) => {
  const xR = B.cx + B.W / 2,
    d = B.D * 0.8;
  openShed(M, B, xR + 1.5, xR + 1.5 + 26, B.cz - d / 2, B.cz + d / 2, 11, 6, 'Saw shed');
});

const brewery = withUnit((M, B) => {
  const xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2;
  [zF - 5, zF - 13].forEach((cz, i) =>
    buildTower(M, {
      cx: xR + 5,
      cz,
      r: 3.4,
      n: 12,
      h: B.H + 5,
      top: 'cone',
      coneH: 2.4,
      pal: makePal(Object.assign({}, B.col, { wall: '#c8ccce', roof: '#9aa0a3' })),
      finish: 'panel',
      found: 0,
      style: 'tank',
      roofFinish: 'seam',
      name: `Brew tank ${i + 1}`
    })
  );
});

function grainBins(M, B) {
  derive(B);
  [
    [-11, 0, 9, 19],
    [7, -4, 7.5, 16],
    [7, 12, 7.5, 16]
  ].forEach(([dx, dz, r, h], i) =>
    buildTower(M, {
      cx: B.cx + dx,
      cz: B.cz + dz,
      r,
      n: 16,
      h,
      top: 'cone',
      coneH: r * 0.45,
      pal: B.pal,
      finish: 'panel',
      found: 0,
      style: 'bin',
      roofFinish: B.roofFinish,
      name: `Bin ${i + 1}`,
      doorDir: [0, 1]
    })
  );
  M.maxH = 25;
}

function hayBarn(M, B) {
  derive(B);
  openShed(M, B, B.cx - B.W / 2, B.cx + B.W / 2, B.cz - B.D / 2, B.cz + B.D / 2, B.H, B.pitch, 'Hay barn');
}

function roundBarn(M, B) {
  derive(B);
  const r = B.W / 2;
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    r,
    n: 16,
    h: B.H,
    top: 'cone',
    coneH: r * 0.62,
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'roundbarn',
    roofFinish: B.roofFinish,
    name: 'Round barn',
    doorDir: [0, 1]
  });
  M.maxH = B.H;
}

function windmill(M, B) {
  derive(B);
  const pal = B.pal,
    h = 30,
    b0 = 5,
    b1 = 1.3,
    cx = B.cx,
    cz = B.cz,
    lat = { kind: 'special', sub: 'lattice', pal };
  const P = (sx, sz, y, k) => [cx + sx * k, y, cz + sz * k];
  const sides = [
    [
      [-1, 1],
      [1, 1]
    ],
    [
      [1, 1],
      [1, -1]
    ],
    [
      [1, -1],
      [-1, -1]
    ],
    [
      [-1, -1],
      [-1, 1]
    ]
  ];
  const legs = sides.map(([a, b]) =>
    outFace(
      M,
      [P(a[0], a[1], 0, b0), P(b[0], b[1], 0, b0), P(b[0], b[1], h, b1), P(a[0], a[1], h, b1)],
      { edge: ['attach', 'auto', 'attach', 'auto'], art: lat, name: 'Tower side' },
      [cx, h / 2, cz]
    )
  );
  M.groups.push({ title: 'Tower', faces: legs, pref: 'chain', mid: [legs.slice(0, 2), legs.slice(2)] });
  const plain = { kind: 'trimPlain', pal };
  const T = boxFaces(
    M,
    cx - b1 - 0.6,
    cx + b1 + 0.6,
    h,
    h + 0.6,
    cz - b1 - 0.6,
    cz + b1 + 0.6,
    { bottom: plain, front: plain, right: plain, back: plain, left: plain, top: plain },
    true,
    {
      bottom: 'Platform',
      front: 'Platform',
      right: 'Platform',
      back: 'Platform',
      left: 'Platform',
      top: 'Platform'
    }
  );
  M.groups.push({
    title: 'Platform',
    faces: [T.bottom, T.front, T.right, T.back, T.left, T.top],
    pref: 'root',
    check: true
  });
  const R = 5.5,
    wy = h + 2.6,
    wz = cz + b1 + 1.2,
    wheel = [];
  for (let i = 0; i < 18; i++) {
    const a = (i * 2 * Math.PI) / 18;
    wheel.push([cx + R * Math.cos(a), wy + R * Math.sin(a), wz]);
  }
  const wf = outFace(
    M,
    wheel,
    { edge: wheel.map(() => 'free'), art: { kind: 'special', sub: 'wheel', pal }, name: 'Wheel' },
    [cx, wy, wz - 1]
  );
  const vane = outFace(
    M,
    [
      [cx, wy - 0.4, cz - 0.5],
      [cx, wy + 0.4, cz - 0.5],
      [cx, wy + 2.2, cz - 8],
      [cx, wy - 1.6, cz - 8]
    ],
    { edge: ['free', 'free', 'free', 'free'], art: { kind: 'special', sub: 'vane', pal }, name: 'Tail vane' },
    [cx - 1, wy, cz - 4]
  );
  M.groups.push({ title: 'Wheel', faces: [wf] }, { title: 'Tail vane', faces: [vane] });
  M.maxH = h + R + 3;
}

function watchtower(M, B) {
  derive(B);
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    r: B.W / Math.SQRT2,
    n: 4,
    phi0: Math.PI / 4,
    h: B.H + 6,
    top: 'crenel',
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'castle',
    name: 'Watchtower',
    doorDir: [0, 1]
  });
  M.maxH = B.H + 6;
}

function shellKeep(M, B) {
  derive(B);
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    r: B.W / 2,
    n: 16,
    h: B.H,
    top: 'crenel',
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'castle',
    name: 'Shell keep',
    doorDir: [0, 1]
  });
  M.maxH = B.H;
}

function wizardTower(M, B) {
  derive(B);
  buildTower(M, {
    cx: B.cx,
    cz: B.cz,
    r: B.W / 2,
    n: 10,
    h: B.H + 14,
    top: 'cone',
    coneH: B.W * 1.9,
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'wizard',
    roofFinish: B.roofFinish,
    name: 'Wizard tower',
    doorDir: [0, 1]
  });
  M.maxH = B.H + 14;
}

/* a castle keep with broken, jagged wall tops and a tower stump; no roof */
function ruin(M, B) {
  derive(B);
  const R = rng(4242),
    W = B.W,
    D = B.D,
    H = B.H,
    xL = B.cx - W / 2,
    xR = B.cx + W / 2,
    zF = B.cz + D / 2,
    zB = B.cz - D / 2;
  const corner = [H * 0.95, H * 0.62, H * 0.8, H * 0.55];
  const defs = [
    ['front', [xL, 0, zF], [1, 0, 0], W, 0, 1],
    ['right', [xR, 0, zF], [0, 0, -1], D, 1, 2],
    ['back', [xR, 0, zB], [-1, 0, 0], W, 2, 3],
    ['left', [xL, 0, zB], [0, 0, 1], D, 3, 0]
  ];
  const ids = defs.map(([role, o, u, w, ca, cb]) => {
    const top = [];
    const k = Math.max(3, Math.round(w / 3));
    for (let i = k - 1; i >= 1; i--) {
      const x = (w * i) / k,
        base = corner[ca] + ((corner[cb] - corner[ca]) * i) / k;
      const y = Math.max(H * 0.3, Math.min(H * 1.05, base + (R() - 0.55) * H * 0.35));
      top.push([x + (R() - 0.5) * 0.8, y]);
    }
    const poly = [[0, 0], [w, 0], [w, corner[cb]], ...top, [0, corner[ca]]];
    const edge = poly.map((_, i) =>
      i === 0 ? 'attach' : i === 1 || i === poly.length - 1 ? 'auto' : 'free'
    );
    return wallFace(M, o, u, poly, {
      edge,
      tag: poly.map(() => ''),
      name: role[0].toUpperCase() + role.slice(1) + ' wall',
      art: { kind: 'wall', role, side: role, B, occl: [] }
    });
  });
  M.groups.push({ title: 'Ruined walls', faces: ids, pref: 'chain', mid: [ids.slice(0, 2), ids.slice(2)] });
  buildTower(M, {
    cx: xR + 2.5,
    cz: zF + 2.5,
    r: 4.5,
    n: 8,
    h: H * 0.7,
    top: 'none',
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'castle',
    name: 'Tower stump',
    inward: [B.cx, B.cz]
  });
  M.maxH = H;
}

/* a timber keep on an earth mound */
function motte(M, B) {
  derive(B);
  const mh = 9,
    base = B.W + 22,
    topS = B.W + 6,
    cx = B.cx,
    cz = B.cz,
    pal = B.pal,
    grass = { kind: 'special', sub: 'mound', pal };
  const c0 = [
      [cx - base / 2, 0, cz + base / 2],
      [cx + base / 2, 0, cz + base / 2],
      [cx + base / 2, 0, cz - base / 2],
      [cx - base / 2, 0, cz - base / 2]
    ],
    c1 = [
      [cx - topS / 2, mh, cz + topS / 2],
      [cx + topS / 2, mh, cz + topS / 2],
      [cx + topS / 2, mh, cz - topS / 2],
      [cx - topS / 2, mh, cz - topS / 2]
    ];
  const ctr = [cx, mh / 3, cz];
  const slopes = [0, 1, 2, 3].map(i =>
    outFace(
      M,
      [c0[i], c0[(i + 1) % 4], c1[(i + 1) % 4], c1[i]],
      { edge: ['free', 'auto', 'auto', 'auto'], art: grass, name: 'Mound slope' },
      ctr
    )
  );
  const top = outFace(
    M,
    c1.slice(),
    { edge: ['auto', 'auto', 'auto', 'auto'], art: grass, name: 'Mound top' },
    ctr
  );
  M.groups.push({
    title: 'Mound',
    faces: [top, ...slopes],
    pref: 'root',
    check: true,
    mid: [[top, slopes[0], slopes[2]], [slopes[1]], [slopes[3]]]
  });
  const i0 = M.faces.length;
  buildUnit(M, B);
  shift(M, i0, 0, mh, 0);
  M.maxH = B.H + mh;
}

/* a straight stretch of curtain wall with a round tower at its right end; sections butt together */
function curtainWall(M, B) {
  derive(B);
  const L = B.W,
    T = 6,
    H = B.H,
    xL = B.cx - L / 2,
    xR = B.cx + L / 2,
    zF = B.cz + T / 2,
    zB = B.cz - T / 2;
  const cren = crenelPoly(L, H, 3);
  const ids = [
    wallFace(M, [xL, 0, zF], [1, 0, 0], cren.poly, {
      edge: cren.edge,
      tag: cren.tag,
      name: 'Outer face',
      art: { kind: 'wall', role: 'front', side: 'front', B, occl: [] }
    }),
    wallFace(M, [xR, 0, zF], [0, 0, -1], rectP(0, 0, T, H), {
      edge: ['attach', 'auto', 'attach', 'auto'],
      name: 'End',
      art: { kind: 'wall', role: 'party', side: 'right', B, occl: [] }
    }),
    wallFace(M, [xR, 0, zB], [-1, 0, 0], rectP(0, 0, L, H), {
      edge: ['attach', 'auto', 'attach', 'auto'],
      name: 'Inner face',
      art: { kind: 'wall', role: 'back', side: 'back', B, occl: [] }
    }),
    wallFace(M, [xL, 0, zB], [0, 0, 1], rectP(0, 0, T, H), {
      edge: ['attach', 'auto', 'attach', 'auto'],
      name: 'End',
      art: { kind: 'wall', role: 'party', side: 'left', B, occl: [] }
    })
  ];
  M.groups.push({
    title: 'Wall',
    faces: ids,
    pref: 'chain',
    mid: [
      [ids[0], ids[1]],
      [ids[2], ids[3]]
    ]
  });
  const walk = mkFace(
    M,
    [
      [xL, H, zF],
      [xR, H, zF],
      [xR, H, zB],
      [xL, H, zB]
    ],
    { edge: ['attach', 'attach', 'attach', 'attach'], art: { kind: 'deck', pal: B.pal }, name: 'Wall walk' }
  );
  M.groups.push({ title: 'Wall walk', faces: [walk] });
  buildTower(M, {
    cx: xR + 3,
    cz: B.cz,
    r: 5.5,
    n: 8,
    h: H + 6,
    top: S.towerTop || 'crenel',
    coneH: 12,
    pal: B.pal,
    finish: B.finish,
    found: B.found,
    style: 'castle',
    roofFinish: 'slate',
    name: 'End tower',
    inward: [B.cx, B.cz]
  });
  M.maxH = H + 6;
}

export const SPECIALS = {
  burger: withUnit(burgerStand),
  coffee: withUnit(coffeeKiosk),
  drivein: driveIn,
  rink,
  quonset,
  school,
  townhall: townHall,
  courthouse,
  watertower: waterTower,
  hutch,
  mill,
  elevator,
  lumber: lumberMill,
  brewery,
  bins: grainBins,
  haybarn: hayBarn,
  roundbarn: roundBarn,
  windmill,
  dairy,
  stable,
  watchtower,
  shell: shellKeep,
  wizard: wizardTower,
  ruin,
  motte,
  curtain: curtainWall
};
