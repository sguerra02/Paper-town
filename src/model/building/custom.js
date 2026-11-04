/* Custom footprints: a house made of rectangles ("blocks") placed in the footprint designer.

   - Walls follow the outline of the blocks' union, so blocks that touch share no inside walls.
   - Every block gets its own roof in the chosen style. The visible roof is the highest of them at each
     point, so where two roofs meet the lower one is cut along the valley.
   - A block whose whole end touches another block runs its roof into that block (halfway if its ridge
     is lower, all the way through if higher), which is what makes proper valleys at L, T and cross joins.

   Plan coordinates are in feet: x to the right, z toward the front. Heights (y) are measured up. */
import { S } from '../../config/state.js';
import { mkFace, wallFace } from '../faces.js';
import { buildChimney, buildPorch } from '../features/house.js';
import { gamb } from './roofs.js';
import { placeFaces, wingFrame } from './wings.js';

const EPS = 1e-6;

/* What a new custom footprint starts as: a main block with a wing to the front right. */
export const DEFAULT_BLOCKS = [
  { x: -15, z: -11, w: 30, d: 22, ridge: 'auto' },
  { x: 1, z: 11, w: 14, d: 16, ridge: 'auto' }
];

/* The blocks from S, as rectangles. */
export function customBlocks() {
  const src = Array.isArray(S.blocks) && S.blocks.length ? S.blocks : DEFAULT_BLOCKS;
  return src
    .filter(b => b.w >= 1 && b.d >= 1)
    .map((b, i) => ({ i, x0: b.x, x1: b.x + b.w, z0: b.z, z1: b.z + b.d, ridge: b.ridge || 'auto' }));
}

/* ---------- outline of the union ---------- */

function cellGrid(blocks) {
  const xs = [...new Set(blocks.flatMap(b => [b.x0, b.x1]))].sort((a, b) => a - b);
  const zs = [...new Set(blocks.flatMap(b => [b.z0, b.z1]))].sort((a, b) => a - b);
  const cov = (i, j) => {
    if (i < 0 || j < 0 || i >= xs.length - 1 || j >= zs.length - 1) return false;
    const cx = (xs[i] + xs[i + 1]) / 2,
      cz = (zs[j] + zs[j + 1]) / 2;
    return blocks.some(b => cx > b.x0 && cx < b.x1 && cz > b.z0 && cz < b.z1);
  };
  return { xs, zs, cov };
}

/* Is (x, z) strictly inside some block? */
export function coveredAt(blocks, x, z) {
  return blocks.some(b => x > b.x0 + EPS && x < b.x1 - EPS && z > b.z0 + EPS && z < b.z1 - EPS);
}

/* Closed loops around the union, as [x, z] points. The front edge of each loop runs to the right,
   so walking a loop keeps the inside on the walker's right when seen from above. Inner loops
   (courtyards) come out with the opposite turn. */
export function outlineLoops(blocks) {
  const { xs, zs, cov } = cellGrid(blocks);
  const edges = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < zs.length - 1; j++) {
      if (!cov(i, j)) continue;
      const [xa, xb, za, zb] = [xs[i], xs[i + 1], zs[j], zs[j + 1]];
      if (!cov(i, j + 1))
        edges.push([
          [xa, zb],
          [xb, zb]
        ]);
      if (!cov(i + 1, j))
        edges.push([
          [xb, zb],
          [xb, za]
        ]);
      if (!cov(i, j - 1))
        edges.push([
          [xb, za],
          [xa, za]
        ]);
      if (!cov(i - 1, j))
        edges.push([
          [xa, za],
          [xa, zb]
        ]);
    }
  const k = p => p[0].toFixed(4) + ',' + p[1].toFixed(4);
  const from = new Map();
  edges.forEach((e, n) => {
    const key = k(e[0]);
    if (!from.has(key)) from.set(key, []);
    from.get(key).push(n);
  });
  const used = new Set(),
    loops = [];
  edges.forEach((e0, n0) => {
    if (used.has(n0)) return;
    const pts = [];
    let n = n0;
    while (n !== undefined && !used.has(n)) {
      used.add(n);
      pts.push(edges[n][0]);
      const next = (from.get(k(edges[n][1])) || []).filter(m => !used.has(m));
      n = next[0];
    }
    loops.push(simplify(pts));
  });
  return loops.filter(l => l.length >= 4);
}

function simplify(pts) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n],
      b = pts[i],
      c = pts[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > EPS) out.push(b);
  }
  return out;
}

function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/* Outer loops wind the opposite way to courtyards (negative area with x right, z toward the front). */
const isOuter = l => signedArea(l) < 0;

/* Problems worth telling the user about. */
export function footprintIssues(blocks) {
  const issues = [];
  for (let i = 0; i < blocks.length; i++)
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i],
        b = blocks[j];
      if (a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS && a.z0 < b.z1 - EPS && b.z0 < a.z1 - EPS)
        issues.push({ kind: 'overlap', a: i, b: j });
    }
  const loops = outlineLoops(blocks);
  const outer = loops.filter(isOuter).length,
    inner = loops.length - outer;
  if (outer > 1) issues.push({ kind: 'apart' });
  if (inner > 0) issues.push({ kind: 'courtyard' });
  return issues;
}

/* ---------- roofs ---------- */

function ridgeAxis(b) {
  if (b.ridge === 'x' || b.ridge === 'z') return b.ridge;
  return b.x1 - b.x0 >= b.z1 - b.z0 ? 'x' : 'z';
}

/* A roof plane y = a·x + c·z + k that slopes down toward one side of the block (its eave). */
function plane(b, dir, slope, off, H) {
  const base = H + off;
  if (dir === 'front') return { a: 0, c: -slope, k: base + slope * b.z1, dir, slope };
  if (dir === 'back') return { a: 0, c: slope, k: base - slope * b.z0, dir, slope };
  if (dir === 'right') return { a: -slope, c: 0, k: base + slope * b.x1, dir, slope };
  return { a: slope, c: 0, k: base - slope * b.x0, dir, slope };
}

/* The planes of one block's roof. Eaves come from the block's own rectangle; hip ends sit at the ends of
   its extended rectangle, so two blocks joined end to end share one continuous ridge. */
function roofPlanes(b, E, B, roof) {
  const t = B.pitch / 12,
    H = B.H,
    axis = ridgeAxis(b);
  const eaves = axis === 'x' ? ['front', 'back'] : ['right', 'left'];
  const ends = axis === 'x' ? ['right', 'left'] : ['front', 'back'];
  const span = axis === 'x' ? b.z1 - b.z0 : b.x1 - b.x0;
  if (roof === 'shed') return [plane(b, eaves[0], t, 0, H)];
  if (roof === 'hip')
    return [...eaves.map(d => plane(b, d, t, 0, H)), ...ends.map(d => plane(E, d, t, 0, H))];
  if (roof === 'gambrel') {
    const g = gamb(t),
      bb = span * 0.2;
    return eaves.flatMap(d => [
      Object.assign(plane(b, d, g.t1, 0, H), { lvl: 'low' }),
      Object.assign(plane(b, d, g.t2, bb * g.t1 - bb * g.t2, H), { lvl: 'high' })
    ]);
  }
  return eaves.map(d => plane(b, d, t, 0, H));
}

const yAt = (p, x, z) => p.a * x + p.c * z + p.k;

function peak(b, B, roof) {
  const t = B.pitch / 12,
    axis = ridgeAxis(b),
    span = axis === 'x' ? b.z1 - b.z0 : b.x1 - b.x0,
    along = axis === 'x' ? b.x1 - b.x0 : b.z1 - b.z0;
  if (roof === 'shed') return B.H + span * t;
  if (roof === 'hip') return B.H + (Math.min(span, along) / 2) * t;
  if (roof === 'gambrel') {
    const g = gamb(t),
      bb = span * 0.2;
    return B.H + bb * g.t1 + (span / 2 - bb) * g.t2;
  }
  return B.H + (span / 2) * t;
}

/* Runs a block's roof into a neighbor that its whole end touches. */
function extendBlocks(blocks, B, roof) {
  return blocks.map(b => {
    const e = { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 };
    const pb = peak(b, B, roof);
    blocks.forEach(n => {
      if (n === b) return;
      const deep = th => (pb <= peak(n, B, roof) + 1e-6 ? th / 2 : th);
      const coversX = n.x0 <= b.x0 + EPS && n.x1 >= b.x1 - EPS,
        coversZ = n.z0 <= b.z0 + EPS && n.z1 >= b.z1 - EPS;
      if (Math.abs(n.z0 - b.z1) < EPS && coversX) e.z1 = Math.max(e.z1, b.z1 + deep(n.z1 - n.z0));
      if (Math.abs(n.z1 - b.z0) < EPS && coversX) e.z0 = Math.min(e.z0, b.z0 - deep(n.z1 - n.z0));
      if (Math.abs(n.x0 - b.x1) < EPS && coversZ) e.x1 = Math.max(e.x1, b.x1 + deep(n.x1 - n.x0));
      if (Math.abs(n.x1 - b.x0) < EPS && coversZ) e.x0 = Math.min(e.x0, b.x0 - deep(n.x1 - n.x0));
    });
    return e;
  });
}

const contains = (r, x, z) => x >= r.x0 - 1e-6 && x <= r.x1 + 1e-6 && z >= r.z0 - 1e-6 && z <= r.z1 + 1e-6;

/* ---------- 2D polygon helpers (plan view). A polygon is a list of {x, z, e}: e labels the edge
   that starts at that point. ---------- */

function clip(poly, A, C, K, cutLab) {
  const out = [],
    n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i],
      q = poly[(i + 1) % n];
    const fp = A * p.x + C * p.z + K,
      fq = A * q.x + C * q.z + K;
    const pin = fp <= 1e-9,
      qin = fq <= 1e-9;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = fp / (fp - fq);
      out.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t, e: pin ? cutLab : p.e });
    }
  }
  return out;
}

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    s += a.x * b.z - b.x * a.z;
  }
  return s / 2;
}

/* piece minus the convex region where every constraint g < 0 holds */
function subtract(piece, cons) {
  let inter = piece;
  for (const c of cons) {
    inter = clip(inter, c.A, c.C, c.K, 'seam');
    if (inter.length < 3) return [piece];
  }
  if (Math.abs(area(inter)) < 1e-5) return [piece];
  const out = [];
  let rest = piece;
  for (const c of cons) {
    const part = clip(rest, -c.A, -c.C, -c.K, c.lab);
    if (part.length >= 3 && Math.abs(area(part)) > 1e-5) out.push(part);
    rest = clip(rest, c.A, c.C, c.K, 'seam');
    if (rest.length < 3) break;
  }
  return out;
}

/* Joins pieces of one roof face back into whole polygons. Shared inner edges cancel out.
   Returns the pieces unchanged if the result would have a hole. */
function merge(pieces) {
  if (pieces.length < 2) return pieces;
  let edges = [];
  pieces.forEach(P =>
    P.forEach((p, i) => {
      const q = P[(i + 1) % P.length];
      if (Math.hypot(q.x - p.x, q.z - p.z) > 1e-7) edges.push({ a: p, b: q, e: p.e });
    })
  );
  const verts = edges.map(e => e.a);
  edges = edges.flatMap(ed => {
    const dx = ed.b.x - ed.a.x,
      dz = ed.b.z - ed.a.z,
      L2 = dx * dx + dz * dz;
    const ts = [];
    verts.forEach(v => {
      const t = ((v.x - ed.a.x) * dx + (v.z - ed.a.z) * dz) / L2;
      if (t <= 1e-6 || t >= 1 - 1e-6) return;
      const px = ed.a.x + dx * t,
        pz = ed.a.z + dz * t;
      if (Math.hypot(px - v.x, pz - v.z) < 1e-5) ts.push(t);
    });
    if (!ts.length) return [ed];
    ts.sort((a, b) => a - b);
    const pts = [ed.a, ...ts.map(t => ({ x: ed.a.x + dx * t, z: ed.a.z + dz * t })), ed.b];
    return pts.slice(0, -1).map((p, i) => ({ a: p, b: pts[i + 1], e: ed.e }));
  });
  const k = p => Math.round(p.x * 1e4) + ',' + Math.round(p.z * 1e4);
  const dir = new Map();
  edges.forEach((ed, i) => {
    const key = k(ed.a) + '>' + k(ed.b);
    if (!dir.has(key)) dir.set(key, []);
    dir.get(key).push(i);
  });
  const dead = new Set();
  edges.forEach((ed, i) => {
    if (dead.has(i)) return;
    const rev = (dir.get(k(ed.b) + '>' + k(ed.a)) || []).find(j => !dead.has(j));
    if (rev !== undefined) {
      dead.add(i);
      dead.add(rev);
    }
  });
  const live = edges.filter((_, i) => !dead.has(i));
  const from = new Map();
  live.forEach((ed, i) => {
    const key = k(ed.a);
    if (!from.has(key)) from.set(key, []);
    from.get(key).push(i);
  });
  const used = new Set(),
    loops = [];
  for (let s = 0; s < live.length; s++) {
    if (used.has(s)) continue;
    const loop = [];
    let i = s;
    while (i !== undefined && !used.has(i)) {
      used.add(i);
      loop.push({ x: live[i].a.x, z: live[i].a.z, e: live[i].e });
      i = (from.get(k(live[i].b)) || []).find(j => !used.has(j));
    }
    if (loop.length >= 3) loops.push(loop);
  }
  const sign = Math.sign(area(pieces[0]));
  if (loops.some(l => Math.sign(area(l)) !== sign)) return pieces;
  return loops.map(l => {
    /* drop points in the middle of straight runs with the same label */
    const n = l.length;
    return l.filter((p, i) => {
      const a = l[(i - 1 + n) % n],
        c = l[(i + 1) % n];
      const cross = (p.x - a.x) * (c.z - p.z) - (p.z - a.z) * (c.x - p.x);
      return Math.abs(cross) > 1e-7 || a.e !== p.e;
    });
  });
}

/* ---------- the build ---------- */

const LAB = {
  free: { role: 'free', tag: '' },
  eave: { role: 'free', tag: 'eave' },
  rake: { role: 'free', tag: 'rake' },
  ridge: { role: 'auto', tag: 'ridge' },
  hip: { role: 'auto', tag: 'hip' },
  fold: { role: 'auto', tag: '' },
  valley: { role: 'attach', tag: '' },
  side: { role: 'free', tag: '' },
  seam: { role: 'auto', tag: '' }
};

function foldKind(p, q) {
  if (p.dir === q.dir) return 'fold';
  const opp = { front: 'back', back: 'front', left: 'right', right: 'left' };
  return opp[p.dir] === q.dir ? 'ridge' : 'hip';
}

/* The visible height above (x, z): the highest roof among the blocks whose (extended) area holds it. */
function makeHeight(blocks, ext, planes) {
  const hb = (j, x, z) => Math.min(...planes[j].map(p => yAt(p, x, z)));
  const top = (x, z, skip) => {
    let h = -Infinity;
    blocks.forEach((b, j) => {
      if (j !== skip && contains(ext[j], x, z)) h = Math.max(h, hb(j, x, z));
    });
    return h;
  };
  return { hb, top };
}

/* Breakpoints along a straight run from P0 to P1 where a piecewise-flat roof height can bend. */
function breakpoints(P0, P1, ext, allPlanes) {
  const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]),
    ux = (P1[0] - P0[0]) / L,
    uz = (P1[1] - P0[1]) / L;
  const ss = new Set([0, L]);
  const add = s => {
    if (s > 1e-6 && s < L - 1e-6) ss.add(Math.round(s * 1e6) / 1e6);
  };
  ext.forEach(r => {
    if (Math.abs(ux) > 0.5) [r.x0, r.x1].forEach(x => add((x - P0[0]) / ux));
    else [r.z0, r.z1].forEach(z => add((z - P0[1]) / uz));
  });
  for (let i = 0; i < allPlanes.length; i++)
    for (let j = i + 1; j < allPlanes.length; j++) {
      const p = allPlanes[i],
        q = allPlanes[j];
      const g0 = yAt(p, P0[0], P0[1]) - yAt(q, P0[0], P0[1]);
      const dg = (p.a - q.a) * ux + (p.c - q.c) * uz;
      if (Math.abs(dg) > 1e-9) add(-g0 / dg);
    }
  return { L, ux, uz, ss: [...ss].sort((a, b) => a - b) };
}

function dropStraight(pts) {
  return pts.filter((p, i) => {
    if (i === 0 || i === pts.length - 1) return true;
    const a = pts[i - 1],
      c = pts[i + 1];
    return Math.abs((p[0] - a[0]) * (c[1] - p[1]) - (p[1] - a[1]) * (c[0] - p[0])) > 1e-7;
  });
}

const SIDE_NAMES = { front: 'Front', back: 'Back', left: 'Left side', right: 'Right side' };

export function buildCustom(M, B) {
  const blocks = customBlocks();
  if (!blocks.length) return;
  const roof = B.roof,
    flat = roof === 'flat';
  const ext = flat ? blocks.map(b => ({ ...b })) : extendBlocks(blocks, B, roof);
  const planes = blocks.map((b, j) => roofPlanes(b, ext[j], B, roof));
  const { hb, top } = makeHeight(blocks, ext, planes);
  const allPlanes = planes.flat();
  const loops = outlineLoops(blocks);

  /* walls along the outline */
  const walls = [];
  loops.forEach(loop => {
    const ids = [];
    loop.forEach((P0, i) => {
      const P1 = loop[(i + 1) % loop.length];
      const { L, ux, uz, ss } = breakpoints(P0, P1, ext, allPlanes);
      const at = s => [P0[0] + ux * s, P0[1] + uz * s];
      let topPts;
      if (flat)
        topPts = [
          [L, B.Hs],
          [0, B.Hs]
        ];
      else
        topPts = dropStraight(
          ss
            .slice()
            .reverse()
            .map(s => [s, Math.max(B.H, top(...at(s)))])
        );
      const poly = [[0, 0], [L, 0], ...topPts];
      const nTop = topPts.length - 1;
      const edge = ['attach', 'auto', ...Array(nTop).fill(flat ? 'free' : 'attach'), 'auto'];
      const tag = ['', '', ...Array(nTop).fill('top'), ''];
      const side = ux > 0.5 ? 'front' : ux < -0.5 ? 'back' : uz < -0.5 ? 'right' : 'left';
      walls.push({ P0, P1, L, side, u: [ux, 0, uz], poly, edge, tag, loopIds: ids });
    });
  });
  /* the longest front wall gets the front door; walls are named left to right as seen from outside */
  const mainFront = walls.filter(w => w.side === 'front').sort((a, b) => b.L - a.L)[0];
  const order = { front: w => w.P0[0], back: w => -w.P0[0], right: w => -w.P0[1], left: w => w.P0[1] };
  Object.keys(order).forEach(side => {
    const list = walls.filter(w => w.side === side).sort((a, b) => order[side](a) - order[side](b));
    list.forEach((w, n) => {
      w.key = `Custom:${side}:${n + 1}`;
      w.label = `${SIDE_NAMES[side]} wall${list.length > 1 ? ' ' + (n + 1) : ''} (${Math.round(w.L)} ft)`;
    });
  });
  walls.forEach(w => {
    const id = wallFace(M, [w.P0[0], 0, w.P0[1]], w.u, w.poly, {
      edge: w.edge,
      tag: w.tag,
      name: SIDE_NAMES[w.side] + ' wall',
      art: {
        kind: 'wall',
        role: w.side,
        side: w.side,
        B,
        occl: [],
        noDoor: w !== mainFront,
        key: w.key,
        label: w.label
      }
    });
    w.loopIds.push(id);
  });
  const loopGroups = [...new Set(walls.map(w => w.loopIds))];
  loopGroups.forEach((ids, n) => {
    const mid = [];
    for (let i = 0; i < ids.length; i += 2) mid.push(ids.slice(i, i + 2));
    M.groups.push({
      title: loopGroups.length > 1 ? `Walls ${n + 1}` : 'Walls',
      faces: ids,
      pref: 'chain',
      mid
    });
  });

  if (flat) buildFlatDeck(M, B, loops);
  else {
    buildRoofs(M, B, blocks, ext, planes, hb);
    buildSteps(M, B, blocks, ext, hb, top, allPlanes);
  }

  /* chimney on the tallest pitched block, porch on the main front wall */
  if (B.chimney && !flat && roof !== 'shed') customChimney(M, B, blocks, roof);
  if (B.porch && B.porch !== 'none' && mainFront) {
    let a = mainFront.P0[0] + 0.3,
      b = mainFront.P1[0] - 0.3;
    if (B.porch === 'center' || B.porch === 'portico') {
      const c = (a + b) / 2,
        hw = B.porch === 'portico' ? Math.min(9, (b - a) / 2) : Math.max(5, Math.min(8, (b - a) * 0.22));
      a = Math.max(a, c - hw);
      b = Math.min(b, c + hw);
    }
    if (b - a > 4)
      buildPorch(M, Object.assign({}, B, { cz: mainFront.P0[1] - B.D / 2 }), a, b, B.porch === 'portico');
  }
  if (S.base)
    loops.filter(isOuter).forEach((l, n, arr) => {
      const id = mkFace(
        M,
        l.map(([x, z]) => [x, 0, z]),
        { edge: l.map(() => 'free'), art: { kind: 'base', pal: B.pal }, name: 'Base', noPreview: true }
      );
      M.groups.push({ title: arr.length > 1 ? `Base plate ${n + 1}` : 'Base plate', faces: [id] });
    });
  M.maxH = Math.max(M.maxH || 0, B.H);
}

function buildFlatDeck(M, B, loops) {
  loops.filter(isOuter).forEach(l => {
    const id = mkFace(
      M,
      l.map(([x, z]) => [x, B.H, z]),
      { edge: l.map(() => 'attach'), art: { kind: 'deck', pal: B.pal }, name: 'Roof deck' }
    );
    M.groups.push({ title: 'Roof deck', faces: [id] });
  });
}

function buildRoofs(M, B, blocks, ext, planes, hb) {
  const roof = B.roof,
    e = B.eave,
    r = roof === 'hip' ? B.eave : B.rake;
  const faces = [];
  blocks.forEach((b, j) => {
    const axis = ridgeAxis(b),
      E = ext[j];
    /* overhang only on sides that face outside */
    const out = (x, z) => !coveredAt(blocks, x, z);
    const mx = (E.x0 + E.x1) / 2,
      mz = (E.z0 + E.z1) / 2;
    const ov = {
      z1: out(mx, E.z1 + 0.05) ? (axis === 'x' ? e : r) : 0,
      z0: out(mx, E.z0 - 0.05) ? (axis === 'x' ? e : r) : 0,
      x1: out(E.x1 + 0.05, mz) ? (axis === 'z' ? e : r) : 0,
      x0: out(E.x0 - 0.05, mz) ? (axis === 'z' ? e : r) : 0
    };
    const X0 = E.x0 - ov.x0,
      X1 = E.x1 + ov.x1,
      Z0 = E.z0 - ov.z0,
      Z1 = E.z1 + ov.z1;
    const zEdge = axis === 'x' || roof === 'hip' ? 'eave' : 'rake',
      xEdge = axis === 'z' || roof === 'hip' ? 'eave' : 'rake';
    /* counter-clockwise in plan (x right, z toward the viewer) */
    const dom = [
      { x: X0, z: Z0, e: xEdge },
      { x: X0, z: Z1, e: zEdge },
      { x: X1, z: Z1, e: xEdge },
      { x: X1, z: Z0, e: zEdge }
    ];
    planes[j].forEach((p, k) => {
      let poly = dom;
      planes[j].forEach((q, m) => {
        if (m !== k) poly = clip(poly, p.a - q.a, p.c - q.c, p.k - q.k, foldKind(p, q));
      });
      if (poly.length < 3 || Math.abs(area(poly)) < 1e-4) return;
      let pieces = [poly];
      /* cut away where another block's roof is higher */
      blocks.forEach((o, l) => {
        if (l === j) return;
        const R = ext[l];
        const cons = [
          { A: -1, C: 0, K: R.x0, lab: 'side' },
          { A: 1, C: 0, K: -R.x1, lab: 'side' },
          { A: 0, C: -1, K: R.z0, lab: 'side' },
          { A: 0, C: 1, K: -R.z1, lab: 'side' }
        ];
        let empty = false;
        planes[l].forEach(q => {
          const A = p.a - q.a,
            C = p.c - q.c,
            K = p.k - q.k;
          if (Math.abs(A) < 1e-9 && Math.abs(C) < 1e-9) {
            /* same plane: the earlier block keeps the shared part */
            if (K > 1e-7 || (Math.abs(K) <= 1e-7 && l > j)) empty = true;
            return;
          }
          cons.push({ A, C, K, lab: 'valley' });
        });
        if (empty) return;
        pieces = pieces.flatMap(pc => subtract(pc, cons));
      });
      merge(pieces).forEach(pc => {
        if (Math.abs(area(pc)) < 1e-3) return;
        faces.push({
          block: j,
          pts: pc.map(v => [v.x, yAt(p, v.x, v.z), v.z]),
          lab: pc.map(v => v.e),
          name: { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[p.dir] + ' slope'
        });
      });
    });
  });
  joinSeams(faces);
  const byBlock = new Map();
  faces.forEach(f => {
    const tagRole = f.lab.map(l => (typeof l === 'object' ? l : LAB[l] || LAB.free));
    /* point every roof face upward */
    const n = f.pts.length;
    let ny = 0;
    for (let i = 0; i < n; i++) {
      const a = f.pts[i],
        b = f.pts[(i + 1) % n];
      ny += (a[2] - b[2]) * (a[0] + b[0]);
    }
    let pts = f.pts,
      tr = tagRole;
    if (ny < 0) {
      pts = pts.slice().reverse();
      tr = pts.map((_, i) => tagRole[(n - 2 - i + n) % n]);
    }
    const id = mkFace(M, pts, {
      edge: tr.map(t => t.role),
      tag: tr.map(t => t.tag),
      art: { kind: 'roof', finish: B.roofFinish, pal: B.pal },
      name: f.name
    });
    if (!byBlock.has(f.block)) byBlock.set(f.block, []);
    byBlock.get(f.block).push(id);
  });
  [...byBlock.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([j, ids]) =>
      M.groups.push({
        title: blocks.length > 1 ? `Roof, block ${j + 1}` : 'Roof',
        faces: ids,
        pref: 'chain',
        check: true,
        mid: ids.map(i => [i])
      })
    );
}

/* Where two roof faces share an edge (coplanar seams, ridges, symmetric valleys), split edges at each
   other's corners so they line up, and make the shared edges fold or tab together. */
function joinSeams(faces) {
  const verts = faces.flatMap(f => f.pts);
  faces.forEach(f => {
    const pts = [],
      lab = [];
    const n = f.pts.length;
    for (let i = 0; i < n; i++) {
      const a = f.pts[i],
        b = f.pts[(i + 1) % n];
      pts.push(a);
      lab.push(f.lab[i]);
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
        L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
      if (L2 < 1e-12) continue;
      const ins = [];
      verts.forEach(v => {
        const t = ((v[0] - a[0]) * d[0] + (v[1] - a[1]) * d[1] + (v[2] - a[2]) * d[2]) / L2;
        if (t <= 1e-6 || t >= 1 - 1e-6) return;
        const q = [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t];
        if (
          Math.hypot(q[0] - v[0], q[1] - v[1], q[2] - v[2]) < 1e-4 &&
          !ins.some(s => Math.abs(s - t) < 1e-6)
        )
          ins.push(t);
      });
      ins
        .sort((x, y) => x - y)
        .forEach(t => {
          pts.push([a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t]);
          lab.push(f.lab[i]);
        });
    }
    f.pts = pts;
    f.lab = lab;
  });
  const key = p => p.map(v => Math.round(v * 1000)).join(',');
  const map = new Map();
  faces.forEach((f, fi) =>
    f.pts.forEach((p, i) => map.set(key(p) + '>' + key(f.pts[(i + 1) % f.pts.length]), [fi, i]))
  );
  faces.forEach((f, fi) =>
    f.pts.forEach((p, i) => {
      const hit = map.get(key(f.pts[(i + 1) % f.pts.length]) + '>' + key(p));
      if (!hit || hit[0] === fi) return;
      const cur = LAB[f.lab[i]] || LAB.free;
      f.lab[i] = { role: 'auto', tag: cur.tag === 'ridge' || cur.tag === 'hip' ? cur.tag : '' };
    })
  );
}

/* Vertical gable faces where a higher roof ends above a lower one inside the house. */
function buildSteps(M, B, blocks, ext, hb, top, allPlanes) {
  const stepB = Object.assign({}, B, { type: 'dormer' });
  blocks.forEach((b, j) => {
    const E = ext[j];
    const sides = [
      { P0: [E.x0, E.z1], P1: [E.x1, E.z1], n: [0, 1] },
      { P0: [E.x1, E.z1], P1: [E.x1, E.z0], n: [1, 0] },
      { P0: [E.x1, E.z0], P1: [E.x0, E.z0], n: [0, -1] },
      { P0: [E.x0, E.z0], P1: [E.x0, E.z1], n: [-1, 0] }
    ];
    sides.forEach(sd => {
      const { L, ux, uz, ss } = breakpoints(sd.P0, sd.P1, ext, allPlanes);
      const at = s => [sd.P0[0] + ux * s, sd.P0[1] + uz * s];
      const inside = s => {
        const [x, z] = at(s);
        return coveredAt(blocks, x + sd.n[0] * 0.05, z + sd.n[1] * 0.05);
      };
      /* heights of this roof and of the others along the side */
      const pts = ss.map(s => {
        const [x, z] = at(s);
        const lo = top(x, z, j);
        return { s, hi: hb(j, x, z), lo: Number.isFinite(lo) ? lo : B.H, in: true };
      });
      /* add the points where this roof crosses the others */
      const all = [];
      pts.forEach((p, i) => {
        all.push(p);
        const q = pts[i + 1];
        if (!q) return;
        const d0 = p.hi - p.lo,
          d1 = q.hi - q.lo;
        if (d0 * d1 < 0) {
          const t = d0 / (d0 - d1);
          all.push({ s: p.s + (q.s - p.s) * t, hi: p.hi + (q.hi - p.hi) * t, lo: p.hi + (q.hi - p.hi) * t });
        }
      });
      /* runs where this roof stands above the others, on a side that is inside the house */
      let run = [];
      const flush = () => {
        if (run.length >= 2) makeStep(M, stepB, sd, ux, uz, run);
        run = [];
      };
      for (let i = 0; i < all.length - 1; i++) {
        const p = all[i],
          q = all[i + 1];
        const up = Math.max(p.hi - p.lo, q.hi - q.lo) > 0.02 && Math.min(p.hi - p.lo, q.hi - q.lo) > -1e-6;
        if (up && q.s - p.s > 1e-6 && inside((p.s + q.s) / 2)) {
          if (!run.length) run.push(p);
          run.push(q);
        } else flush();
      }
      flush();
    });
  });
}

function makeStep(M, B, sd, ux, uz, run) {
  const s0 = run[0].s,
    L = run[run.length - 1].s - s0;
  if (L < 0.2) return;
  /* bottom left to right along the lower roof, then the top right to left under this roof */
  const raw = [];
  run.forEach((p, i) => raw.push({ pt: [p.s - s0, p.lo], role: 'attach', tag: '' }));
  run
    .slice()
    .reverse()
    .forEach(p => raw.push({ pt: [p.s - s0, p.hi], role: 'attach', tag: 'top' }));
  /* drop repeated points (where the two roofs meet) and points in the middle of straight runs */
  let pts = raw.filter((v, i) => {
    const w = raw[(i + 1) % raw.length];
    return Math.hypot(v.pt[0] - w.pt[0], v.pt[1] - w.pt[1]) > 1e-6;
  });
  pts = pts.filter((v, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length].pt,
      b = v.pt,
      c = pts[(i + 1) % pts.length].pt;
    return Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-7;
  });
  if (pts.length < 3) return;
  const o = [sd.P0[0] + ux * s0, 0, sd.P0[1] + uz * s0];
  const id = wallFace(
    M,
    o,
    [ux, 0, uz],
    pts.map(v => v.pt),
    {
      edge: pts.map(v => v.role),
      tag: pts.map(v => v.tag),
      name: 'Gable step',
      art: { kind: 'wall', role: 'party', side: 'step', B, occl: [] }
    }
  );
  M.groups.push({ title: 'Gable step', faces: [id] });
}

/* One chimney, on the ridge of the tallest block. */
function customChimney(M, B, blocks, roof) {
  const ranked = blocks
    .map(b => ({ b, h: peak(b, B, roof), a: (b.x1 - b.x0) * (b.z1 - b.z0) }))
    .sort((p, q) => q.h - p.h || q.a - p.a);
  const b = ranked[0].b,
    axis = ridgeAxis(b);
  const cx = (b.x0 + b.x1) / 2,
    cz = (b.z0 + b.z1) / 2;
  const along = axis === 'x' ? b.x1 - b.x0 : b.z1 - b.z0,
    span = axis === 'x' ? b.z1 - b.z0 : b.x1 - b.x0;
  /* other blocks touching this one, as spans to keep the chimney away from */
  const wings = [];
  blocks.forEach(n => {
    if (n === b) return;
    const touchZ = (Math.abs(n.z0 - b.z1) < EPS || Math.abs(n.z1 - b.z0) < EPS) && n.x0 < b.x1 && n.x1 > b.x0;
    const touchX = (Math.abs(n.x0 - b.x1) < EPS || Math.abs(n.x1 - b.x0) < EPS) && n.z0 < b.z1 && n.z1 > b.z0;
    if (axis === 'x') {
      if (touchZ) wings.push({ side: 'front', a: Math.max(n.x0, b.x0), b: Math.min(n.x1, b.x1) });
      if (touchX) wings.push({ side: Math.abs(n.x0 - b.x1) < EPS ? 'right' : 'left' });
    } else {
      if (touchX)
        wings.push({ side: 'front', a: cx + cz - Math.min(n.z1, b.z1), b: cx + cz - Math.max(n.z0, b.z0) });
      if (touchZ) wings.push({ side: Math.abs(n.z0 - b.z1) < EPS ? 'left' : 'right' });
    }
  });
  const pB = Object.assign({}, B, { W: along, D: span, cx, cz, roof, wings });
  const i0 = M.faces.length;
  buildChimney(M, pB, 'Chimney');
  if (axis === 'z') placeFaces(M, i0, wingFrame(pB, 'right'));
}
