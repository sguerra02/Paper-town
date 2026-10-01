/* The rotating 3D preview of the assembled model (Three.js). */
import { MODEL } from '../app.js';
import { artFor } from '../art/index.js';
import { tex } from '../art/scenery/objects.js';
import { $ } from '../lib/dom.js';
import { mapItems, svgItems } from '../lib/draw.js';
import { bbox } from '../lib/geometry.js';
import { clamp, f3 } from '../lib/math.js';

export const G = {};

export let t3 = null,
  buildId = 0;

export function init3D() {
  const el = $('#view3d');
  if (!window.THREE) {
    $('#cap3d').textContent = '3D preview unavailable (library did not load).';
    return false;
  }
  G.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  G.renderer.outputEncoding = THREE.sRGBEncoding;
  el.appendChild(G.renderer.domElement);
  G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 4000);
  G.scene.add(new THREE.HemisphereLight(0xffffff, 0x7d877f, 0.95));
  const dl = new THREE.DirectionalLight(0xffffff, 0.6);
  dl.position.set(60, 90, 70);
  G.scene.add(dl);
  G.az = 0.72;
  G.el = 0.34;
  G.dist = 90;
  let drag = null;
  el.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    G.az -= (e.clientX - drag.x) * 0.008;
    G.el = clamp(G.el + (e.clientY - drag.y) * 0.006, 0.03, 1.45);
    drag = { x: e.clientX, y: e.clientY };
    draw3D();
  });
  el.addEventListener('pointerup', () => {
    drag = null;
  });
  el.addEventListener('pointercancel', () => {
    drag = null;
  });
  el.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      G.dist = clamp(G.dist * (e.deltaY > 0 ? 1.08 : 0.93), G.minD || 10, G.maxD || 800);
      draw3D();
    },
    { passive: false }
  );
  new ResizeObserver(() => {
    const w = el.clientWidth,
      h = el.clientHeight;
    if (!w || !h) return;
    G.renderer.setSize(w, h);
    G.camera.aspect = w / h;
    G.camera.updateProjectionMatrix();
    draw3D();
  }).observe(el);
  return true;
}

export function draw3D() {
  if (!G.renderer) return;
  const t = G.target || new THREE.Vector3();
  G.camera.position.set(
    t.x + G.dist * Math.cos(G.el) * Math.sin(G.az),
    t.y + G.dist * Math.sin(G.el),
    t.z + G.dist * Math.cos(G.el) * Math.cos(G.az)
  );
  G.camera.lookAt(t);
  G.renderer.render(G.scene, G.camera);
}

export function schedule3D() {
  clearTimeout(t3);
  t3 = setTimeout(build3D, 140);
}

export function faceMesh(f) {
  const P = f.l2,
    bb = bbox(P),
    bw = Math.max(bb.x1 - bb.x0, 0.01),
    bh = Math.max(bb.y1 - bb.y0, 0.01);
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
  const base = f.art.kind === 'roof' ? f.art.pal.roof : f.art.kind === 'wall' ? f.art.B.pal.wall : '#cccccc';
  const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(base), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat);
  const id = buildId,
    px = 1024,
    cw = bw >= bh ? px : Math.max(32, Math.round((px * bw) / bh)),
    ch = bw >= bh ? Math.max(32, Math.round((px * bh) / bw)) : px;
  const u = 48 / (72 * 12);
  const items = artFor(f).map(it =>
    it.t === 'text' && it.sizeFt ? Object.assign({}, it, { size: it.sizeFt / u }) : it
  );
  const mapped = mapItems(items, ([x, y]) => [x - bb.x0, bb.y1 - y]).map(it =>
    it.t === 'text' ? Object.assign(it, { ang: -it.ang }) : it
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f3(bw)} ${f3(bh)}" width="${cw}" height="${ch}">${svgItems(mapped, u)}</svg>`;
  const img = new Image();
  img.onload = () => {
    if (id !== buildId) return;
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = G.renderer.capabilities.getMaxAnisotropy();
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
    draw3D();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return mesh;
}

export function build3D() {
  if (!G.renderer && !init3D()) return;
  const M = MODEL;
  if (!M) return;
  buildId++;
  if (G.group) {
    G.scene.remove(G.group);
    G.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }
  const grp = new THREE.Group();
  G.group = grp;
  M.faces.forEach(f => {
    if (!f.noPreview) grp.add(faceMesh(f));
  });
  const b = M.bounds;
  const cx = (b.x0 + b.x1) / 2,
    cz = (b.z0 + b.z1) / 2;
  const R = Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.8 + 6;
  const gnd = new THREE.Mesh(
    new THREE.CircleGeometry(R, 64),
    new THREE.MeshLambertMaterial({ color: 0xa9b8ad })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(cx, -0.03, cz);
  grp.add(gnd);
  G.scene.add(grp);
  const span = Math.max(b.x1 - b.x0, b.z1 - b.z0, b.y1);
  G.target = new THREE.Vector3(cx, b.y1 * 0.4, cz);
  if (G.lastSpan !== span) {
    G.dist = span * 2.5;
    G.minD = span * 0.8;
    G.maxD = span * 8;
    G.lastSpan = span;
  }
  draw3D();
}
