/* Main building shell: footprint, wall outlines, wings and the per-unit build that adds every feature. */
import { ROWABLE, STORY_LIM } from '../../config/constants.js';
import { S } from '../../config/state.js';
import { poly } from '../../lib/draw.js';
import { Vdot, freeIntervals, spread, subtractConvex } from '../../lib/geometry.js';
import { clamp, cleanSign } from '../../lib/math.js';
import { gamb, ridgeInfo, roofFaces, sawSide } from './roofs.js';
import { baseFace, loc, mkFace, tmpFrame, unloc, wallFace } from '../faces.js';
import { buildAddons } from '../features/addons.js';
import {
  awningFaces,
  bladeSign,
  flatCanopy,
  flatCanopyX,
  penthouse,
  pylonSign
} from '../features/commercial.js';
import { buildChimney, buildDormer, buildPorch } from '../features/house.js';
import { buildTower, civicExtras } from '../features/towers.js';
import { colorsFromS, makePal } from '../palette.js';

export function effFoot() {
  const T = S.type;
  if (T === 'house') return S.foot;
  if (ROWABLE[T] && S.foot === 'row') return 'row';
  return 'rect';
}

export function effRoof() {
  const T = S.type;
  if (T === 'civic') return S.civKind === 'church' ? 'gable' : S.civKind === 'station' ? 'hip' : 'flat';
  if (T === 'garden') return 'gable';
  if (T === 'industrial') return S.indKind === 'factory' ? 'saw' : 'gable';
  if (T === 'barn') return S.roof === 'gable' ? 'gable' : 'gambrel';
  if (T !== 'house') return 'flat';
  const f = effFoot();
  if ((f === 'L' || f === 'T' || f === 'U') && !(S.roof === 'gable' || S.roof === 'hip')) return 'gable';
  return S.roof;
}

export function baseB() {
  const L = STORY_LIM[S.type];
  let st = clamp(Math.round(S.stories), L[0], L[1]);
  if (S.type === 'road' && S.roadKind !== 'motel') st = 1;
  const ind = S.type === 'industrial';
  return {
    type: S.type,
    W: S.width,
    D: S.depth,
    stories: st,
    storyH: S.storyH,
    found: S.found,
    pitch: ind ? (S.indKind === 'storage' ? 1.5 : S.pitch) : S.pitch,
    eave: ind ? 0.6 : S.eave,
    rake: ind ? 0.4 : S.rake,
    venueKind: S.venueKind,
    indKind: S.indKind,
    civKind: S.civKind,
    gKind: S.gKind,
    winStyle: S.type === 'house' ? S.winStyle : 'rect',
    gableFish: S.type === 'house' && S.gableFish,
    garage: S.type === 'house' && S.garage,
    porch: S.type === 'house' ? S.porch : 'none',
    deck: S.type === 'house' ? S.deck : 'none',
    deckW: S.deckW,
    deckD: S.deckD,
    balcony: S.type === 'house' ? S.balcony : 'none',
    balcW: S.balcW,
    dormers: S.type === 'house' && S.dormers,
    roof: effRoof(),
    finish: S.wallFinish,
    roofFinish: S.roofFinish,
    col: colorsFromS(),
    sign: cleanSign(S.sign),
    parapet: S.parapet,
    awning: S.awning,
    roadKind: S.roadKind,
    bays: S.bays,
    shutters: S.type === 'house' && S.shutters,
    chimney: S.chimney,
    tower: S.tower,
    silo: S.silo,
    spooky: S.type === 'house' && S.spooky,
    storeStyle: S.storeStyle,
    officeStyle: S.officeStyle,
    cx: 0,
    cz: 0,
    partyL: false,
    partyR: false,
    tag: ''
  };
}

export function derive(B) {
  B.pal = makePal(B.col);
  B.G = B.type === 'store' ? B.storyH + 3 : B.type === 'office' ? B.storyH + 4 : 0;
  B.H = B.G ? B.found + B.G + (B.stories - 1) * B.storyH : B.found + B.stories * B.storyH;
  if (B.roof === 'flat') {
    if (B.type === 'store') {
      if (B.storeStyle === 'modern') {
        B.Hs = B.H + 1.5;
        B.Hf = B.H + 2.6;
      } else {
        B.Hs = B.H + 1.5;
        B.Hf = B.H + 3.2;
      }
    } else if (B.type === 'road') {
      B.Hs = B.Hf = B.H + 2.6;
    } else if (B.type === 'office') {
      B.Hs = B.Hf = B.H + (B.officeStyle === 'hotel' ? 4 : 2.5);
    } else if (B.type === 'venue') {
      B.Hs = B.H + 2;
      B.Hf = B.H + { theater: 4, casino: 6, bowling: 8, bar: 2.5, gym: 3 }[B.venueKind];
    } else if (B.type === 'civic') {
      B.Hs = B.Hf = B.H + 3;
    } else if (B.type === 'castle') {
      B.Hs = B.Hf = B.H;
      B.crenel = 3;
    } else {
      B.Hs = B.Hf = B.H + 1.2;
    }
  }
  return B;
}

export function frontProfile(B, w) {
  const Hf = B.Hf;
  if (B.storeStyle === 'modern')
    return [
      [w, Hf],
      [0, Hf]
    ];
  if (B.parapet === 'stepped')
    return [
      [w, Hf],
      [w * 0.68, Hf],
      [w * 0.68, Hf + 1.6],
      [w * 0.32, Hf + 1.6],
      [w * 0.32, Hf],
      [0, Hf]
    ];
  if (B.parapet === 'arched') {
    const pts = [
      [w, Hf],
      [w * 0.76, Hf]
    ];
    for (let i = 1; i < 10; i++) {
      const th = (i / 10) * Math.PI;
      pts.push([w / 2 + w * 0.26 * Math.cos(th), Hf + 2.3 * Math.sin(th)]);
    }
    pts.push([w * 0.24, Hf], [0, Hf]);
    return pts;
  }
  return [
    [w, Hf],
    [0, Hf]
  ];
}

/* crenellated top: returns full polygon for a wall of width w, walk height h, merlon height mh */
export function crenelPoly(w, h, mh) {
  const k = Math.max(1, Math.round(w / 2.8)),
    n = 2 * k - 1,
    sw = w / n;
  const poly = [
    [0, 0],
    [w, 0]
  ];
  for (let j = 0; j < n; j++) {
    const y = j % 2 === 0 ? h + mh : h;
    poly.push([w - j * sw, y], [w - (j + 1) * sw, y]);
  }
  const out = [];
  poly.forEach(p => {
    const l = out[out.length - 1];
    if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-9) out.push(p);
  });
  const edge = out.map((_, i) =>
    i === 0 ? 'attach' : i === 1 ? 'auto' : i === out.length - 1 ? 'auto' : 'free'
  );
  const tag = out.map((_, i) => (i >= 2 && i < out.length - 1 ? 'top' : ''));
  return { poly: out, edge, tag };
}

export function wallProfile(B, role, w) {
  const H = B.H,
    t = B.pitch / 12,
    side = role === 'left' || role === 'right';
  const rect = (h, topLab = 'attach', topTag = '') => ({
    poly: [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h]
    ],
    edge: ['attach', 'auto', topLab, 'auto'],
    tag: ['', '', topTag, '']
  });
  switch (B.roof) {
    case 'gable':
      if (!side) return rect(H);
      return {
        poly: [
          [0, 0],
          [w, 0],
          [w, H],
          [w / 2, H + (w / 2) * t],
          [0, H]
        ],
        edge: ['attach', 'auto', 'attach', 'attach', 'auto'],
        tag: ['', '', 'top', 'top', '']
      };
    case 'hip':
      return rect(H);
    case 'saw':
      if (!side) return rect(H);
      return sawSide(B, w, role === 'right');
    case 'gambrel': {
      if (!side) return rect(H);
      const g = gamb(t),
        b = w * 0.2,
        r1 = b * g.t1,
        r2 = (w / 2 - b) * g.t2;
      return {
        poly: [
          [0, 0],
          [w, 0],
          [w, H],
          [w - b, H + r1],
          [w / 2, H + r1 + r2],
          [b, H + r1],
          [0, H]
        ],
        edge: ['attach', 'auto', 'attach', 'attach', 'attach', 'attach', 'auto'],
        tag: ['', '', 'top', 'top', 'top', 'top', '']
      };
    }
    case 'shed': {
      const Hb = H + B.D * t;
      if (role === 'front') return rect(H);
      if (role === 'back') return rect(Hb);
      if (role === 'right')
        return {
          poly: [
            [0, 0],
            [w, 0],
            [w, Hb],
            [0, H]
          ],
          edge: ['attach', 'auto', 'attach', 'auto'],
          tag: ['', '', 'top', '']
        };
      return {
        poly: [
          [0, 0],
          [w, 0],
          [w, H],
          [0, Hb]
        ],
        edge: ['attach', 'auto', 'attach', 'auto'],
        tag: ['', '', 'top', '']
      };
    }
    case 'flat': {
      const Hs = B.Hs,
        Hf = B.Hf;
      if (B.crenel) return crenelPoly(w, B.H, B.crenel);
      if (role === 'front' && Hf > Hs + 0.01) {
        const top = frontProfile(B, w);
        const poly = [[0, 0], [w, 0], [w, Hs], ...top, [0, Hs]];
        const edge = ['attach', 'auto', 'free'],
          tag = ['', '', ''];
        for (let i = 0; i < top.length - 1; i++) {
          edge.push('free');
          tag.push('top');
        }
        edge.push('free', 'auto');
        tag.push('', '');
        return { poly, edge, tag };
      }
      return rect(Hs, 'free', 'top');
    }
  }
}

export function rectWalls(M, B, occl) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2;
  const defs = [
    ['front', [xL, 0, zF], [1, 0, 0], B.W],
    ['right', [xR, 0, zF], [0, 0, -1], B.D],
    ['back', [xR, 0, zB], [-1, 0, 0], B.W],
    ['left', [xL, 0, zB], [0, 0, 1], B.D]
  ];
  const names = { front: 'Front', right: 'Right side', back: 'Back', left: 'Left side' };
  return defs.map(([role, o, u, w]) => {
    let r = role;
    if (role === 'left' && B.partyL) r = 'party';
    if (role === 'right' && B.partyR) r = 'party';
    const pr = wallProfile(B, role, w);
    return wallFace(M, o, u, pr.poly, {
      edge: pr.edge,
      tag: pr.tag,
      name: names[role],
      art: {
        kind: 'wall',
        role: r,
        side: role,
        B,
        occl: role === 'front' ? occl : [],
        key: (B.tag || 'Main') + ':' + role,
        label: (B.tag ? B.tag + ' · ' : '') + names[role] + ' wall'
      }
    });
  });
}

export function buildWing(M, B, w, planes) {
  const H = B.H,
    t = B.pitch / 12,
    e = B.eave,
    r = B.rake,
    zF = B.cz + B.D / 2,
    a = w.a,
    bx = w.b,
    Pj = w.P,
    Ww = bx - a,
    cxw = (a + bx) / 2,
    zT = zF + Pj;
  const pal = B.pal;
  const walls = [];
  walls.push(
    wallFace(
      M,
      [a, 0, zF],
      [0, 0, 1],
      [
        [0, 0],
        [Pj, 0],
        [Pj, H],
        [0, H]
      ],
      {
        edge: ['attach', 'auto', 'attach', 'attach'],
        name: 'Wing left',
        art: {
          kind: 'wall',
          role: 'wside',
          B,
          occl: [],
          key: `Wing${w.idx}:left`,
          label: `Wing ${w.idx + 1} · left wall`
        }
      }
    )
  );
  if (B.roof === 'gable')
    walls.push(
      wallFace(
        M,
        [a, 0, zT],
        [1, 0, 0],
        [
          [0, 0],
          [Ww, 0],
          [Ww, H],
          [Ww / 2, H + (Ww / 2) * t],
          [0, H]
        ],
        {
          edge: ['attach', 'auto', 'attach', 'attach', 'auto'],
          tag: ['', '', 'top', 'top', ''],
          name: 'Wing front',
          art: {
            kind: 'wall',
            role: 'wfront',
            B,
            occl: [],
            key: `Wing${w.idx}:front`,
            label: `Wing ${w.idx + 1} · front wall`
          }
        }
      )
    );
  else
    walls.push(
      wallFace(
        M,
        [a, 0, zT],
        [1, 0, 0],
        [
          [0, 0],
          [Ww, 0],
          [Ww, H],
          [0, H]
        ],
        {
          edge: ['attach', 'auto', 'attach', 'auto'],
          name: 'Wing front',
          art: {
            kind: 'wall',
            role: 'wfront',
            B,
            occl: [],
            key: `Wing${w.idx}:front`,
            label: `Wing ${w.idx + 1} · front wall`
          }
        }
      )
    );
  walls.push(
    wallFace(
      M,
      [bx, 0, zT],
      [0, 0, -1],
      [
        [0, 0],
        [Pj, 0],
        [Pj, H],
        [0, H]
      ],
      {
        edge: ['attach', 'attach', 'attach', 'auto'],
        name: 'Wing right',
        art: {
          kind: 'wall',
          role: 'wside',
          B,
          occl: [],
          key: `Wing${w.idx}:right`,
          label: `Wing ${w.idx + 1} · right wall`
        }
      }
    )
  );
  // roof
  const zBk = B.cz,
    yr = H + (Ww / 2) * t,
    raw = [];
  if (B.roof === 'gable') {
    const lim0 = B.cx - B.W / 2 - r,
      lim1 = B.cx + B.W / 2 + r;
    const xlo = Math.max(a - e, lim0),
      xhi = Math.min(bx + e, lim1);
    const yl = H - (a - xlo) * t,
      yh = H - (xhi - bx) * t;
    raw.push({
      pts: [
        [xlo, yl, zBk],
        [xlo, yl, zT + r],
        [cxw, yr, zT + r],
        [cxw, yr, zBk]
      ],
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'rake', 'ridge', 'back'],
      name: 'Wing left slope'
    });
    raw.push({
      pts: [
        [xhi, yh, zT + r],
        [xhi, yh, zBk],
        [cxw, yr, zBk],
        [cxw, yr, zT + r]
      ],
      edge: ['free', 'free', 'auto', 'free'],
      tag: ['eave', 'back', 'ridge', 'rake'],
      name: 'Wing right slope'
    });
  } else {
    const ye = H - e * t,
      zr = zT - Ww / 2,
      xlo = a - e,
      xhi = bx + e;
    raw.push({
      pts: [
        [xlo, ye, zBk],
        [xlo, ye, zT + e],
        [cxw, yr, zr],
        [cxw, yr, zBk]
      ],
      edge: ['free', 'auto', 'auto', 'free'],
      tag: ['eave', 'hip', 'ridge', 'back'],
      name: 'Wing left slope'
    });
    raw.push({
      pts: [
        [xhi, ye, zT + e],
        [xhi, ye, zBk],
        [cxw, yr, zBk],
        [cxw, yr, zr]
      ],
      edge: ['free', 'free', 'auto', 'auto'],
      tag: ['eave', 'back', 'ridge', 'hip'],
      name: 'Wing right slope'
    });
    raw.push({
      pts: [
        [xlo, ye, zT + e],
        [xhi, ye, zT + e],
        [cxw, yr, zr]
      ],
      edge: ['free', 'auto', 'auto'],
      tag: ['eave', 'hip', 'hip'],
      name: 'Wing front hip'
    });
  }
  const roof = [];
  raw.forEach(R => {
    const fr = tmpFrame(R.pts);
    const P = R.pts.map(p => loc(fr, p));
    const lab = R.pts.map((_, i) => i);
    const hps = planes.map(pn => [Vdot(pn.n, fr.u), Vdot(pn.n, fr.v), pn.d - Vdot(pn.n, fr.o)]);
    const res = subtractConvex(P, lab, hps);
    if (!res) return;
    const edge = res.lab.map(l => (l === 'valley' ? 'attach' : R.edge[l])),
      tag = res.lab.map(l => (l === 'valley' ? 'valley' : R.tag[l]));
    roof.push(
      mkFace(
        M,
        res.P.map(q => unloc(fr, q)),
        { frame: fr, edge, tag, art: { kind: 'roof', finish: B.roofFinish, pal }, name: R.name }
      )
    );
  });
  return { walls, roof };
}

export function wingsFor(B) {
  const f = effFoot();
  if (!(f === 'L' || f === 'T' || f === 'U')) return [];
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2;
  let Ww = Math.min(S.wingW, B.D - 2, f === 'U' ? B.W * 0.45 : B.W - 2);
  Ww = Math.max(6, Ww);
  const P = S.wingP;
  if (f === 'L') return [{ a: xR - Ww, b: xR, P }];
  if (f === 'T') return [{ a: B.cx - Ww / 2, b: B.cx + Ww / 2, P }];
  return [
    { a: xL, b: xL + Ww, P },
    { a: xR - Ww, b: xR, P }
  ];
}

export function buildUnit(M, B) {
  derive(B);
  const pre = B.tag ? B.tag + ' · ' : '';
  const wings = B.wings || [];
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2;
  const occl = wings.map(w => [w.a - xL, w.b - xL]);
  const wf = rectWalls(M, B, occl);
  M.groups.push({
    title: pre + 'Walls',
    faces: wf,
    pref: 'chain',
    mid: [
      [wf[0], wf[1]],
      [wf[2], wf[3]]
    ]
  });
  const rf = roofFaces(M, B);
  const rmid =
    B.roof === 'saw'
      ? (() => {
          const m = [];
          for (let i = 0; i < rf.ids.length; i += 4) m.push(rf.ids.slice(i, i + 4));
          return m;
        })()
      : undefined;
  M.groups.push({
    title: pre + (rf.deck ? 'Roof deck' : 'Roof'),
    faces: rf.ids,
    pref: rf.pref,
    check: true,
    mid: rmid
  });
  wings.forEach((w, i) => {
    w.idx = i;
    const r = buildWing(M, B, w, rf.planes);
    const n = wings.length > 1 ? ` ${i + 1}` : '';
    M.groups.push({
      title: `Wing${n} walls`,
      faces: r.walls,
      pref: 'chain',
      mid: [[r.walls[0], r.walls[1]], [r.walls[2]]]
    });
    if (r.roof.length) M.groups.push({ title: `Wing${n} roof`, faces: r.roof, pref: 'chain', check: true });
  });
  if (B.type === 'store' && B.awning) {
    if (B.storeStyle === 'modern')
      M.groups.push({ title: pre + 'Canopy', faces: flatCanopy(M, B), pref: 'root', check: true });
    else M.groups.push({ title: pre + 'Awning', faces: awningFaces(M, B), pref: 'root', check: true });
  }
  if (B.type === 'house' && B.chimney && ridgeInfo(B)) {
    if (B.W >= 22) {
      buildChimney(M, B, xL + 3.2, pre + 'Chimney 1');
      buildChimney(M, B, xR - 3.2, pre + 'Chimney 2');
    } else buildChimney(M, B, B.cx + B.W * 0.2, pre + 'Chimney');
  }
  if (B.type === 'office' && !B.tag) penthouse(M, B);
  if (B.type === 'house' && B.tower) {
    const r = 5.5,
      d = r * 0.72 + 0.9,
      left = !wings.some(w => w.a <= xL + 0.1);
    const cx = left ? xL - d : xR + d,
      cz = zF + d;
    const cz2 = wings.some(w => w.a <= xL + 0.1) && wings.some(w => w.b >= xR - 0.1) ? zB - d : cz;
    buildTower(M, {
      cx,
      cz: cz2,
      r,
      n: 8,
      h: B.H + Math.min(B.storyH, 10),
      top: 'cone',
      coneH: r * 2.6,
      pal: B.pal,
      finish: B.finish,
      found: B.found,
      style: B.spooky ? 'spooky' : 'house',
      roofFinish: B.roofFinish,
      name: 'Tower',
      inward: [B.cx, B.cz],
      stories: B.stories + 1,
      storyH: B.storyH
    });
  }
  if (B.type === 'civic') civicExtras(M, B);
  if (B.type === 'castle') {
    const r = Math.max(4.5, Math.min(B.W, B.D) * 0.16),
      d = r * 0.72,
      h = B.H + 8;
    [
      [xL - d, zF + d],
      [xR + d, zF + d],
      [xR + d, zB - d],
      [xL - d, zB - d]
    ].forEach(([cx, cz], i) =>
      buildTower(M, {
        cx,
        cz,
        r,
        n: 8,
        h,
        top: S.towerTop,
        coneH: r * 2.2,
        pal: B.pal,
        finish: B.finish,
        found: B.found,
        style: 'castle',
        roofFinish: 'slate',
        name: `Tower ${i + 1}`,
        inward: [B.cx, B.cz]
      })
    );
  }
  if (B.type === 'barn' && B.silo) {
    const r = 6.5;
    const spal = makePal(Object.assign({}, B.col, { wall: '#bdb7ab', roof: '#8f9597' }));
    buildTower(M, {
      cx: xR + r + 3,
      cz: zB + r + 1,
      r,
      n: 16,
      h: Math.max(30, B.H + 14),
      top: 'cone',
      coneH: 3.8,
      pal: spal,
      finish: 'stave',
      found: 0,
      style: 'silo',
      roofFinish: 'seam',
      name: 'Silo'
    });
  }
  if (B.type === 'house' && B.porch && B.porch !== 'none') {
    const iv = freeIntervals(B.W, occl);
    let best = iv[0];
    iv.forEach(q => {
      if (q[1] - q[0] > best[1] - best[0]) best = q;
    });
    let a = xL + best[0],
      b = xL + best[1];
    if (B.tower && !wings.some(w => w.a <= xL + 0.1)) a = Math.max(a, xL + 1.5);
    if (B.porch === 'center' || B.porch === 'portico') {
      const c = (a + b) / 2,
        hw = B.porch === 'portico' ? Math.min(9, (b - a) / 2) : Math.max(5, Math.min(8, (b - a) * 0.22));
      a = Math.max(a, c - hw);
      b = Math.min(b, c + hw);
    } else {
      a += 0.3;
      b -= 0.3;
    }
    if (b - a > 4) buildPorch(M, B, a, b, B.porch === 'portico');
  }
  if (B.type === 'house' && !B.tag) buildAddons(M, B);
  if (B.type === 'house' && B.dormers && (B.roof === 'gable' || (B.roof === 'hip' && B.W > B.D + 6))) {
    const iv = freeIntervals(B.W, occl)
      .map(([p, q]) => [p + 4, q - 4])
      .filter(([p, q]) => q > p);
    let xs = spread(
      iv.map(([p, q]) => [p - 1, q + 1]),
      1,
      11,
      5
    );
    if (B.roof === 'hip') {
      const h = B.D / 2 + B.eave;
      xs = xs.filter(x => x > h + 3 && x < B.W - h - 3);
    }
    xs.forEach((x, i) => buildDormer(M, B, xL + x, rf.planes, i + 1));
  }
  if ((B.type === 'venue' && !B.tag) || (B.type === 'venue' && B.tag)) {
    if (B.venueKind === 'theater') {
      const mw = Math.min(B.W * 0.7, 26);
      flatCanopyX(M, B, {
        x0: B.cx - mw / 2,
        x1: B.cx + mw / 2,
        p: 7,
        y0: B.found + 9.8,
        th: 4,
        text: B.sign ? 'NOW SHOWING' : '',
        bulbs: true,
        sideText: false,
        name: 'Marquee',
        title: pre + 'Marquee'
      });
      if (B.H > B.found + 16) bladeSign(M, B, B.cx, B.found + 14.5, B.Hf + 3, 3.2, B.sign);
    } else if (B.venueKind === 'casino') {
      const cw = Math.min(B.W * 0.6, 32);
      flatCanopyX(M, B, {
        x0: B.cx - cw / 2,
        x1: B.cx + cw / 2,
        p: 14,
        y0: B.found + Math.min(14, B.H - B.found - 2.5),
        th: 2.2,
        text: '',
        bulbs: true,
        name: 'Porte-cochere',
        title: pre + 'Porte-cochere'
      });
    } else if (B.venueKind === 'bowling') {
      flatCanopyX(M, B, {
        x0: B.cx - B.W * 0.35 - 4,
        x1: B.cx - B.W * 0.35 + 12,
        p: 6,
        y0: B.found + 9,
        th: 1.2,
        name: 'Entry canopy',
        title: pre + 'Entry canopy'
      });
    }
  }
  if (B.type === 'office' && B.officeStyle === 'hotel' && !B.tag)
    flatCanopyX(M, B, {
      x0: B.cx - 12,
      x1: B.cx + 12,
      p: 14,
      y0: B.found + B.G - 3.4,
      th: 1.6,
      text: B.sign,
      name: 'Porte-cochere',
      title: 'Porte-cochere'
    });
  if (B.type === 'road' && B.roadKind === 'motel' && !B.tag)
    pylonSign(M, B.pal, xL - 7, zF + 9, 18, 9, 6, B.sign || 'MOTEL', 'VACANCY');
  if (B.type === 'industrial' && B.indKind === 'factory' && !B.tag)
    buildTower(M, {
      cx: B.cx + B.W / 2 - 4,
      cz: B.cz - B.D / 2 - 3.5,
      r: 2.8,
      n: 12,
      h: B.H + 26,
      top: 'none',
      pal: B.pal,
      finish: 'brick',
      found: 0,
      style: 'stack',
      name: 'Smokestack'
    });
  if (S.base) {
    M.groups.push({ title: pre + 'Base plate', faces: [baseFace(M, B, wings)] });
  }
  M.maxH = Math.max(M.maxH || 0, B.H);
}
