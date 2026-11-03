/* The footprint designer: build a custom house outline from rectangles on a plan view.
   Blocks are stored in S.blocks as { x, z, w, d, ridge } in feet (x to the right, z toward the front). */
import { S } from '../config/state.js';
import { $ } from '../lib/dom.js';
import { clamp, f3 } from '../lib/math.js';
import { DEFAULT_BLOCKS, footprintIssues, outlineLoops } from '../model/building/custom.js';
import { effFoot } from '../model/building/shell.js';

const FP = { sel: 0, drag: null, view: null };
const MIN = 4;

function blocks() {
  if (!Array.isArray(S.blocks) || !S.blocks.length) S.blocks = DEFAULT_BLOCKS.map(b => ({ ...b }));
  return S.blocks;
}
const rectOf = b => ({ x0: b.x, x1: b.x + b.w, z0: b.z, z1: b.z + b.d, ridge: b.ridge || 'auto' });

function commit(list, rerender) {
  S.blocks = list.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, ridge: b.ridge || 'auto' }));
  rerender();
}

function bounds(list) {
  const x0 = Math.min(...list.map(b => b.x)),
    x1 = Math.max(...list.map(b => b.x + b.w)),
    z0 = Math.min(...list.map(b => b.z)),
    z1 = Math.max(...list.map(b => b.z + b.d));
  return { x0, x1, z0, z1 };
}

function viewBox(list) {
  const bb = bounds(list),
    pad = 8;
  let w = bb.x1 - bb.x0 + 2 * pad,
    h = bb.z1 - bb.z0 + 2 * pad + 4;
  w = Math.max(w, 50);
  h = Math.max(h, 34);
  const cx = (bb.x0 + bb.x1) / 2,
    cz = (bb.z0 + bb.z1) / 2 + 2;
  return { x: cx - w / 2, y: cz - h / 2, w, h };
}

const axisOf = b => (b.ridge === 'x' || b.ridge === 'z' ? b.ridge : b.w >= b.d ? 'x' : 'z');

/* Shows or hides the designer and redraws it. Called after every render. */
export function refreshFootprint() {
  const show = S.type === 'house' && effFoot() === 'custom';
  $('#fpEditor').hidden = !show;
  if (!show) return;
  if (!FP.drag) drawFootprint();
}

function drawFootprint() {
  const list = FP.drag ? FP.drag.list : blocks();
  if (FP.sel >= list.length) FP.sel = list.length - 1;
  const vb = FP.drag ? FP.drag.vb : viewBox(list);
  FP.view = vb;
  const issues = footprintIssues(list.map(rectOf));
  const bad = new Set(issues.filter(i => i.kind === 'overlap').flatMap(i => [i.a, i.b]));
  const grid = [];
  for (let x = Math.ceil(vb.x); x <= vb.x + vb.w; x++)
    grid.push(
      `<line x1="${x}" y1="${f3(vb.y)}" x2="${x}" y2="${f3(vb.y + vb.h)}" class="g${x % 5 === 0 ? ' g5' : ''}"/>`
    );
  for (let z = Math.ceil(vb.y); z <= vb.y + vb.h; z++)
    grid.push(
      `<line x1="${f3(vb.x)}" y1="${z}" x2="${f3(vb.x + vb.w)}" y2="${z}" class="g${z % 5 === 0 ? ' g5' : ''}"/>`
    );
  /* outline of the whole house */
  const loops = outlineLoops(list.map(rectOf));
  const outline = loops
    .map(l => `<path d="M${l.map(p => f3(p[0]) + ' ' + f3(p[1])).join('L')}Z" class="ol"/>`)
    .join('');
  const shapes = list
    .map((b, i) => {
      const ax = axisOf(b);
      const ridge =
        ax === 'x'
          ? `<line x1="${f3(b.x + 0.8)}" y1="${f3(b.z + b.d / 2)}" x2="${f3(b.x + b.w - 0.8)}" y2="${f3(b.z + b.d / 2)}" class="rg"/>`
          : `<line x1="${f3(b.x + b.w / 2)}" y1="${f3(b.z + 0.8)}" x2="${f3(b.x + b.w / 2)}" y2="${f3(b.z + b.d - 0.8)}" class="rg"/>`;
      const sel = i === FP.sel;
      const hs = sel
        ? [
            ['nw', b.x, b.z],
            ['n', b.x + b.w / 2, b.z],
            ['ne', b.x + b.w, b.z],
            ['e', b.x + b.w, b.z + b.d / 2],
            ['se', b.x + b.w, b.z + b.d],
            ['s', b.x + b.w / 2, b.z + b.d],
            ['sw', b.x, b.z + b.d],
            ['w', b.x, b.z + b.d / 2]
          ]
            .map(
              ([h, x, z]) =>
                `<rect class="hd" data-h="${h}" x="${f3(x - 0.7)}" y="${f3(z - 0.7)}" width="1.4" height="1.4"/>`
            )
            .join('')
        : '';
      const fs = Math.min(3, b.w / 3, b.d / 3);
      return `<g class="blk${sel ? ' sel' : ''}${bad.has(i) ? ' bad' : ''}" data-i="${i}">
        <rect class="body" x="${f3(b.x)}" y="${f3(b.z)}" width="${f3(b.w)}" height="${f3(b.d)}"/>${ridge}
        <text x="${f3(b.x + b.w / 2)}" y="${f3(b.z + b.d / 2 - fs * 0.25)}" font-size="${f3(fs)}" class="num">${i + 1}</text>
        <text x="${f3(b.x + b.w / 2)}" y="${f3(b.z + b.d / 2 + fs * 0.75)}" font-size="${f3(fs * 0.55)}" class="dim">${b.w} × ${b.d} ft</text>${hs}</g>`;
    })
    .join('');
  const bb = bounds(list);
  const front = `<text x="${f3((bb.x0 + bb.x1) / 2)}" y="${f3(bb.z1 + 4.2)}" font-size="1.8" class="front">FRONT</text>`;
  const svg = $('#fpSvg');
  svg.setAttribute('viewBox', `${f3(vb.x)} ${f3(vb.y)} ${f3(vb.w)} ${f3(vb.h)}`);
  svg.innerHTML = `<g class="grid">${grid.join('')}</g>${outline}${shapes}${front}`;

  const b = list[FP.sel];
  $('#fpProps').hidden = !b;
  $('#fpNone').hidden = !!b;
  if (b) {
    $('#fpW').value = b.w;
    $('#fpD').value = b.d;
    document
      .querySelectorAll('#fpRidge button')
      .forEach(x => x.setAttribute('aria-pressed', String((b.ridge || 'auto') === x.dataset.v)));
  }
  $('#fpDel').disabled = list.length < 2;
  $('#fpSize').textContent =
    `${Math.round(bb.x1 - bb.x0)} × ${Math.round(bb.z1 - bb.z0)} ft overall · ${list.length} block${list.length > 1 ? 's' : ''}`;
  const msg = {
    overlap: 'Blocks marked in red overlap. Move them so they only touch.',
    apart: 'Some blocks do not touch the rest, so they build as separate buildings.',
    courtyard: 'The blocks surround a courtyard. Its walls face inward.'
  };
  $('#fpReadout').textContent = [...new Set(issues.map(i => msg[i.kind]))].join(' ');
}

/* snap a moving or resizing block: whole feet, then onto the edges of the other blocks */
function snap(list, i, r, edges) {
  const others = list.filter((_, j) => j !== i);
  const xs = others.flatMap(o => [o.x, o.x + o.w]),
    zs = others.flatMap(o => [o.z, o.z + o.d]);
  const near = (v, cands) => {
    let best = null;
    cands.forEach(c => {
      if (Math.abs(c - v) <= 1.2 && (best === null || Math.abs(c - v) < Math.abs(best - v))) best = c;
    });
    return best;
  };
  const out = { x: Math.round(r.x), z: Math.round(r.z), w: Math.round(r.w), d: Math.round(r.d) };
  if (edges === 'move') {
    const sx = [near(r.x, xs), near(r.x + r.w, xs)],
      sz = [near(r.z, zs), near(r.z + r.d, zs)];
    if (sx[0] !== null) out.x = sx[0];
    else if (sx[1] !== null) out.x = sx[1] - out.w;
    if (sz[0] !== null) out.z = sz[0];
    else if (sz[1] !== null) out.z = sz[1] - out.d;
    return out;
  }
  let x0 = r.x,
    x1 = r.x + r.w,
    z0 = r.z,
    z1 = r.z + r.d;
  const fix = (v, cands) => {
    const s = near(v, cands);
    return s !== null ? s : Math.round(v);
  };
  if (edges.includes('w')) x0 = fix(x0, xs);
  if (edges.includes('e')) x1 = fix(x1, xs);
  if (edges.includes('n')) z0 = fix(z0, zs);
  if (edges.includes('s')) z1 = fix(z1, zs);
  return { x: Math.round(x0), z: Math.round(z0), w: Math.round(x1 - x0), d: Math.round(z1 - z0) };
}

/* first spot to the right of a block (then below, then left) that does not overlap anything */
function freeSpot(list, from, w, d) {
  const hits = r => list.some(o => r.x < o.x + o.w && o.x < r.x + w && r.z < o.z + o.d && o.z < r.z + d);
  const tries = [
    { x: from.x + from.w, z: from.z },
    { x: from.x, z: from.z + from.d },
    { x: from.x - w, z: from.z },
    { x: from.x, z: from.z - d }
  ];
  for (const t of tries) if (!hits(t)) return t;
  const bb = bounds(list);
  return { x: bb.x1, z: bb.z0 };
}

export function initFootprint(rerender) {
  const svg = $('#fpSvg');
  const pt = e => {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(m.inverse());
    return [q.x, q.y];
  };
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('g.blk');
    if (!g) {
      FP.sel = -1;
      drawFootprint();
      return;
    }
    const i = +g.dataset.i,
      h = e.target.dataset.h || 'move';
    FP.sel = i;
    const list = blocks().map(b => ({ ...b }));
    FP.drag = { i, h, list, start: pt(e), orig: { ...list[i] }, vb: FP.view || viewBox(list), moved: false };
    svg.setPointerCapture(e.pointerId);
    drawFootprint();
    e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    const d = FP.drag;
    if (!d) return;
    const [px, pz] = pt(e),
      dx = px - d.start[0],
      dz = pz - d.start[1],
      o = d.orig;
    let r;
    if (d.h === 'move') r = snap(d.list, d.i, { x: o.x + dx, z: o.z + dz, w: o.w, d: o.d }, 'move');
    else {
      let x0 = o.x,
        x1 = o.x + o.w,
        z0 = o.z,
        z1 = o.z + o.d;
      if (d.h.includes('w')) x0 = Math.min(x1 - MIN, o.x + dx);
      if (d.h.includes('e')) x1 = Math.max(x0 + MIN, o.x + o.w + dx);
      if (d.h.includes('n')) z0 = Math.min(z1 - MIN, o.z + dz);
      if (d.h.includes('s')) z1 = Math.max(z0 + MIN, o.z + o.d + dz);
      r = snap(d.list, d.i, { x: x0, z: z0, w: x1 - x0, d: z1 - z0 }, d.h);
      if (r.w < MIN || r.d < MIN) return;
    }
    Object.assign(d.list[d.i], r);
    d.moved = true;
    drawFootprint();
  });
  const end = () => {
    const d = FP.drag;
    if (!d) return;
    FP.drag = null;
    if (d.moved) commit(d.list, rerender);
    else drawFootprint();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', e => {
    const list = blocks().map(b => ({ ...b })),
      b = list[FP.sel];
    if (!b) return;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) {
      b.x += mv[0];
      b.z += mv[1];
      e.preventDefault();
      commit(list, rerender);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && list.length > 1) {
      list.splice(FP.sel, 1);
      FP.sel = Math.min(FP.sel, list.length - 1);
      e.preventDefault();
      commit(list, rerender);
    }
  });
  $('#fpAdd').addEventListener('click', () => {
    const list = blocks().map(b => ({ ...b }));
    const from = list[FP.sel] || list[list.length - 1];
    const spot = freeSpot(list, from, 12, 12);
    list.push({ x: spot.x, z: spot.z, w: 12, d: 12, ridge: 'auto' });
    FP.sel = list.length - 1;
    commit(list, rerender);
  });
  $('#fpDup').addEventListener('click', () => {
    const list = blocks().map(b => ({ ...b }));
    const from = list[FP.sel];
    if (!from) return;
    const spot = freeSpot(list, from, from.w, from.d);
    list.push({ ...from, x: spot.x, z: spot.z });
    FP.sel = list.length - 1;
    commit(list, rerender);
  });
  $('#fpDel').addEventListener('click', () => {
    const list = blocks().map(b => ({ ...b }));
    if (list.length < 2 || FP.sel < 0) return;
    list.splice(FP.sel, 1);
    FP.sel = Math.min(FP.sel, list.length - 1);
    commit(list, rerender);
  });
  $('#fpReset').addEventListener('click', () => {
    FP.sel = 0;
    commit(
      DEFAULT_BLOCKS.map(b => ({ ...b })),
      rerender
    );
  });
  const size = () => {
    const list = blocks().map(b => ({ ...b })),
      b = list[FP.sel];
    if (!b) return;
    const w = parseFloat($('#fpW').value),
      d = parseFloat($('#fpD').value);
    if (isFinite(w)) b.w = clamp(Math.round(w), MIN, 120);
    if (isFinite(d)) b.d = clamp(Math.round(d), MIN, 120);
    commit(list, rerender);
  };
  ['#fpW', '#fpD'].forEach(id => $(id).addEventListener('change', size));
  $('#fpRidge').addEventListener('click', e => {
    const btn = e.target.closest('button[data-v]');
    if (!btn) return;
    const list = blocks().map(b => ({ ...b })),
      b = list[FP.sel];
    if (!b) return;
    b.ridge = btn.dataset.v;
    commit(list, rerender);
  });
}
