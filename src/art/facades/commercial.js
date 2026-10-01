/* Storefronts, roadside businesses, offices, hotels and motels. */
import { signText } from './venues.js';
import { glassDoor } from '../openings/doors.js';
import { paneBand } from '../openings/effects.js';
import { drawOpening } from '../openings/index.js';
import { poly } from '../../lib/draw.js';
import { rectP, spread } from '../../lib/geometry.js';
import { shade } from '../../lib/math.js';

export function upperWindows(it, B, w, c, floorBase, floors, hood, spacing) {
  for (let s = 0; s < floors; s++) {
    const fl = floorBase + s * B.storyH,
      h = Math.min(5.5, B.storyH - 3.3),
      sill = fl + 2.3;
    spread([[0, w]], 1.6, spacing, 3).forEach(cx => {
      const o = { type: 'win', x: cx - 1.5, y: sill, w: 3, h };
      it.push(...drawOpening(o, c, null));
      if (hood)
        it.push(
          poly(rectP(o.x - 0.5, o.y + o.h + 0.35, o.w + 1, 0.6), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
        );
    });
  }
}

export function storeArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    gT = F + B.G;
  if (A.role === 'front' && B.storeStyle === 'modern') {
    const dc = w / 2,
      top = gT - 2.3;
    it.push(poly(rectP(0, 0, w, top + 0.3), { fill: c.window, stroke: c.windowLine, w: 0.3 }));
    it.push(
      ...paneBand(0.4, dc - 2.2, F + 0.3, top, c, 5),
      ...paneBand(dc + 2.2, w - 0.4, F + 0.3, top, c, 5),
      ...glassDoor(dc - 2, F, 4, top - F, c)
    );
    it.push(...signText(B.sign, 1, w - 1, gT - 0.4, gT + 2.2, c, c.L ? '#222222' : c.accent));
    for (let s = 1; s < B.stories; s++) {
      const fl = gT + (s - 1) * B.storyH;
      it.push(...paneBand(1, w - 1, fl + 3, fl + Math.min(7, B.storyH - 1.5), c, 6));
    }
    it.push(poly(rectP(0, B.Hf - 0.5, w, 0.5), { fill: c.trim, stroke: c.trimLine, w: 0.25 }));
  } else if (A.role === 'front') {
    it.push(
      poly(rectP(0, 0, 1.1, gT), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
      poly(rectP(w - 1.1, 0, 1.1, gT), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
    );
    it.push(
      poly(rectP(1.1, 0, w - 2.2, F + 2), {
        fill: c.L ? '#ffffff' : shade(c.trim, -0.12),
        stroke: c.trimLine,
        w: 0.3
      })
    );
    const dc = w / 2,
      dw = 3.6,
      dy = gT - 3.4;
    const pn = Math.max(1, Math.round((w - 2.2) / 3.6));
    for (let i = 0; i < pn; i++) {
      const px = 1.1 + ((w - 2.2) * i) / pn;
      it.push(
        poly(rectP(px + 0.35, 0.35, (w - 2.2) / pn - 0.7, F + 2 - 0.7), { stroke: c.trimLine, w: 0.25 })
      );
    }
    [
      [1.3, dc - dw / 2 - 0.3],
      [dc + dw / 2 + 0.3, w - 1.3]
    ].forEach(([a, b]) => {
      if (b - a > 1.5) it.push(...paneBand(a, b, F + 2, dy, c, 4.2));
    });
    it.push(
      poly(rectP(dc - dw / 2 - 0.3, 0, dw + 0.6, dy + 0.1), {
        fill: c.L ? '#ffffff' : shade(c.wall, -0.45),
        stroke: c.trimLine,
        w: 0.3
      })
    );
    it.push(...glassDoor(dc - dw / 2, 0, dw, dy, c));
    it.push(...paneBand(1.1, w - 1.1, dy + 0.1, gT - 2.5, c, 1.6));
    it.push(poly(rectP(1.1, gT - 2.4, w - 2.2, 2.1), { fill: c.accent, stroke: c.accentLine, w: 0.35 }));
    it.push(...signText(B.sign, 1.1, w - 1.1, gT - 2.4, gT - 0.3, c));
    upperWindows(it, B, w, c, gT, B.stories - 1, true, 6);
    it.push(poly(rectP(0, B.H - 0.25, w, 1.1), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
    const dn = [];
    for (let x = 0.3; x < w - 0.3; x += 0.7)
      dn.push(poly(rectP(x, B.H - 0.15, 0.35, 0.35), { fill: c.trimLine }));
    it.push(...dn);
  } else if (A.role === 'back') {
    it.push(
      ...drawOpening({ type: 'door', x: w * 0.25 - 1.6, y: F, w: 3.2, h: Math.min(7, B.G - 1.5) }, c, null)
    );
    upperWindows(it, B, w, c, gT, B.stories - 1, false, 8);
  } else if (A.role !== 'party') {
    upperWindows(it, B, w, c, gT, B.stories - 1, false, 10);
  }
  return it;
}

export function roadArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    H = B.H;
  const stripe = (y, h) => poly(rectP(0, y, w, h), { fill: c.accent, stroke: c.accentLine, w: 0.25 });
  if (A.role === 'party') return it;
  const top = Math.min(F + 8.4, H - 1.6);
  if (B.roadKind === 'motel') {
    it.push(stripe(H - 0.8, 0.6));
    if (A.role === 'front' || A.role === 'back') motelFront(it, B, w, c, F, H, A.role);
    else {
      it.push(...drawOpening({ type: 'win', x: w / 2 - 2, y: F + 3.5, w: 4, h: 3.4 }, c, null));
    }
    return it;
  }
  if (B.roadKind === 'carwash') {
    it.push(stripe(H - 0.9, 0.7));
    if (A.role === 'front' || A.role === 'back') {
      const ow = Math.min(13, w - 4),
        oh = Math.min(10.5, H - F - 1.8),
        ox = w / 2 - ow / 2;
      it.push(
        poly(rectP(ox - 0.5, F, ow + 1, oh + 0.5), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        poly(rectP(ox, F, ow, oh), { fill: c.L ? '#ffffff' : '#1e2327', stroke: c.trimLine, w: 0.3 })
      );
      if (!c.L) {
        const cols = [c.accent, '#3aa0d8', '#e8c33a', '#e4e4e4'];
        for (let i = 0; i < 10; i++) {
          const x = ox + 0.6 + (i * (ow - 1.2)) / 10;
          it.push(poly(rectP(x, F + 1.2, 0.55, oh - 2.6), { fill: cols[i % 4] + 'cc' }));
        }
      }
      it.push(
        poly(rectP(ox, F + oh - 1.3, ow, 1.3), { fill: c.accent, stroke: c.accentLine, w: 0.25 }),
        ...signText(
          A.role === 'front' ? 'ENTER' : 'EXIT',
          ox,
          ox + ow,
          F + oh - 1.3,
          F + oh,
          c,
          c.L ? '#222222' : '#ffffff'
        )
      );
      if (A.role === 'front')
        it.push(
          poly(rectP(0, H + 0.3, w, B.Hf - H - 0.7), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
          ...signText(B.sign, 0, w, H + 0.3, B.Hf - 0.4, c, c.L ? '#222222' : '#ffffff')
        );
    } else {
      it.push(...paneBand(2, w - 2, F + 7, Math.min(F + 9.8, H - 1.3), c, 4));
      if (A.side === 'right')
        it.push(...drawOpening({ type: 'door', x: w * 0.12, y: F, w: 3.2, h: 7 }, c, null));
    }
    return it;
  }
  if (B.roadKind === 'diner') {
    it.push(poly(rectP(0, F, w, 2.6), { fill: c.metal, stroke: c.metalLine, w: 0.3 }));
    [0.5, 1.2, 1.9].forEach(y => it.push(poly(rectP(0, F + y, w, 0.22), { fill: c.accent })));
    it.push(stripe(H - 1.1, 0.8));
    if (A.role === 'front') {
      const dx = w * 0.28;
      it.push(
        ...paneBand(0.8, dx - 2.1, F + 2.8, top, c, 3.2),
        ...paneBand(dx + 2.1, w - 0.8, F + 2.8, top, c, 3.2),
        ...glassDoor(dx - 1.7, F, 3.4, Math.min(7.4, top - F), c)
      );
      it.push(
        poly(rectP(0, H + 0.3, w, B.Hf - H - 0.7), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
        ...signText(B.sign, 0, w, H + 0.3, B.Hf - 0.4, c)
      );
    } else if (A.role === 'back') {
      it.push(
        ...drawOpening({ type: 'door', x: w * 0.2, y: F, w: 3.2, h: 7 }, c, null),
        ...drawOpening({ type: 'win', x: w * 0.6, y: F + 4, w: 3, h: 3 }, c, null)
      );
    } else it.push(...paneBand(1, w - 1, F + 2.8, top, c, 3.2));
  } else {
    it.push(stripe(H - 0.9, 0.7));
    if (A.role === 'front') {
      const wo = w * 0.42,
        dx = wo / 2;
      it.push(
        ...paneBand(0.8, dx - 2, F + 2.6, top, c, 3.2),
        ...paneBand(dx + 2, wo - 0.6, F + 2.6, top, c, 3.2),
        ...glassDoor(dx - 1.7, F, 3.4, Math.min(7.2, top - F), c)
      );
      it.push(poly(rectP(wo - 0.4, 0, 0.8, H), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
      const n = B.bays,
        bw = (w - wo - 1) / n;
      for (let i = 0; i < n; i++) {
        const gw = Math.min(10, bw - 2),
          gh = Math.min(10, H - F - 1.8),
          gx = wo + 0.5 + bw * i + (bw - gw) / 2;
        it.push(
          poly(rectP(gx - 0.3, F, gw + 0.6, gh + 0.3), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
          poly(rectP(gx, F, gw, gh), { fill: c.door, stroke: c.doorLine, w: 0.35 })
        );
        const ls = [];
        for (let y = F + gh / 5; y < F + gh - 0.1; y += gh / 5)
          ls.push([
            [gx, y],
            [gx + gw, y]
          ]);
        it.push({ t: 'segs', s: ls, stroke: c.doorLine, w: 0.3 });
        const wy = F + gh * 0.6 + 0.25;
        const np = 4;
        for (let k = 0; k < np; k++)
          it.push(
            poly(rectP(gx + 0.4 + (k * (gw - 0.8)) / np + 0.1, wy, (gw - 0.8) / np - 0.2, gh / 5 - 0.5), {
              fill: c.glass,
              stroke: c.glassLine,
              w: 0.25
            })
          );
      }
      it.push(
        poly(rectP(0, H + 0.3, w, B.Hf - H - 0.7), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
        ...signText(B.sign, 0, w, H + 0.3, B.Hf - 0.4, c)
      );
    } else if (A.role === 'back') {
      it.push(...drawOpening({ type: 'door', x: w * 0.3, y: F, w: 3.2, h: 7 }, c, null));
    } else it.push(...drawOpening({ type: 'win', x: w * 0.5 - 2, y: F + 5.5, w: 4, h: 2.5 }, c, null));
  }
  return it;
}

export function officeArt(f, w, P) {
  const A = f.art,
    B = A.B,
    c = B.pal,
    it = [],
    F = B.found,
    gT = F + B.G;
  if (A.role === 'party') return it;
  const lobbyTop = gT - 3;
  if (A.role === 'front') {
    const dc = w / 2;
    it.push(
      ...paneBand(0.5, dc - 3.3, F + 0.3, lobbyTop, c, 5),
      ...paneBand(dc + 3.3, w - 0.5, F + 0.3, lobbyTop, c, 5),
      poly(rectP(dc - 3.3, F, 6.6, lobbyTop - F + 0.2), { fill: c.window, stroke: c.windowLine, w: 0.3 }),
      ...glassDoor(dc - 3, F, 3, Math.min(8.5, lobbyTop - F - 0.2), c),
      ...glassDoor(dc, F, 3, Math.min(8.5, lobbyTop - F - 0.2), c)
    );
    if (B.officeStyle === 'hotel')
      it.push(poly(rectP(0, lobbyTop + 0.2, w, 2.6), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
    else
      it.push(
        poly(rectP(0.5, lobbyTop + 0.2, w - 1, 2.4), { fill: c.accent, stroke: c.accentLine, w: 0.35 }),
        ...signText(B.sign, 0.5, w - 0.5, lobbyTop + 0.2, lobbyTop + 2.6, c, c.L ? '#222222' : '#ffffff')
      );
  } else if (B.officeStyle === 'glass')
    it.push(
      ...paneBand(0.5, w - 0.5, F + 0.3, lobbyTop, c, 5),
      poly(rectP(0, lobbyTop + 0.2, w, 2.6), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
    );
  if (B.officeStyle === 'hotel') {
    hotelUpper(it, B, w, c, gT);
    it.push(poly(rectP(0, B.H - 0.3, w, 1), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
    if (A.role === 'front')
      it.push(...signText(B.sign, 1, w - 1, B.H + 0.2, B.Hf + 0.2, c, c.L ? '#222222' : c.accent));
    return it;
  }
  for (let s = 1; s < B.stories; s++) {
    const fl = gT + (s - 1) * B.storyH;
    if (B.officeStyle === 'glass') {
      it.push(
        poly(rectP(0, fl, w, 2.6), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        ...paneBand(0, w, fl + 2.6, fl + B.storyH, c, 5)
      );
    } else
      spread([[0, w]], 1.5, 6.5, 4).forEach(x => {
        const o = { type: 'win', x: x - 2, y: fl + 2.8, w: 4, h: Math.min(6, B.storyH - 4) };
        it.push(
          ...drawOpening(o, c, null),
          poly(rectP(o.x - 0.5, o.y + o.h + 0.3, o.w + 1, 0.55), { fill: c.trim, stroke: c.trimLine, w: 0.3 })
        );
      });
  }
  if (B.officeStyle === 'glass')
    it.push(poly(rectP(0, B.H, w, B.Hf - B.H), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
  else it.push(poly(rectP(0, B.H - 0.3, w, 1), { fill: c.trim, stroke: c.trimLine, w: 0.3 }));
  return it;
}

export function hotelUpper(it, B, w, c, gT) {
  for (let s = 1; s < B.stories; s++) {
    const fl = gT + (s - 1) * B.storyH;
    spread([[0, w]], 1.2, 8, 6.4).forEach(x => {
      const o = { type: 'win', x: x - 2.4, y: fl + 2.6, w: 4.8, h: Math.min(5, B.storyH - 4) };
      it.push(
        poly(rectP(o.x - 0.3, o.y - 0.3, o.w + 0.6, o.h + 0.6), { fill: c.trim, stroke: c.trimLine, w: 0.3 }),
        ...paneBand(o.x, o.x + o.w, o.y, o.y + o.h, c, 2.4),
        poly(rectP(o.x + o.w / 2 - 1.2, o.y - 1.6, 2.4, 1), { fill: c.metal, stroke: c.metalLine, w: 0.25 })
      );
      const g = [];
      for (let y = o.y - 1.5; y < o.y - 0.65; y += 0.2)
        g.push([
          [o.x + o.w / 2 - 1.1, y],
          [o.x + o.w / 2 + 1.1, y]
        ]);
      it.push({ t: 'segs', s: g, stroke: c.metalLine, w: 0.2 });
    });
  }
}

export function motelFront(it, B, w, c, F, H, role) {
  const units = Math.max(2, Math.floor((w - 10) / 12));
  const off = role === 'front' ? 10 : 1;
  const uw = (w - off - 1) / units;
  if (role === 'front') {
    it.push(...paneBand(0.8, off - 1, F + 2.8, F + 8, c, 3), ...glassDoor(off / 2 - 1.6, F, 3.2, 7, c));
  }
  for (let s = 0; s < B.stories; s++) {
    const fl = F + s * B.storyH;
    for (let i = 0; i < units; i++) {
      const x = off + uw * i;
      it.push(
        ...drawOpening({ type: 'door', x: x + 1, y: fl, w: 3, h: 6.8 }, c, null),
        ...drawOpening(
          { type: 'win', x: x + uw * 0.45, y: fl + 3, w: Math.min(5, uw * 0.45), h: 3.6 },
          c,
          null
        )
      );
    }
    if (s > 0 && role === 'front') {
      const y = fl;
      it.push(
        poly(rectP(off - 0.5, y - 0.5, w - off + 0.5, 0.7), {
          fill: c.concrete,
          stroke: c.concreteLine,
          w: 0.3
        })
      );
      const bal = [];
      for (let x = off; x < w; x += 0.6)
        bal.push([
          [x, y + 0.2],
          [x, y + 3.2]
        ]);
      it.push(
        { t: 'segs', s: bal, stroke: c.L ? '#222222' : c.accentLine, w: 0.35 },
        poly(rectP(off - 0.5, y + 3.1, w - off + 0.5, 0.25), { fill: c.accent, stroke: c.accentLine, w: 0.2 })
      );
    }
  }
}
