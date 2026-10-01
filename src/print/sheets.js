/* Builds the drawing for each printed sheet: header, parts, labels and scale bar. */
import {
  CUT,
  FOLD,
  HEADER,
  MARGIN,
  MM,
  PAPERS,
  ROOF_NAMES,
  TABFILL,
  WALL_NAMES
} from '../config/constants.js';
import { PRESETS } from '../config/presets/index.js';
import { S } from '../config/state.js';
import { mapItems, pl, poly, txt } from '../lib/draw.js';
import { rectP } from '../lib/geometry.js';
import { effFoot, effRoof } from '../model/building/shell.js';

export function describe() {
  if (S.type === 'scenery') {
    const p = PRESETS.scenery.find(
      q => q.v.scKind === S.scKind && (q.v.streetKind === undefined || q.v.streetKind === S.streetKind)
    );
    return `Scenery  ·  ${p ? p.name : S.scKind}`;
  }
  const t = {
    civic: {
      fire: 'Fire station',
      police: 'Police station',
      church: 'Church',
      library: 'Library',
      post: 'Post office',
      station: 'Rail depot'
    }[S.civKind],
    garden: { greenhouse: 'Greenhouse', doghouse: 'Dog house', coop: 'Chicken coop' }[S.gKind],
    house: 'House',
    store: S.storeStyle === 'modern' ? 'Modern storefront' : 'Main Street storefront',
    road: { gas: 'Gas station', diner: 'Roadside diner', carwash: 'Car wash', motel: 'Motel' }[S.roadKind],
    office: S.officeStyle === 'hotel' ? 'Hotel' : 'Office building',
    barn: 'Barn',
    castle: 'Castle keep',
    venue: {
      theater: 'Movie theatre',
      casino: 'Casino',
      bowling: 'Bowling alley',
      bar: 'Modern bar',
      gym: 'Fitness gym'
    }[S.venueKind],
    industrial: S.indKind === 'factory' ? 'Factory' : 'Self storage'
  }[S.type];
  const f = effFoot();
  const fp = { rect: 'rectangle', L: 'L-shape', T: 'T-shape', U: 'U-shape', row: `row of ${S.units}` }[f];
  const r =
    S.type === 'house' ||
    S.type === 'barn' ||
    S.type === 'industrial' ||
    S.type === 'garden' ||
    (S.type === 'civic' && effRoof() !== 'flat')
      ? ROOF_NAMES[effRoof()] + ' roof'
      : S.type === 'castle'
        ? 'battlements'
        : 'flat roof, parapet';
  return `${t}  ·  ${fp}  ·  ${S.width} x ${S.depth} ft  ·  ${r}  ·  ${WALL_NAMES[S.wallFinish]}`;
}

export function pageItems(page, idx, total, sz, den, orientName) {
  const items = [],
    M_ = MARGIN;
  if (idx === 0) {
    const colR = sz.w - M_ - 2.1;
    items.push(txt('GABLE & CREASE', M_, M_ + 0.16, { size: 11, bold: true, fill: '#1b2320' }));
    items.push(txt(describe(), M_, M_ + 0.33, { size: 7.2, fill: '#333333' }));
    items.push(
      txt(
        `Scale 1:${den}  ·  10 ft = ${(120 / den).toFixed(2)} in (${((120 / den) * 25.4).toFixed(1)} mm)  ·  ${PAPERS[S.paper].name} ${orientName}`,
        M_,
        M_ + 0.46,
        { size: 7, fill: '#333333' }
      )
    );
    items.push(
      txt(
        'Print at Actual size / 100%. Score folds with a blunt stylus, cut solid lines, fold every crease away from the printed side,',
        M_,
        M_ + 0.6,
        { size: 6, fill: '#555555' }
      )
    );
    items.push(
      txt(
        'then glue the grey tabs inside. Build the walls first, add roofs and wings, then details. Set everything on the base plates.',
        M_,
        M_ + 0.7,
        { size: 6, fill: '#555555' }
      )
    );
    const ly = M_ + 0.84;
    items.push(
      pl(
        [
          [M_, ly],
          [M_ + 0.35, ly]
        ],
        CUT
      ),
      txt('Cut', M_ + 0.42, ly + 0.025, { size: 6.5 })
    );
    items.push(
      pl(
        [
          [M_ + 0.8, ly],
          [M_ + 1.15, ly]
        ],
        FOLD
      ),
      txt('Fold (crease away from you)', M_ + 1.22, ly + 0.025, { size: 6.5 })
    );
    items.push(
      poly(rectP(M_ + 2.75, ly - 0.05, 0.3, 0.1), { fill: TABFILL, stroke: '#111111', w: 0.4 }),
      txt('Glue tab', M_ + 3.12, ly + 0.025, { size: 6.5 })
    );
    const x0 = colR + 0.05,
      y0 = M_ + 0.2;
    items.push(
      txt('2 in', x0, y0 - 0.035, { size: 6, bold: true }),
      poly(rectP(x0, y0, 2, 0.08), { stroke: '#111111', w: 0.5 })
    );
    const tk = [];
    for (let i = 0; i <= 8; i++) {
      const x = x0 + i * 0.25;
      tk.push([
        [x, y0],
        [x, y0 + (i % 4 === 0 ? 0.16 : 0.08)]
      ]);
    }
    items.push({ t: 'segs', s: tk, stroke: '#111111', w: 0.5 });
    const y1 = y0 + 0.36,
      mm50 = 50 * MM;
    items.push(
      txt('50 mm', x0, y1 - 0.035, { size: 6, bold: true }),
      poly(rectP(x0, y1, mm50, 0.08), { stroke: '#111111', w: 0.5 })
    );
    const tk2 = [];
    for (let i = 0; i <= 10; i++) {
      const x = x0 + i * 5 * MM;
      tk2.push([
        [x, y1],
        [x, y1 + (i % 2 === 0 ? 0.16 : 0.08)]
      ]);
    }
    items.push({ t: 'segs', s: tk2, stroke: '#111111', w: 0.5 });
    items.push(txt('Measure these bars to confirm the scale.', x0, y1 + 0.3, { size: 5.5, fill: '#555555' }));
    items.push(
      pl(
        [
          [M_, M_ + HEADER - 0.08],
          [sz.w - M_, M_ + HEADER - 0.08]
        ],
        { stroke: '#bbbbbb', w: 0.4 }
      )
    );
  }
  page.place.forEach(({ o, x, y }) => {
    const p = o.p;
    const m = o.rot ? ([px, py]) => [x + (p.h - py), y + px] : ([px, py]) => [x + px, y + py];
    items.push(...mapItems(p.items, m, o.rot ? 90 : 0));
  });
  const fy = sz.h - M_ - 0.04;
  items.push(
    txt(
      `Sheet ${idx + 1} of ${total}  ·  Scale 1:${den}  ·  ${PAPERS[S.paper].name}  ·  Print at Actual size (100%)`,
      M_,
      fy,
      { size: 6, fill: '#666666' }
    )
  );
  const rx = sz.w - M_ - 1;
  items.push(
    poly(rectP(rx, fy - 0.1, 1, 0.06), { stroke: '#666666', w: 0.4 }),
    {
      t: 'segs',
      s: [0, 0.25, 0.5, 0.75, 1].map(i => [
        [rx + i, fy - 0.1],
        [rx + i, fy - 0.02]
      ]),
      stroke: '#666666',
      w: 0.4
    },
    txt('1 in', rx - 0.05, fy - 0.035, { size: 5.5, anchor: 'end', fill: '#666666' })
  );
  return items;
}
