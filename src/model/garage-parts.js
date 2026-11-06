/* The extra print-only parts for working garage doors (see art/openings/garage.js): for roll-up
   doors a door strip, a paper roller, two brackets and two tracks per door; optionally an inside
   floor and an inside back wall so an open door shows a finished room. */
import { garageMarks } from '../art/index.js';
import { S } from '../config/state.js';
import { bbox } from '../lib/geometry.js';
import { mkFace } from './faces.js';

/* flat parts are laid out far from the building, each in its own spot so no edges are shared by accident */
let slot = 0;
function rect(M, x, y, w, h, opts) {
  const X = 10000 + slot * 400;
  return mkFace(
    M,
    [
      [X + x, y, 0],
      [X + x + w, y, 0],
      [X + x + w, y + h, 0],
      [X + x, y + h, 0]
    ],
    Object.assign({ noPreview: true, noTab: true }, opts)
  );
}
/* panels side by side, folded where they meet */
function strip(M, widths, h, title, arts) {
  slot++;
  let x = 0;
  const ids = widths.map((pw, i) => {
    const edge = ['free', i < widths.length - 1 ? 'auto' : 'free', 'free', i > 0 ? 'auto' : 'free'];
    const id = rect(M, x, 0, pw, h, { edge, art: arts[i], name: title });
    x += pw;
    return id;
  });
  M.groups.push({ title, faces: ids, pref: 'chain' });
}
function single(M, w, h, title, art) {
  slot++;
  M.groups.push({
    title,
    faces: [rect(M, 0, 0, w, h, { edge: ['free', 'free', 'free', 'free'], art, name: title })]
  });
}

const OPP = { front: 'back', back: 'front', left: 'right', right: 'left' };

/** Finds the garage doors on the walls and adds their parts. Returns true when parts were added. */
export function addGarageParts(M) {
  const doors = [];
  M.faces.forEach(f => {
    if (!f.art || f.art.kind !== 'wall' || f.noPreview) return;
    garageMarks(f).forEach(d => doors.push(Object.assign({}, d, { f })));
  });
  M.garages = doors;
  if (!doors.length) return false;
  const n0 = M.faces.length;
  slot = 0;
  if (S.garageMode === 'roll')
    doors.forEach((d, i) => {
      const k = `Door ${i + 1}`,
        sp = (sub, extra) => Object.assign({ kind: 'special', sub, pal: d.c, door: d }, extra);
      single(M, d.w + 1, d.h + 2.5, `${k} roll-up strip`, sp('gStrip', { above: 2.5 }));
      single(M, d.w + 4, 4, `${k} roller`, sp('gRoller'));
      [1, 2].forEach(j => {
        strip(M, [0.8, 0.4, 0.6], d.h + 1.2, `${k} track ${j}`, [sp('gGlue'), sp('gPlain'), sp('gPlain')]);
        strip(M, [1.4, 1.4], 1.6, `${k} bracket ${j}`, [sp('gGlue'), sp('gHole')]);
      });
    });
  if (S.garageInside && S.garageMode !== 'print') {
    const doorWalls = new Set(doors.map(d => d.f)),
      byB = new Map();
    doors.forEach(d => {
      const A = d.f.art,
        B = A.B;
      if (!B) return;
      if (!byB.has(B)) byB.set(B, new Set());
      byB.get(B).add(A.role);
    });
    let u = 0;
    byB.forEach((roles, B) => {
      u++;
      const tag = byB.size > 1 ? ` ${u}` : '',
        H = B.H - B.found,
        pal = B.pal;
      single(M, B.W - 0.6, B.D - 0.6, `Inside floor${tag}`, { kind: 'special', sub: 'gFloor', pal });
      roles.forEach(role => {
        const opp = OPP[role];
        if (!opp || roles.has(opp)) return;
        const wall = M.faces.find(f => !doorWalls.has(f) && f.art && f.art.B === B && f.art.role === opp);
        const ww = wall
          ? bbox(wall.l2).x1 - bbox(wall.l2).x0
          : role === 'front' || role === 'back'
            ? B.W
            : B.D;
        single(M, ww - 0.6, H, `Inside ${opp} wall${tag}`, { kind: 'special', sub: 'gLiner', pal });
      });
    });
  }
  return M.faces.length > n0;
}
