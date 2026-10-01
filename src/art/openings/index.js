/* Places and draws windows and doors. drawOpening is the single entry point for any opening. */
import { drawDoor, planks, stoop, strap } from './doors.js';
import { boardsOver, fxFor, glassCells, paneFx } from './effects.js';
import { SQUARE_SHAPES, muntins, shapeP } from './windows.js';
import { poly } from '../../lib/draw.js';
import {
  barP,
  bbox,
  circ,
  clipConvexSafe,
  freeIntervals,
  inPoly,
  rectP,
  spread
} from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';
import { addonSpans } from '../../model/features/addons.js';

export function fitsInside(o, P, m) {
  const pts = [
    [o.x - m, o.y - 0.45],
    [o.x + o.w + m, o.y - 0.45],
    [o.x + o.w + m, o.y + o.h + 0.35],
    [o.x - m, o.y + o.h + 0.35]
  ];
  return pts.every(p => inPoly(p, P));
}

export function houseOpenings(f) {
  const A = f.art,
    B = A.B,
    P = f.l2,
    bb = bbox(P),
    w = bb.x1;
  const out = [];
  if (A.role === 'party') return out;
  const iv = freeIntervals(w, A.occl);
  const spacing = A.role === 'front' || A.role === 'wfront' ? 7.2 : 8.5;
  const sp = B.type === 'house' && !B.tag && B.wings ? addonSpans(B) : {},
    dk = sp.deck && A.role === 'back' ? sp.deck : null,
    bc = sp.balc && sp.balc.side === A.role ? sp.balc : null;
  for (let s = 0; s < B.stories; s++) {
    const fl = B.found + s * B.storyH,
      sill = fl + Math.min(2.6, B.storyH * 0.3),
      wh = Math.min(s === 0 ? 4.6 : 4.2, B.storyH - (sill - fl) - 1.3);
    let ivS = iv;
    const ad =
      s === 0 && dk
        ? { type: 'sliding', doorStyle: 'two', w: 6, src: dk }
        : s === 1 && bc
          ? { type: 'double', doorStyle: 'french', w: 5.2, src: bc }
          : null;
    if (ad) {
      const dc = (ad.src.lx[0] + ad.src.lx[1]) / 2;
      out.push({
        type: ad.type,
        doorStyle: ad.doorStyle,
        x: dc - ad.w / 2,
        y: fl,
        w: ad.w,
        h: Math.min(ad.type === 'sliding' ? 6.8 : 7, B.storyH - 1.3)
      });
      ivS = freeIntervals(w, [...(A.occl || []), [dc - ad.w / 2 - 1.4, dc + ad.w / 2 + 1.4]]);
    }
    if (A.role === 'front' && s === 0) {
      let best = iv[0];
      iv.forEach(x => {
        if (x[1] - x[0] > best[1] - best[0]) best = x;
      });
      const dc = (best[0] + best[1]) / 2;
      out.push({ type: 'door', x: dc - 1.6, y: fl, w: 3.2, h: Math.min(7, B.storyH - 1.2) });
      spread(freeIntervals(w, [...(A.occl || []), [dc - 3.3, dc + 3.3]]), 1.2, 7.2, 3).forEach(cx =>
        out.push({ type: 'win', x: cx - 1.5, y: sill, w: 3, h: wh })
      );
    } else if (A.role === 'wfront' && s === 0 && B.garage) {
      const gw = Math.min(16, w - 3);
      out.push({ type: 'garage', x: w / 2 - gw / 2, y: B.found, w: gw, h: Math.min(7.5, B.storyH - 1) });
    } else
      spread(ivS, 1.3, spacing, 3).forEach(cx =>
        out.push({ type: 'win', x: cx - 1.5, y: sill, w: 3, h: wh })
      );
  }
  const gh = bb.y1 - B.H;
  if (gh > 3.4 && B.roof !== 'shed') {
    if (B.roof === 'gambrel' && gh > 7) {
      [w * 0.32, w * 0.68].forEach(cx =>
        out.push({ type: 'win', x: cx - 1.2, y: B.H + 1.4, w: 2.4, h: Math.min(3.6, gh * 0.35), attic: true })
      );
    } else {
      let pk = P[0];
      P.forEach(p => {
        if (p[1] > pk[1]) pk = p;
      });
      out.push({
        type: 'win',
        x: pk[0] - 1,
        y: B.H + gh * 0.16,
        w: 2,
        h: Math.min(2.6, gh * 0.42),
        attic: true
      });
    }
  }
  if (B.winStyle !== 'rect')
    out.forEach(o => {
      if (o.type === 'win' && !o.attic) o.h = Math.min(o.h + 0.8, B.storyH - 2.6);
    });
  return out.filter(o =>
    fitsInside(o, P, o.type === 'win' && B.shutters && !o.attic ? o.w * 0.5 + 0.5 : 0.4)
  );
}

export function drawOpening(o, c, B) {
  const it = [],
    t = 0.3,
    st = (B && B.winStyle) || 'rect';
  if (o.type === 'win' || o.type === 'round') {
    const ws = o.type === 'round' ? 'round' : o.attic && st === 'rect' ? 'rect' : st,
      pn = o.panes || (ws === 'half' ? 'radial' : 'cross');
    const shut = o.shut === 'on' ? true : o.shut === 'off' ? false : !!(B && B.shutters);
    if (shut && !o.attic && SQUARE_SHAPES[ws]) {
      const sw = o.w * 0.48;
      [o.x - t - sw - 0.08, o.x + o.w + t + 0.08].forEach(x => {
        it.push(
          poly(rectP(x, o.y - 0.05, sw, o.h + 0.1), { fill: c.shutter, stroke: c.shutterLine, w: 0.3 })
        );
        const ls = [];
        for (let y = o.y + 0.25; y < o.y + o.h - 0.1; y += 0.25)
          ls.push([
            [x + 0.08, y],
            [x + sw - 0.08, y]
          ]);
        it.push({ t: 'segs', s: ls, stroke: c.shutterLine, w: 0.2 });
      });
    }
    it.push(
      poly(shapeP(ws, o.x - t, o.y - t, o.w + 2 * t, o.h + 2 * t), {
        fill: c.trim,
        stroke: c.trimLine,
        w: 0.35
      })
    );
    it.push(poly(shapeP(ws, o.x, o.y, o.w, o.h), { fill: c.window, stroke: c.windowLine, w: 0.3 }));
    const fx = fxFor(o.x, o.y, o.w, o.fx),
      g = 0.16,
      gp = shapeP(ws, o.x + g, o.y + g, o.w - 2 * g, o.h - 2 * g);
    paneFx(gp, c, fx, o.x * 1.3 + o.y, it, false);
    it.push(...muntins(ws, pn, gp, c));
    if (!o.attic && SQUARE_SHAPES[ws])
      it.push(
        poly(rectP(o.x - t - 0.18, o.y - t - 0.2, o.w + 2 * t + 0.36, 0.22), {
          fill: c.trim,
          stroke: c.trimLine,
          w: 0.3
        })
      );
    if (!c.L && !fx && (ws === 'rect' || ws === 'segment'))
      it.push(
        poly(
          [
            [o.x + 0.25, o.y + o.h - 0.25],
            [o.x + o.w * 0.34, o.y + o.h - 0.25],
            [o.x + 0.25, o.y + o.h * 0.66]
          ],
          { fill: '#ffffff22' }
        )
      );
    if (fx && fx.board) {
      const bb = bbox(gp);
      it.push(...boardsOver(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0, c));
    }
  } else if (o.type === 'double') {
    const ds = o.doorStyle || 'glass',
      fx = fxFor(0, 0, 0, o.fx);
    it.push(poly(rectP(o.x - t, o.y, o.w + 2 * t, o.h + t), { fill: c.trim, stroke: c.trimLine, w: 0.35 }));
    const hw = o.w / 2,
      cells = [];
    [o.x, o.x + hw].forEach(x => {
      it.push(poly(rectP(x, o.y, hw, o.h), { fill: c.door, stroke: c.doorLine, w: 0.35 }));
      if (ds === 'panel') {
        it.push(
          poly(rectP(x + 0.3, o.y + o.h * 0.52, hw - 0.6, o.h * 0.4), { stroke: c.doorLine, w: 0.3 }),
          poly(rectP(x + 0.3, o.y + 0.35, hw - 0.6, o.h * 0.4), { stroke: c.doorLine, w: 0.3 })
        );
      } else if (ds === 'french') {
        cells.push(rectP(x + 0.3, o.y + 0.45, hw - 0.6, o.h - 0.8));
      } else {
        cells.push(rectP(x + 0.3, o.y + o.h * 0.35, hw - 0.6, o.h * 0.55));
        it.push(poly(rectP(x + 0.3, o.y + 0.3, hw - 0.6, o.h * 0.25), { stroke: c.doorLine, w: 0.3 }));
      }
    });
    if (cells.length) {
      const fxs = glassCells(cells, c, o.fx || {}, it, true);
      if (ds === 'french') cells.forEach(gp => it.push(...muntins('rect', 'grid', gp, c)));
    }
    it.push(
      poly(circ(o.x + hw - 0.2, o.y + o.h * 0.47, 0.1), { fill: c.L ? '#ffffff' : '#c9a646' }),
      poly(circ(o.x + hw + 0.2, o.y + o.h * 0.47, 0.1), { fill: c.L ? '#ffffff' : '#c9a646' })
    );
    if (fx && fx.board) it.push(...boardsOver(o.x, o.y, o.w, o.h, c));
    stoop(it, o, c, t);
  } else if (o.type === 'sliding') {
    const ss = o.doorStyle || 'two',
      n = ss === 'three' ? 3 : 2,
      pw = o.w / n,
      cells = [];
    it.push(
      poly(rectP(o.x - t, o.y, o.w + 2 * t, o.h + t), { fill: c.trim, stroke: c.trimLine, w: 0.35 }),
      poly(rectP(o.x, o.y, o.w, o.h), { fill: c.window, stroke: c.windowLine, w: 0.35 })
    );
    for (let i = 0; i < n; i++) {
      const px = o.x + i * pw;
      it.push(poly(rectP(px + 0.04, o.y + 0.04, pw - 0.08, o.h - 0.08), { stroke: c.windowLine, w: 0.3 }));
      cells.push(rectP(px + 0.22, o.y + 0.34, pw - 0.44, o.h - 0.56));
    }
    const fxs = glassCells(cells, c, o.fx, it, true);
    if (ss === 'grid') cells.forEach(gp => it.push(...muntins('rect', 'grid', gp, c)));
    it.push(
      poly(rectP(o.x + pw - 0.4, o.y + o.h * 0.4, 0.1, o.h * 0.16), {
        fill: c.L ? '#ffffff' : '#c9c9c9',
        stroke: c.windowLine,
        w: 0.2
      })
    );
    const ov = fxFor(0, 0, 0, o.fx);
    if (ov && ov.board) it.push(...boardsOver(o.x, o.y, o.w, o.h, c));
    else
      cells.forEach((gp, i) => {
        if (fxs[i] && fxs[i].board) {
          const b = bbox(gp);
          it.push(...boardsOver(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, c));
        }
      });
    stoop(it, o, c, t);
  } else if (o.type === 'garage') {
    const gs = o.gstyle || 'panel',
      { x, y, w, h } = o,
      rows = gs === 'carriage' ? 3 : 4,
      rh = h / rows,
      cells = [];
    it.push(
      poly(rectP(x - t, y, w + 2 * t, h + t), { fill: c.trim, stroke: c.trimLine, w: 0.35 }),
      poly(rectP(x, y, w, h), { fill: gs === 'glass' ? c.window : c.door, stroke: c.doorLine, w: 0.35 })
    );
    const cols = Math.max(2, Math.round(w / 2.2)),
      pw = w / cols,
      top = rows - 1,
      winRow = !!o.gwin;
    if (gs === 'panel') {
      const ls = [];
      for (let k = 1; k < rows; k++)
        ls.push([
          [x, y + rh * k],
          [x + w, y + rh * k]
        ]);
      for (let r = 0; r < rows; r++)
        for (let k = 0; k < cols; k++) {
          const q = rectP(x + k * pw + 0.2, y + r * rh + 0.2, pw - 0.4, rh - 0.4);
          if (winRow && r === top) cells.push(q);
          else it.push(poly(q, { stroke: c.doorLine, w: 0.2 }));
        }
      it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.3 });
    } else if (gs === 'flush') {
      const ls = [];
      for (let k = 1; k < rows; k++)
        ls.push([
          [x, y + rh * k],
          [x + w, y + rh * k]
        ]);
      it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.3 });
      if (winRow) {
        const n2 = Math.max(2, Math.round(w / 3));
        for (let k = 0; k < n2; k++)
          cells.push(rectP(x + (k * w) / n2 + 0.25, y + top * rh + rh * 0.3, w / n2 - 0.5, rh * 0.4));
      }
    } else if (gs === 'rollup') {
      const ls = [];
      for (let yy = y + 0.3; yy < y + h - 0.05; yy += 0.3)
        ls.push([
          [x, yy],
          [x + w, yy]
        ]);
      it.push(
        { t: 'segs', s: ls, stroke: c.doorLine, w: 0.2 },
        poly(rectP(x, y, w, 0.3), {
          fill: c.L ? '#ffffff' : shade(c.door, -0.2),
          stroke: c.doorLine,
          w: 0.25
        }),
        poly(rectP(x - t - 0.15, y + h, w + 2 * t + 0.3, 0.55), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
      );
      if (winRow) {
        const n2 = Math.max(3, Math.round(w / 1.6));
        for (let k = 0; k < n2; k++)
          cells.push(rectP(x + (k * w) / n2 + 0.3, y + h * 0.6, w / n2 - 0.6, 0.65));
      }
    } else if (gs === 'glass') {
      for (let r = 0; r < rows; r++)
        for (let k = 0; k < cols; k++)
          cells.push(rectP(x + k * pw + 0.14, y + r * rh + 0.14, pw - 0.28, rh - 0.28));
    } else {
      /* carriage */ const hw = w / 2,
        b = 0.35,
        f = { fill: c.L ? '#ffffff' : shade(c.door, -0.12), stroke: c.doorLine, w: 0.25 };
      [x, x + hw].forEach((lx, side) => {
        const bodyTop = winRow ? y + h * 0.64 : y + h - b;
        planks(it, rectP(lx, y, hw, h), lx, lx + hw, y, y + h, c, 0.5);
        it.push(
          poly(rectP(lx, y, hw, b), f),
          poly(rectP(lx, y + h - b, hw, b), f),
          poly(rectP(lx, y, b, h), f),
          poly(rectP(lx + hw - b, y, b, h), f)
        );
        if (winRow) {
          it.push(poly(rectP(lx, bodyTop, hw, b), f));
          const n2 = 3,
            cw = (hw - 2 * b) / n2;
          for (let k = 0; k < n2; k++)
            cells.push(
              rectP(lx + b + k * cw + 0.12, bodyTop + b + 0.12, cw - 0.24, y + h - b - bodyTop - b - 0.24)
            );
        }
        const a = y + b,
          z = bodyTop;
        it.push(
          poly(clipConvexSafe(barP([lx + b, a], [lx + hw - b, z], b), rectP(lx + b, a, hw - 2 * b, z - a)), f)
        );
        const ex = side ? lx + hw - 0.1 : lx + 0.1,
          ix = side ? lx + hw - hw * 0.45 : lx + hw * 0.45;
        [y + h * 0.2, y + h * 0.52].forEach(sy => strap(it, Math.min(ex, ix), Math.max(ex, ix), sy, c));
        it.push(
          poly(rectP(side ? lx + 0.35 : lx + hw - 0.45, y + h * 0.42, 0.1, 0.6), {
            fill: c.L ? '#ffffff' : '#2a2a2a',
            stroke: c.L ? '#222222' : null,
            w: 0.2
          })
        );
      });
    }
    if (cells.length) {
      const fxs = glassCells(cells, c, o.fx, it, true);
      if (gs === 'carriage' && winRow) cells.forEach(gp => it.push(...muntins('rect', 'dh', gp, c)));
      const ov = fxFor(0, 0, 0, o.fx);
      if (!ov)
        cells.forEach((gp, i) => {
          if (fxs[i] && fxs[i].board) {
            const b = bbox(gp);
            it.push(...boardsOver(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, c));
          }
        });
    }
    const ov = fxFor(0, 0, 0, o.fx);
    if (ov && ov.board) it.push(...boardsOver(x, y, w, h, c));
  } else {
    drawDoor(o, c, fxFor(0, 0, 0, o.fx), it);
    const fx = fxFor(0, 0, 0, o.fx);
    if (fx && fx.board) it.push(...boardsOver(o.x, o.y, o.w, o.h, c));
  }
  return it.filter(i => i.t !== 'poly' || i.p.length >= 3);
}
