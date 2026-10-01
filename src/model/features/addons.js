/* Decks and balconies. They are built against the front wall, then mapped onto the real wall, and print on their own sheets. */
import { freeIntervals } from '../../lib/geometry.js';
import { clamp } from '../../lib/math.js';
import { mkFace } from '../faces.js';

/* decks and balconies: built in a "front frame" (wall at z0, outward +z) then mapped to the real wall */
export const ADDON_SHEET = 'Deck & balcony';

export function addonSpans(B) {
  const xL = B.cx - B.W / 2,
    xR = B.cx + B.W / 2,
    out = {};
  if (B.deck === 'rear') {
    const w = clamp(B.deckW, 6, B.W - 1);
    out.deck = { side: 'back', a: B.cx - w / 2, b: B.cx + w / 2, P: clamp(B.deckD, 4, 24) };
  }
  if (B.balcony && B.balcony !== 'none' && B.stories > 1) {
    const w = clamp(B.balcW, 5, B.W - 2);
    let c = B.cx;
    if (B.balcony === 'front') {
      const iv = freeIntervals(
        B.W,
        (B.wings || []).map(q => [q.a - xL, q.b - xL])
      );
      let best = iv[0];
      iv.forEach(q => {
        if (q[1] - q[0] > best[1] - best[0]) best = q;
      });
      c = xL + (best[0] + best[1]) / 2;
      const half = Math.min(w / 2, (best[1] - best[0]) / 2 - 0.5);
      if (half >= 2.5) out.balc = { side: 'front', a: c - half, b: c + half, P: 4 };
    } else out.balc = { side: 'back', a: c - w / 2, b: c + w / 2, P: 4 };
  }
  /* local x (along the wall face, from its left edge) of each span, for automatic door placement */
  Object.values(out).forEach(s => {
    s.lx = s.side === 'front' ? [s.a - xL, s.b - xL] : [xR - s.b, xR - s.a];
  });
  return out;
}

export function frameMap(B, side) {
  const zF = B.cz + B.D / 2,
    zB = B.cz - B.D / 2;
  return side === 'front' ? p => [p[0], p[1], zF + p[2]] : p => [2 * B.cx - p[0], p[1], zB - p[2]];
}

export function railStrip(M, B, T, x0, x1, P, y, gap, name) {
  const rh = 3,
    pal = B.pal,
    art = { kind: 'deckRail', pal },
    q = pts => pts.map(T),
    yt = y + rh,
    groups = [];
  const L = mkFace(
    M,
    q([
      [x0, y, 0],
      [x0, y, P],
      [x0, yt, P],
      [x0, yt, 0]
    ]),
    { edge: ['attach', 'auto', 'free', 'attach'], art, name: name + ' rail side' }
  );
  const R = mkFace(
    M,
    q([
      [x1, y, P],
      [x1, y, 0],
      [x1, yt, 0],
      [x1, yt, P]
    ]),
    { edge: ['attach', 'attach', 'free', 'auto'], art, name: name + ' rail side' }
  );
  if (gap) {
    const [g0, g1] = gap;
    const FL = mkFace(
      M,
      q([
        [x0, y, P],
        [g0, y, P],
        [g0, yt, P],
        [x0, yt, P]
      ]),
      { edge: ['attach', 'free', 'free', 'auto'], art, name: name + ' rail front' }
    );
    const FR = mkFace(
      M,
      q([
        [g1, y, P],
        [x1, y, P],
        [x1, yt, P],
        [g1, yt, P]
      ]),
      { edge: ['attach', 'auto', 'free', 'free'], art, name: name + ' rail front' }
    );
    groups.push(
      { title: name + ' railing, left', faces: [L, FL], pref: 'chain', sheet: ADDON_SHEET },
      { title: name + ' railing, right', faces: [FR, R], pref: 'chain', sheet: ADDON_SHEET }
    );
  } else {
    const F = mkFace(
      M,
      q([
        [x0, y, P],
        [x1, y, P],
        [x1, yt, P],
        [x0, yt, P]
      ]),
      { edge: ['attach', 'auto', 'free', 'auto'], art, name: name + ' rail front' }
    );
    groups.push({
      title: name + ' railing',
      faces: [L, F, R],
      pref: 'chain',
      sheet: ADDON_SHEET,
      mid: [[L, F], [R]]
    });
  }
  groups.forEach(g => M.groups.push(g));
}

export function buildStairs(M, B, T, xa, xb, P, fh) {
  const n = Math.max(2, Math.round(fh / 0.65)),
    r = fh / n,
    run = 0.9,
    pal = B.pal,
    q = pts => pts.map(T),
    strip = [];
  const tread = { kind: 'porchDeck', pal },
    riser = { kind: 'trimPlain', pal };
  for (let k = 1; k < n; k++) {
    const Z = P + (n - k) * run;
    strip.push(
      mkFace(
        M,
        q([
          [xa, (k - 1) * r, Z],
          [xb, (k - 1) * r, Z],
          [xb, k * r, Z],
          [xa, k * r, Z]
        ]),
        { edge: [k === 1 ? 'free' : 'auto', 'auto', 'auto', 'auto'], art: riser, name: 'Stair riser' }
      )
    );
    strip.push(
      mkFace(
        M,
        q([
          [xa, k * r, Z],
          [xb, k * r, Z],
          [xb, k * r, Z - run],
          [xa, k * r, Z - run]
        ]),
        { edge: ['auto', 'auto', k === n - 1 ? 'attach' : 'auto', 'auto'], art: tread, name: 'Stair tread' }
      )
    );
  }
  const prof = [
    [P, 0],
    [P + (n - 1) * run, 0]
  ];
  for (let k = 1; k < n; k++) {
    prof.push([P + (n - k) * run, k * r], [P + (n - k - 1) * run, k * r]);
  }
  const ne = prof.length,
    se = prof.map((_, i) => (i === 0 ? 'free' : i === ne - 1 ? 'attach' : 'auto'));
  const SL = mkFace(M, q(prof.map(([z, y]) => [xa, y, z])), { edge: se, art: riser, name: 'Stair side' });
  const rp = prof.slice().reverse(),
    re = rp.map((_, i) => {
      const j = (ne - 2 - i + ne) % ne;
      return se[j];
    });
  const SR = mkFace(M, q(rp.map(([z, y]) => [xb, y, z])), { edge: re, art: riser, name: 'Stair side' });
  M.groups.push({
    title: 'Deck stairs',
    faces: [...strip, SL, SR],
    pref: 'chain',
    check: true,
    sheet: ADDON_SHEET,
    mid: [strip, [SL], [SR]]
  });
}

export function buildDeck(M, B, s) {
  const T = frameMap(B, s.side),
    q = pts => pts.map(T),
    pal = B.pal,
    fh = Math.max(0.6, B.found),
    x0 = s.a,
    x1 = s.b,
    P = s.P;
  const fa = { kind: 'porchDeck', pal },
    sa = { kind: 'porchSkirt', pal };
  const top = mkFace(
    M,
    q([
      [x0, fh, P],
      [x1, fh, P],
      [x1, fh, 0],
      [x0, fh, 0]
    ]),
    { edge: ['auto', 'auto', 'attach', 'auto'], art: fa, name: 'Deck floor' }
  );
  const fr = mkFace(
    M,
    q([
      [x0, 0, P],
      [x1, 0, P],
      [x1, fh, P],
      [x0, fh, P]
    ]),
    { edge: ['attach', 'auto', 'auto', 'auto'], art: sa, name: 'Deck front skirt' }
  );
  const rs = mkFace(
    M,
    q([
      [x1, 0, P],
      [x1, 0, 0],
      [x1, fh, 0],
      [x1, fh, P]
    ]),
    { edge: ['attach', 'attach', 'auto', 'auto'], art: sa, name: 'Deck side skirt' }
  );
  const ls = mkFace(
    M,
    q([
      [x0, 0, 0],
      [x0, 0, P],
      [x0, fh, P],
      [x0, fh, 0]
    ]),
    { edge: ['attach', 'auto', 'auto', 'attach'], art: sa, name: 'Deck side skirt' }
  );
  M.groups.push({
    title: 'Deck',
    faces: [top, fr, rs, ls],
    pref: 'root',
    check: true,
    sheet: ADDON_SHEET,
    mid: [[top, fr], [rs], [ls]]
  });
  const stairs = fh >= 0.9 && x1 - x0 >= 8,
    sw = Math.min(4, x1 - x0 - 3),
    gc = (x0 + x1) / 2;
  railStrip(M, B, T, x0, x1, P, fh, stairs ? [gc - sw / 2, gc + sw / 2] : null, 'Deck');
  if (stairs) buildStairs(M, B, T, gc - sw / 2, gc + sw / 2, P, fh);
}

export function buildBalcony(M, B, s) {
  const T = frameMap(B, s.side),
    q = pts => pts.map(T),
    pal = B.pal,
    x0 = s.a,
    x1 = s.b,
    P = s.P,
    yb = B.found + B.storyH,
    th = 0.8,
    y0 = yb - th;
  const fa = { kind: 'porchDeck', pal },
    sa = { kind: 'trimPlain', pal },
    e4 = ['auto', 'auto', 'auto', 'auto'];
  const top = mkFace(
    M,
    q([
      [x0, yb, P],
      [x1, yb, P],
      [x1, yb, 0],
      [x0, yb, 0]
    ]),
    { edge: ['auto', 'auto', 'attach', 'auto'], art: fa, name: 'Balcony floor' }
  );
  const fr = mkFace(
    M,
    q([
      [x0, y0, P],
      [x1, y0, P],
      [x1, yb, P],
      [x0, yb, P]
    ]),
    { edge: e4, art: sa, name: 'Balcony edge' }
  );
  const rs = mkFace(
    M,
    q([
      [x1, y0, P],
      [x1, y0, 0],
      [x1, yb, 0],
      [x1, yb, P]
    ]),
    { edge: ['auto', 'attach', 'auto', 'auto'], art: sa, name: 'Balcony edge' }
  );
  const ls = mkFace(
    M,
    q([
      [x0, y0, 0],
      [x0, y0, P],
      [x0, yb, P],
      [x0, yb, 0]
    ]),
    { edge: ['auto', 'auto', 'auto', 'attach'], art: sa, name: 'Balcony edge' }
  );
  const bt = mkFace(
    M,
    q([
      [x0, y0, 0],
      [x1, y0, 0],
      [x1, y0, P],
      [x0, y0, P]
    ]),
    { edge: ['attach', 'auto', 'auto', 'auto'], art: sa, name: 'Balcony underside' }
  );
  M.groups.push({
    title: 'Balcony',
    faces: [top, fr, bt, rs, ls],
    pref: 'root',
    check: true,
    sheet: ADDON_SHEET,
    mid: [[top, fr, bt], [rs], [ls]]
  });
  railStrip(M, B, T, x0, x1, P, yb, null, 'Balcony');
  const L = Math.min(P * 0.8, B.storyH * 0.45),
    ids = [];
  [x0 + 0.7, x1 - 0.7].forEach(bx =>
    ids.push(
      mkFace(
        M,
        q([
          [bx, y0 - L, 0],
          [bx, y0, P * 0.85],
          [bx, y0, 0]
        ]),
        { edge: ['free', 'attach', 'attach'], art: sa, name: 'Bracket' }
      )
    )
  );
  ids.forEach((f, i) => M.groups.push({ title: `Balcony bracket ${i + 1}`, faces: [f], sheet: ADDON_SHEET }));
}

export function buildAddons(M, B) {
  const sp = addonSpans(B);
  if (sp.deck) buildDeck(M, B, sp.deck);
  if (sp.balc) buildBalcony(M, B, sp.balc);
}
