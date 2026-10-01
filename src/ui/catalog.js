/* The catalog: preset cards with rendered thumbnails, search and category filters. */
import { render } from '../app.js';
import { artFor } from '../art/index.js';
import { tex } from '../art/scenery/objects.js';
import { PRESETS } from '../config/presets/index.js';
import { EDIT, S, applyPreset } from '../config/state.js';
import { $, esc, status } from '../lib/dom.js';
import { mapItems, svgItems } from '../lib/draw.js';
import { bbox } from '../lib/geometry.js';
import { f3 } from '../lib/math.js';
import { buildModel } from '../model/index.js';
import { areaFor, pack, paperSize } from '../print/layout.js';
import { splitPiece } from '../print/split.js';
import { buildPieces, fits } from '../print/unfold.js';
import { syncControls } from './controls.js';

export const S0 = JSON.parse(JSON.stringify(S));

export const CAT_NAMES = {
  house: 'Houses',
  store: 'Main Street',
  road: 'Roadside',
  office: 'Offices & hotels',
  venue: 'Entertainment',
  civic: 'Civic',
  garden: 'Backyard & garden',
  industrial: 'Industrial',
  barn: 'Farm',
  castle: 'Castles',
  scenery: 'Scenery'
};

export const CAT = {
  view: 'catalog',
  cat: 'all',
  q: '',
  thumbs: {},
  queue: [],
  busy: false,
  io: null,
  r: null
};

export function catItems() {
  const out = [];
  Object.keys(CAT_NAMES).forEach(t =>
    (PRESETS[t] || []).forEach((p, i) => out.push({ type: t, idx: i, p, key: t + ':' + i }))
  );
  return out;
}

export function catTags(t, v) {
  const g = [];
  if (v.spooky || (v.boarded && v.lit)) g.push('Haunted');
  if (v.deck && v.deck !== 'none') g.push('Deck');
  if (v.balcony && v.balcony !== 'none') g.push('Balcony');
  if (v.porch && v.porch !== 'none') g.push(v.porch === 'portico' ? 'Portico' : 'Porch');
  if (v.tower) g.push('Tower');
  if (v.silo) g.push('Silo');
  if (v.garage) g.push('Garage');
  if (v.dormers) g.push('Dormers');
  if (v.canopy) g.push('Canopy');
  if (t === 'scenery' && v.scCat) {
    g.push(
      { ground: 'Ground', roads: 'Roads & rail' }[v.scCat] || v.scCat.replace(/^./, c => c.toUpperCase())
    );
  }
  return g.slice(0, 3);
}

export function catMeta(t, v) {
  if (t === 'scenery') return 'Scenery piece';
  const w = v.width || S0.width,
    d = v.depth || S0.depth,
    s = v.stories || 1;
  return `${w} × ${d} ft · ${s} ${s > 1 ? 'stories' : 'story'}`;
}

/* run fn with S set to a preset on top of the default settings, then put the user's settings back */
export function withPreset(it, fn) {
  const saved = JSON.parse(JSON.stringify(S));
  try {
    Object.keys(S).forEach(k => delete S[k]);
    Object.assign(S, JSON.parse(JSON.stringify(S0)), { type: it.type });
    if (it.p.cat) S.scCat = it.p.cat;
    applyPreset(it.p.v);
    S.mode = 'color';
    return fn();
  } finally {
    Object.keys(S).forEach(k => delete S[k]);
    Object.assign(S, saved);
  }
}

export function catChips() {
  const items = catItems(),
    n = { all: items.length };
  items.forEach(i => (n[i.type] = (n[i.type] || 0) + 1));
  $('#catChips').innerHTML = ['all', ...Object.keys(CAT_NAMES)]
    .map(
      k =>
        `<button type="button" data-cat="${k}" aria-pressed="${CAT.cat === k}">${k === 'all' ? 'Everything' : CAT_NAMES[k]}<small>${n[k] || 0}</small></button>`
    )
    .join('');
}

export function catRender() {
  const q = CAT.q.trim().toLowerCase(),
    items = catItems().filter(
      i =>
        (CAT.cat === 'all' || i.type === CAT.cat) &&
        (!q ||
          (i.p.name + ' ' + CAT_NAMES[i.type] + ' ' + catTags(i.type, i.p.v).join(' '))
            .toLowerCase()
            .includes(q))
    );
  $('#catEmpty').hidden = !!items.length;
  $('#catGrid').innerHTML = items
    .map(i => {
      const th = CAT.thumbs[i.key];
      return `<article class="cat-card" data-key="${i.key}">
    <button type="button" class="cat-thumb" data-open="${i.key}" aria-label="Customize ${esc(i.p.name)}">${th && th.url ? `<img src="${th.url}" alt="">` : `<span class="ph">${window.THREE ? 'Folding…' : ''}</span>`}<span class="scale">${th && th.sheets ? `≈ ${th.sheets} sheet${th.sheets > 1 ? 's' : ''} at 1:48 on Letter` : ''}</span></button>
    <div class="cat-body"><h3>${esc(i.p.name)}</h3><div class="cat-meta">${CAT_NAMES[i.type]} · ${catMeta(i.type, i.p.v)}</div>
      <div class="cat-tags">${catTags(i.type, i.p.v)
        .map(t => `<span>${esc(t)}</span>`)
        .join('')}</div>
      <div class="cat-act"><button type="button" class="go" data-open="${i.key}">Customize</button><button type="button" class="pdf" data-pdf="${i.key}">Download PDF</button></div></div></article>`;
    })
    .join('');
  catObserve();
}

export function catObserve() {
  if (!window.THREE) return;
  if (!CAT.io)
    CAT.io = new IntersectionObserver(
      es =>
        es.forEach(e => {
          if (!e.isIntersecting) return;
          const k = e.target.dataset.key;
          CAT.io.unobserve(e.target);
          if (!CAT.thumbs[k] && !CAT.queue.includes(k)) {
            CAT.queue.push(k);
            catPump();
          }
        }),
      { rootMargin: '300px' }
    );
  document.querySelectorAll('.cat-card').forEach(c => {
    if (!CAT.thumbs[c.dataset.key]) CAT.io.observe(c);
  });
}

export function catPump() {
  if (CAT.busy || !CAT.queue.length || CAT.view !== 'catalog') return;
  const k = CAT.queue.shift(),
    it = catItems().find(i => i.key === k);
  if (!it) {
    catPump();
    return;
  }
  CAT.busy = true;
  catThumb(it)
    .then(r => {
      CAT.thumbs[k] = r;
      const card = document.querySelector(`.cat-card[data-key="${k}"] .cat-thumb`);
      if (card) {
        const ph = card.querySelector('.ph');
        if (ph && r.url) {
          const im = document.createElement('img');
          im.src = r.url;
          im.alt = '';
          ph.replaceWith(im);
        } else if (ph) ph.textContent = 'Preview unavailable';
        card.querySelector('.scale').textContent = r.sheets
          ? `≈ ${r.sheets} sheet${r.sheets > 1 ? 's' : ''} at 1:48 on Letter`
          : '';
      }
    })
    .catch(() => {
      CAT.thumbs[k] = { url: null };
    })
    .finally(() => {
      CAT.busy = false;
      setTimeout(catPump, 16);
    });
}

export function catThumb(it) {
  /* model, face art and a sheet count are all made while S holds the preset */
  const data = withPreset(it, () => {
    const M = buildModel(),
      u = 48 / (72 * 12),
      faces = [];
    M.faces.forEach(f => {
      if (f.noPreview) return;
      const P = f.l2,
        bb = bbox(P),
        bw = Math.max(bb.x1 - bb.x0, 0.01),
        bh = Math.max(bb.y1 - bb.y0, 0.01),
        px = 256,
        cw = bw >= bh ? px : Math.max(16, Math.round((px * bw) / bh)),
        ch = bw >= bh ? Math.max(16, Math.round((px * bh) / bw)) : px;
      const items = artFor(f).map(q =>
        q.t === 'text' && q.sizeFt ? Object.assign({}, q, { size: q.sizeFt / u }) : q
      );
      const mapped = mapItems(items, ([x, y]) => [x - bb.x0, bb.y1 - y]).map(q =>
        q.t === 'text' ? Object.assign(q, { ang: -q.ang }) : q
      );
      faces.push({
        f,
        bb,
        bw,
        bh,
        cw,
        ch,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f3(bw)} ${f3(bh)}" width="${cw}" height="${ch}">${svgItems(mapped, u)}</svg>`
      });
    });
    let sheets = 0;
    try {
      const sz = paperSize('portrait'),
        area = areaFor(sz),
        raw = buildPieces(M, 48, area, false),
        pcs = [];
      raw.forEach(p => {
        if (fits(p, area)) pcs.push(p);
        else pcs.push(...splitPiece(p, area));
      });
      sheets = pack(pcs, sz).length;
    } catch (e) {
      sheets = 0;
    }
    return { M, faces, sheets };
  });
  if (!CAT.r) {
    CAT.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    CAT.r.setPixelRatio(1);
    CAT.r.setSize(480, 360);
    CAT.r.outputEncoding = THREE.sRGBEncoding;
  }
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7d877f, 0.95));
  const dl = new THREE.DirectionalLight(0xffffff, 0.6);
  dl.position.set(60, 90, 70);
  scene.add(dl);
  const disp = [];
  const loads = data.faces.map(
    d =>
      new Promise(res => {
        const { f, bb, bw, bh } = d;
        const P = f.l2;
        let tris;
        try {
          tris = THREE.ShapeUtils.triangulateShape(
            P.map(p => new THREE.Vector2(p[0], p[1])),
            []
          );
        } catch (e) {
          tris = [];
        }
        const pos = [],
          uv = [];
        tris.forEach(tr =>
          tr.forEach(i => {
            const p = f.pts[i];
            pos.push(p[0], p[1], p[2]);
            uv.push((P[i][0] - bb.x0) / bw, (P[i][1] - bb.y0) / bh);
          })
        );
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.computeVertexNormals();
        const mat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
        scene.add(new THREE.Mesh(g, mat));
        disp.push(g, mat);
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = d.cw;
          cv.height = d.ch;
          cv.getContext('2d').drawImage(img, 0, 0, d.cw, d.ch);
          const tex = new THREE.CanvasTexture(cv);
          tex.encoding = THREE.sRGBEncoding;
          mat.map = tex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
          disp.push(tex);
          res();
        };
        img.onerror = () => res();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d.svg);
      })
  );
  return Promise.all(loads).then(() => {
    const b = data.M.bounds,
      cx = (b.x0 + b.x1) / 2,
      cz = (b.z0 + b.z1) / 2,
      span = Math.max(b.x1 - b.x0, b.z1 - b.z0, b.y1, 4);
    const sh = new THREE.Mesh(
      new THREE.CircleGeometry(Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.62 + 2, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(cx, -0.05, cz);
    scene.add(sh);
    disp.push(sh.geometry, sh.material);
    const cam = new THREE.PerspectiveCamera(30, 4 / 3, 0.5, 4000),
      az = 0.72,
      el = it.type === 'scenery' ? 0.62 : 0.36,
      dist = span * 2.75,
      t = new THREE.Vector3(cx, b.y1 * 0.46, cz);
    cam.position.set(
      t.x + dist * Math.cos(el) * Math.sin(az),
      t.y + dist * Math.sin(el),
      t.z + dist * Math.cos(el) * Math.cos(az)
    );
    cam.lookAt(t);
    CAT.r.render(scene, cam);
    const url = CAT.r.domElement.toDataURL('image/png');
    disp.forEach(o => o.dispose && o.dispose());
    return { url, sheets: data.sheets };
  });
}

export function catOpen(key, thenPdf) {
  const it = catItems().find(i => i.key === key);
  if (!it) return;
  S.type = it.type;
  if (it.p.cat) S.scCat = it.p.cat;
  applyPreset(it.p.v);
  EDIT.key = null;
  EDIT.sel = -1;
  showView('design');
  syncControls();
  render();
  status(`Loaded ${it.p.name}.`);
  if (thenPdf) setTimeout(() => $('#dl').click(), 60);
}

export function showView(v) {
  CAT.view = v;
  $('.app').classList.toggle('is-catalog', v === 'catalog');
  $('#catView').hidden = v !== 'catalog';
  document
    .querySelectorAll('[data-view]')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  try {
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
  } catch (e) {}
  if (v === 'catalog') {
    catChips();
    catRender();
    catPump();
  }
  window.scrollTo(0, 0);
}

/** Wires up this module's event listeners. Called once from main.js. */
export function initCatalog() {
  document
    .querySelectorAll('[data-view]')
    .forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $('#catChips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    CAT.cat = b.dataset.cat;
    catChips();
    catRender();
  });
  $('#catQ').addEventListener('input', e => {
    CAT.q = e.target.value;
    catRender();
  });
  $('#catGrid').addEventListener('click', e => {
    const o = e.target.closest('[data-open]'),
      p = e.target.closest('[data-pdf]');
    if (o) catOpen(o.dataset.open, false);
    else if (p) catOpen(p.dataset.pdf, true);
  });
}
