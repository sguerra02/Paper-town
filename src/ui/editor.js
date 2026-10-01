/* The window & door editor: drag openings on a wall elevation and edit their style and effects. */
import { MODEL, render } from '../app.js';
import { artFor } from '../art/index.js';
import { hasGlass } from '../art/openings/doors.js';
import { fxFor } from '../art/openings/effects.js';
import { drawOpening, fitsInside, houseOpenings } from '../art/openings/index.js';
import { SQUARE_SHAPES } from '../art/openings/windows.js';
import { EDIT, S } from '../config/state.js';
import { $, esc } from '../lib/dom.js';
import { mapItems, svgItems } from '../lib/draw.js';
import { bbox } from '../lib/geometry.js';
import { clamp, f3 } from '../lib/math.js';

export const OPEN_TYPES = {
  win: 'Window',
  door: 'Door',
  double: 'Double door',
  sliding: 'Sliding glass door',
  garage: 'Garage door'
};

export const OPEN_DEF = {
  win: { w: 3, h: 4.5 },
  door: { w: 3.2, h: 7 },
  double: { w: 5.6, h: 7.2 },
  sliding: { w: 6, h: 6.8 },
  garage: { w: 9, h: 7.5 },
  round: { w: 2.4, h: 2.4 }
};

export const DOOR_STYLES = {
  door: [
    ['panel', 'Four panel'],
    ['six', 'Six panel colonial'],
    ['half', 'Half glass'],
    ['full', 'Full glass'],
    ['craftsman', 'Craftsman'],
    ['dutch', 'Dutch (split)'],
    ['plank', 'Plank cottage'],
    ['arched', 'Arched plank'],
    ['barn', 'Barn X-brace']
  ],
  double: [
    ['glass', 'Glass upper'],
    ['french', 'French (full glass)'],
    ['panel', 'Solid panel']
  ],
  sliding: [
    ['two', 'Two panel'],
    ['three', 'Three panel'],
    ['grid', 'Two panel with grilles']
  ]
};

export function normOpening(o) {
  if (o.type === 'round') {
    o.type = 'win';
    o.style = 'round';
  }
  const ds = DOOR_STYLES[o.type];
  if (ds && !ds.some(d => d[0] === o.doorStyle)) o.doorStyle = ds[0][0];
  if (!ds) delete o.doorStyle;
  return o;
}

export function effFx(o) {
  if (o.fx) return o.fx;
  if (o.type === 'win' || o.type === 'round' || o.type === 'sliding') return fxFor(o.x, o.y, o.w, null) || {};
  return {};
}

export function overlapsO(a, b) {
  const m = 0.5;
  return a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
}

export function editorWalls() {
  return MODEL ? MODEL.faces.filter(f => f.art.kind === 'wall' && f.art.key) : [];
}

export function autoOpenings(f) {
  if (f.art.B.type !== 'house') return [];
  const keep = S.custom[f.art.key];
  if (keep) return keep;
  const saved = S.custom;
  S.custom = {};
  let o = [];
  try {
    o = houseOpenings(f).map(q => ({
      type: q.type,
      x: q.x,
      y: q.y,
      w: q.w,
      h: q.h,
      style: q.type === 'win' && !q.attic ? f.art.B.winStyle || 'rect' : 'rect'
    }));
  } finally {
    S.custom = saved;
  }
  return o;
}

export function curList(f) {
  return S.custom[f.art.key] || autoOpenings(f);
}

export function commitList(f, list) {
  S.custom = Object.assign({}, S.custom, { [f.art.key]: list.map(o => Object.assign({}, o)) });
}

export function edFace() {
  return editorWalls().find(f => f.art.key === EDIT.key) || null;
}

export function refreshEditor() {
  const ed = $('#editor');
  if (S.type === 'scenery') {
    ed.hidden = true;
    return;
  }
  ed.hidden = false;
  const walls = editorWalls();
  if (!walls.length) {
    ed.hidden = true;
    return;
  }
  if (!walls.some(f => f.art.key === EDIT.key)) {
    EDIT.key = (walls.find(f => f.art.key.endsWith(':front')) || walls[0]).art.key;
    EDIT.sel = -1;
  }
  $('#edWall').innerHTML = walls
    .map(
      f =>
        `<option value="${esc(f.art.key)}"${f.art.key === EDIT.key ? ' selected' : ''}>${esc(f.art.label)}${S.custom[f.art.key] ? ' ✎' : ''}</option>`
    )
    .join('');
  drawEditor();
}

export function drawEditor() {
  const f = edFace();
  if (!f) return;
  const P = f.l2,
    bb = bbox(P),
    W = bb.x1,
    T = bb.y1,
    pad = 1.5;
  EDIT.skip = f.art.key;
  let items;
  try {
    items = artFor(f);
  } finally {
    EDIT.skip = null;
  }
  const u = 48 / (72 * 12);
  const map = ([x, y]) => [x, T - y];
  const bg = mapItems(
    items.map(it => (it.t === 'text' && it.sizeFt ? Object.assign({}, it, { size: it.sizeFt / u }) : it)),
    map
  ).map(it => (it.t === 'text' ? Object.assign(it, { ang: -it.ang }) : it));
  const list = curList(f),
    c = f.art.B.pal;
  const ops = list
    .map((o, i) => {
      const og = mapItems(
        drawOpening(o, c, Object.assign({}, f.art.B, { winStyle: o.style || 'rect' })),
        map
      );
      const bad =
        !fitsInside(o, P, 0.05) ||
        list.some(
          (q, j) =>
            j !== i &&
            overlapsO(o, q) &&
            !(q.x >= o.x + o.w || o.x >= q.x + q.w || q.y >= o.y + o.h || o.y >= q.y + q.h)
        );
      return `<g class="op${i === EDIT.sel ? ' sel' : ''}${bad ? ' bad' : ''}" data-i="${i}">${svgItems(og, u)}<rect x="${f3(o.x - 0.35)}" y="${f3(T - o.y - o.h - 0.35)}" width="${f3(o.w + 0.7)}" height="${f3(o.h + 0.7)}" class="hit"/></g>`;
    })
    .join('');
  const grid = [];
  for (let x = 0; x <= W; x += 1)
    grid.push(
      `<line x1="${f3(x)}" y1="${f3(-pad)}" x2="${f3(x)}" y2="${f3(T + pad)}" class="g${Math.round(x) % 5 === 0 ? ' g5' : ''}"/>`
    );
  $('#edSvg').setAttribute('viewBox', `${f3(-pad)} ${f3(-pad)} ${f3(W + 2 * pad)} ${f3(T + 2 * pad)}`);
  $('#edSvg').innerHTML =
    `<g class="grid">${grid.join('')}</g>${svgItems(bg, u)}<line x1="${f3(-pad)}" y1="${f3(T)}" x2="${f3(W + pad)}" y2="${f3(T)}" class="ground"/>${ops}`;
  const o = list[EDIT.sel];
  $('#edProps').hidden = !o;
  $('#edNone').hidden = !!o;
  if (o) {
    const ty = o.type === 'round' ? 'win' : o.type,
      isWin = ty === 'win';
    $('#edType').value = ty;
    $('#edStyle').value = o.type === 'round' ? 'round' : o.style || 'rect';
    $('#edPanes').value = o.panes || (o.style === 'half' ? 'radial' : 'cross');
    $('#edShut').value = o.shut || 'auto';
    $('#edWinRow').hidden = !isWin;
    $('#edShutWrap').hidden = !isWin || !SQUARE_SHAPES[$('#edStyle').value];
    const ds = DOOR_STYLES[ty];
    $('#edDoorWrap').hidden = !ds;
    if (ds) {
      $('#edDoorSt').innerHTML = ds.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
      $('#edDoorSt').value = ds.some(d => d[0] === o.doorStyle) ? o.doorStyle : ds[0][0];
    }
    $('#edGarRow').hidden = ty !== 'garage';
    $('#edGStyle').value = o.gstyle || 'panel';
    $('#edGWin').checked = !!o.gwin;
    $('#edGWinWrap').hidden = o.gstyle === 'glass';
    const fx = effFx(o),
      gl = hasGlass(o);
    $('#edLit').checked = !!fx.lit;
    $('#edBoard').checked = !!fx.board;
    $('#edBroken').checked = !!fx.broken;
    ['#edLit', '#edBroken'].forEach(id => {
      $(id).disabled = !gl;
      $(id).parentNode.classList.toggle('off', !gl);
    });
    $('#edFxAuto').disabled = !o.fx;
    $('#edX').value = +o.x.toFixed(2);
    $('#edY').value = +o.y.toFixed(2);
    $('#edW').value = +o.w.toFixed(2);
    $('#edH').value = +o.h.toFixed(2);
    $('#edReadout').textContent =
      `${o.x.toFixed(1)} ft from left edge · ${(W - o.x - o.w).toFixed(1)} ft from right · bottom ${o.y.toFixed(1)} ft above ground${fitsInside(o, P, 0.05) ? '' : ' · sticks out past the wall'}${list.some((q, j) => j !== EDIT.sel && !(q.x >= o.x + o.w || o.x >= q.x + q.w || q.y >= o.y + o.h || o.y >= q.y + q.h)) ? ' · overlaps another opening' : ''}`;
  }
  $('#edInfo').textContent =
    f.art.B.type === 'house'
      ? S.custom[f.art.key]
        ? 'Custom layout. Reset returns this wall to automatic placement.'
        : 'Automatic layout. Any change switches this wall to your custom layout.'
      : "Openings you add here are drawn on top of this building's facade.";
}

export function snapPos(f, list, i, x, y) {
  const o = list[i],
    bb = bbox(f.l2),
    W = bb.x1,
    g = 0.25;
  let nx = Math.round(x / g) * g,
    ny = Math.round(y / g) * g;
  if (Math.abs(nx + o.w / 2 - W / 2) < 0.4) nx = W / 2 - o.w / 2;
  list.forEach((q, j) => {
    if (j === i) return;
    if (Math.abs(nx - q.x) < 0.35) nx = q.x;
    if (Math.abs(nx + o.w - (q.x + q.w)) < 0.35) nx = q.x + q.w - o.w;
    if (Math.abs(ny - q.y) < 0.35) ny = q.y;
    if (Math.abs(nx + o.w / 2 - (q.x + q.w / 2)) < 0.35) nx = q.x + q.w / 2 - o.w / 2;
  });
  const F = f.art.B.found || 0;
  if (
    (o.type === 'door' || o.type === 'double' || o.type === 'garage' || o.type === 'sliding') &&
    Math.abs(ny - F) < 0.6
  )
    ny = F;
  nx = clamp(nx, 0.2, W - o.w - 0.2);
  ny = clamp(ny, 0, bb.y1 - o.h - 0.2);
  return [nx, ny];
}

/** Wires up this module's event listeners. Called once from main.js. */
export function initEditor() {
  const svg = $('#edSvg');
  let drag = null;
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
    const g = e.target.closest('g.op');
    const f = edFace();
    if (!f) return;
    if (!g) {
      EDIT.sel = -1;
      drawEditor();
      return;
    }
    const i = +g.dataset.i,
      list = curList(f).map(o => Object.assign({}, o)),
      T = bbox(f.l2).y1,
      [px, py] = pt(e);
    EDIT.sel = i;
    drag = { i, list, f, dx: px - list[i].x, dy: T - py - list[i].y, g: null, moved: false };
    svg.setPointerCapture(e.pointerId);
    drawEditor();
    drag.g = svg.querySelector(`g.op[data-i="${i}"]`);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const T = bbox(drag.f.l2).y1,
      [px, py] = pt(e);
    const o = drag.list[drag.i];
    if (o._x0 === undefined) {
      o._x0 = o.x;
      o._y0 = o.y;
    }
    const [nx, ny] = snapPos(drag.f, drag.list, drag.i, px - drag.dx, T - py - drag.dy);
    drag.moved = true;
    o.x = nx;
    o.y = ny;
    if (drag.g) drag.g.setAttribute('transform', `translate(${f3(nx - o._x0)} ${f3(-(ny - o._y0))})`);
    const W = bbox(drag.f.l2).x1;
    $('#edReadout').textContent =
      `${nx.toFixed(1)} ft from left edge · ${(W - nx - o.w).toFixed(1)} ft from right · bottom ${ny.toFixed(1)} ft above ground`;
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      d.list.forEach(o => {
        delete o._x0;
        delete o._y0;
      });
      commitList(d.f, d.list);
      render();
    }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  $('#edWall').addEventListener('change', e => {
    EDIT.key = e.target.value;
    EDIT.sel = -1;
    drawEditor();
  });
  document.querySelectorAll('[data-add]').forEach(b =>
    b.addEventListener('click', () => {
      const f = edFace();
      if (!f) return;
      const t = b.dataset.add,
        d = OPEN_DEF[t],
        list = curList(f).map(o => Object.assign({}, o)),
        bb = bbox(f.l2),
        B = f.art.B;
      const w = Math.min(d.w, bb.x1 - 1),
        h = Math.min(d.h, bb.y1 - (B.found || 0) - 0.8);
      const y =
        t === 'win'
          ? (B.found || 0) + Math.min(2.6, (B.storyH || 9) * 0.3)
          : t === 'round'
            ? Math.min(bb.y1 - h - 1, (B.H || bb.y1) * 0.7)
            : B.found || 0;
      const yy = Math.max(0, y),
        cand = [];
      for (let k = 0; k <= Math.ceil(bb.x1); k++) {
        const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5;
        cand.push(bb.x1 / 2 - w / 2 + off);
      }
      const free = cand.find(
        x =>
          x >= 0.3 &&
          x + w <= bb.x1 - 0.3 &&
          !list.some(q => overlapsO({ x, y: yy, w, h }, q)) &&
          fitsInside({ x, y: yy, w, h }, f.l2, 0.05)
      );
      list.push(
        normOpening({
          type: t === 'round' ? 'win' : t,
          x: free !== undefined ? free : bb.x1 / 2 - w / 2,
          y: yy,
          w,
          h,
          style: t === 'round' ? 'round' : t === 'win' ? B.winStyle || 'rect' : 'rect'
        })
      );
      EDIT.sel = list.length - 1;
      commitList(f, list);
      render();
    })
  );
  $('#edDel').addEventListener('click', () => {
    const f = edFace();
    if (!f || EDIT.sel < 0) return;
    const list = curList(f).filter((_, i) => i !== EDIT.sel);
    EDIT.sel = -1;
    commitList(f, list);
    render();
  });
  $('#edReset').addEventListener('click', () => {
    const f = edFace();
    if (!f) return;
    const c = Object.assign({}, S.custom);
    delete c[f.art.key];
    S.custom = c;
    EDIT.sel = -1;
    render();
  });
  $('#edClear').addEventListener('click', () => {
    const f = edFace();
    if (!f) return;
    EDIT.sel = -1;
    commitList(f, []);
    render();
  });
  const prop = () => {
    const f = edFace();
    if (!f || EDIT.sel < 0) return;
    const list = curList(f).map(o => Object.assign({}, o)),
      o = list[EDIT.sel];
    const num = id => {
      const v = parseFloat($(id).value);
      return isFinite(v) ? v : null;
    };
    const prevT = o.type === 'round' ? 'win' : o.type;
    o.type = $('#edType').value;
    o.style = $('#edStyle').value;
    if (o.type !== prevT && OPEN_DEF[o.type]) {
      const d = OPEN_DEF[o.type],
        B = f.art.B,
        bb = bbox(f.l2);
      o.x += (o.w - Math.min(d.w, bb.x1 - 1)) / 2;
      o.w = Math.min(d.w, bb.x1 - 1);
      o.h = Math.min(d.h, bb.y1 - (B.found || 0) - 0.8);
      if (o.type !== 'win') o.y = B.found || 0;
      $('#edW').value = o.w;
      $('#edH').value = o.h;
      $('#edX').value = o.x;
      $('#edY').value = o.y;
    }
    o.panes = $('#edPanes').value;
    o.shut = $('#edShut').value;
    if (o.shut === 'auto') delete o.shut;
    if (!$('#edDoorWrap').hidden && DOOR_STYLES[o.type]) o.doorStyle = $('#edDoorSt').value;
    o.gstyle = $('#edGStyle').value;
    o.gwin = $('#edGWin').checked;
    if (o.type !== 'garage') {
      delete o.gstyle;
      delete o.gwin;
    }
    if (o.type !== 'win') {
      delete o.panes;
      delete o.shut;
    }
    normOpening(o);
    const w = num('#edW'),
      h = num('#edH'),
      x = num('#edX'),
      y = num('#edY');
    if (w) o.w = clamp(w, 0.8, 60);
    if (h) o.h = clamp(h, 0.8, 40);
    if (x !== null) o.x = x;
    if (y !== null) o.y = Math.max(0, y);
    commitList(f, list);
    render();
  };
  ['#edType', '#edStyle', '#edPanes', '#edShut', '#edDoorSt', '#edGStyle', '#edGWin'].forEach(id =>
    $(id).addEventListener('change', prop)
  );
  const setFx = () => {
    const f = edFace();
    if (!f || EDIT.sel < 0) return;
    const list = curList(f).map(o => Object.assign({}, o)),
      o = list[EDIT.sel];
    o.fx = { lit: $('#edLit').checked, board: $('#edBoard').checked, broken: $('#edBroken').checked };
    commitList(f, list);
    render();
  };
  ['#edLit', '#edBoard', '#edBroken'].forEach(id => $(id).addEventListener('change', setFx));
  $('#edFxAuto').addEventListener('click', () => {
    const f = edFace();
    if (!f || EDIT.sel < 0) return;
    const list = curList(f).map(o => Object.assign({}, o));
    delete list[EDIT.sel].fx;
    commitList(f, list);
    render();
  });
  ['#edX', '#edY', '#edW', '#edH'].forEach(id => $(id).addEventListener('change', prop));
  document.addEventListener('keydown', e => {
    if (
      (e.key === 'Delete' || e.key === 'Backspace') &&
      EDIT.sel >= 0 &&
      document.activeElement === document.body
    ) {
      $('#edDel').click();
    }
  });
}
