/* Builds the complete 3D model for the current settings. */
import { SIGNS, STORY_LIM, VARY_ACC, VARY_WALL } from '../config/constants.js';
import { S } from '../config/state.js';
import { clamp } from '../lib/math.js';
import { baseB, buildUnit, effFoot, wingsFor } from './building/shell.js';
import { buildCanopy } from './features/commercial.js';
import { rotateFaces } from './features/towers.js';
import { sceneryModel } from './scenery/index.js';

export function buildModel() {
  const M = { faces: [], groups: [], maxH: 0 };
  const foot = effFoot();
  if (S.type === 'scenery') {
    sceneryModel(M);
  } else if (foot === 'row') {
    const n = S.units,
      gap = 0.05,
      total = n * S.width + (n - 1) * gap;
    for (let i = 0; i < n; i++) {
      const B = baseB();
      B.cx = -total / 2 + S.width / 2 + i * (S.width + gap);
      B.partyL = i > 0;
      B.partyR = i < n - 1;
      B.tag = `Unit ${i + 1}`;
      if (S.vary && i > 0) {
        const Lm = STORY_LIM[S.type];
        B.stories = clamp(B.stories + [0, 1, 0, -1][i % 4], Lm[0], Lm[1]);
        const list = S.wallFinish === 'brick' ? VARY_WALL.brick : VARY_WALL.other;
        B.col = Object.assign({}, B.col, {
          wall: list[(i - 1) % list.length],
          accent: VARY_ACC[(i - 1) % VARY_ACC.length]
        });
        if (B.type === 'store') {
          B.parapet = ['cornice', 'stepped', 'arched'][
            (['cornice', 'stepped', 'arched'].indexOf(S.parapet) + i) % 3
          ];
          B.sign = SIGNS.store[(i - 1) % SIGNS.store.length];
        }
        if (B.type === 'office') B.sign = SIGNS.office[(i - 1) % SIGNS.office.length];
      }
      buildUnit(M, B);
    }
  } else {
    const B = baseB();
    B.wings = wingsFor(B);
    const i0 = M.faces.length;
    buildUnit(M, B);
    if (B.type === 'civic' && B.civKind === 'church') rotateFaces(M, i0);
    if (S.type === 'road' && S.roadKind === 'gas' && S.canopy) buildCanopy(M, B);
  }
  // edge index (auto edges only)
  const map = new Map();
  const key = (a, b) =>
    a.map(v => Math.round(v * 100)).join(',') + '|' + b.map(v => Math.round(v * 100)).join(',');
  M.faces.forEach(f => {
    const n = f.pts.length;
    for (let i = 0; i < n; i++) {
      if (f.edge[i] !== 'auto') continue;
      map.set(key(f.pts[i], f.pts[(i + 1) % n]), { f: f.id, i });
    }
  });
  M.partner = (f, i) => {
    if (f.edge[i] !== 'auto') return null;
    const n = f.pts.length;
    return map.get(key(f.pts[(i + 1) % n], f.pts[i])) || null;
  };
  let x0 = 1e9,
    x1 = -1e9,
    y1 = 0,
    z0 = 1e9,
    z1 = -1e9;
  M.faces.forEach(f => {
    if (f.noPreview) return;
    f.pts.forEach(p => {
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
      z0 = Math.min(z0, p[2]);
      z1 = Math.max(z1, p[2]);
    });
  });
  M.bounds = { x0, x1, y1, z0, z1 };
  return M;
}
