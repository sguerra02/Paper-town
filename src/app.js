/* The main update loop: settings → model → pieces → sheets → previews. */
import { PAPERS, ROOF_NAMES } from './config/constants.js';
import { S } from './config/state.js';
import { $, esc } from './lib/dom.js';
import { svgItems } from './lib/draw.js';
import { f3 } from './lib/math.js';
import { effFoot, effRoof } from './model/building/shell.js';
import { buildModel } from './model/index.js';
import { areaFor, pack, paperSize, resolveDen } from './print/layout.js';
import { pageItems } from './print/sheets.js';
import { splitPiece } from './print/split.js';
import { buildPieces, fits } from './print/unfold.js';
import { refreshEditor } from './ui/editor.js';
import { schedule3D } from './ui/preview3d.js';

export let current = null,
  MODEL = null;

export function compute() {
  const M = buildModel();
  MODEL = M;
  const den = resolveDen(M);
  const orients = S.orient === 'auto' ? ['portrait', 'landscape'] : [S.orient];
  let best = null;
  orients.forEach(or => {
    const sz = paperSize(or),
      area = areaFor(sz);
    const raw = buildPieces(M, den, area, true);
    const split = [];
    const pieces = [];
    raw.forEach(p => {
      if (fits(p, area)) pieces.push(p);
      else {
        const parts = splitPiece(p, area);
        parts.forEach(q => (q.sheet = p.sheet));
        split.push(`${p.id} → ${parts.length} sections`);
        pieces.push(...parts);
      }
    });
    const pages = pack(pieces, sz);
    if (!best || pages.length < best.pages.length) best = { or, sz, area, pieces, pages, split };
  });
  const warns = [];
  if (best.split.length)
    warns.push(
      `Some parts are too big for one ${PAPERS[S.paper].name} sheet at 1:${den}, so they print in sections: ${best.split.join(', ')}. Cut each section on its solid lines, then glue its grey strip under the neighboring section with the edge on the dotted line.`
    );
  best.pages.forEach(pg =>
    pg.place.forEach(pp => {
      if (pp.o.over)
        warns.push(
          `Part ${pp.o.p.id} (${pp.o.p.title}) is larger than the printable area of ${PAPERS[S.paper].name} at 1:${den}. Choose a larger paper or a smaller scale. `
        );
    })
  );
  if (S.type === 'house' && S.balcony !== 'none' && Math.round(S.stories) < 2)
    warns.push('A balcony needs at least 2 stories, so it is left off. ');
  if (S.type === 'house' && S.balcony === 'front' && S.porch !== 'none')
    warns.push(
      'The front balcony sits where the porch roof meets the wall. Choose a rear balcony or no porch for a clean fit. '
    );
  const k = 12 / den;
  if (k * S.storyH < 0.35)
    warns.push(
      'At this scale the walls are very small. Use thin paper and a fresh blade for window details.'
    );
  const f = effFoot();
  if ((f === 'L' || f === 'T' || f === 'U') && S.wingW > S.depth - 2)
    warns.push(`Wing width is limited to ${S.depth - 2} ft so the wing roof stays below the main ridge.`);
  if (S.type === 'house' && effRoof() !== S.roof)
    warns.push(
      `${ROOF_NAMES[S.roof]} roofs work on rectangle and row footprints. This ${f}-shape uses a gable roof.`
    );
  return Object.assign(best, { den, warns, k, M });
}

export function render() {
  current = compute();
  const c = current;
  c.pagesItems = c.pages.map((pg, i) => pageItems(pg, i, c.pages.length, c.sz, c.den, c.or));
  $('#sheets').innerHTML = c.pagesItems
    .map(
      (items, i) =>
        `<figure class="sheet" style="margin:0"><svg viewBox="0 0 ${f3(c.sz.w)} ${f3(c.sz.h)}" role="img" aria-label="Print sheet ${i + 1}">${svgItems(items, 1 / 72)}</svg><figcaption>Sheet ${i + 1} · ${PAPERS[S.paper].name} ${c.or}</figcaption></figure>`
    )
    .join('');
  const b = c.M.bounds,
    inch = v => v.toFixed(2),
    mm = v => Math.round(v * 25.4);
  const fw = (b.x1 - b.x0) * c.k,
    fd = (b.z1 - b.z0) * c.k,
    fh = b.y1 * c.k;
  $('#summary').innerHTML = `
    <div><b>Scale</b><span>1:${c.den}</span>${S.scale === 'fit' ? '<small>fit to paper</small>' : ''}</div>
    <div><b>Footprint</b><span>${inch(fw)} × ${inch(fd)} in</span><small>${mm(fw)} × ${mm(fd)} mm</small></div>
    <div><b>Height</b><span>${inch(fh)} in</span><small>${mm(fh)} mm</small></div>
    <div><b>Sheets</b><span>${c.pages.length} × ${PAPERS[S.paper].name}</span><small>${c.or}</small></div>
    <div><b>Parts</b><span>${c.pieces.length}</span><small>${c.pieces.map(p => p.id).join(' ')}</small></div>`;
  $('#warns').innerHTML = c.warns.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  schedule3D();
  refreshEditor();
}
