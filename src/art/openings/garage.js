/* Working garage doors. Every garage door drawn on a wall passes through garageFx, which (by the
   building's garage door setting) adds the cut and fold lines that make it open, and marks the
   door so the model can add the extra roll-up parts.
   'print' — printed only.
   'tilt'  — cut on both sides and the bottom, fold along the top: the door swings up inside.
   'roll'  — the opening is cut out; a separate door strip rolls up on a paper roller above it and
             runs in two paper tracks beside it. */
import { CUT, FOLD } from '../../config/constants.js';
import { S } from '../../config/state.js';
import { pl, poly, txt } from '../../lib/draw.js';
import { rectP } from '../../lib/geometry.js';

const only = o => Object.assign(o, { printOnly: true });

/**
 * it: the wall's items; i0: the index of the first item drawn inside the opening (the door itself,
 * not its frame); o: the opening {x, y, w, h} in wall feet; c: the palette.
 */
export function garageFx(it, i0, o, c) {
  /* a marker the model reads to find the doors (artFor strips it; see garageMarks in art/index.js) */
  it.push({ t: 'gmark', d: { x: o.x, y: o.y, w: o.w, h: o.h, c } });
  const mode = S.garageMode || 'print';
  if (mode === 'print') return;
  const { x, y, w, h } = o,
    cut = (a, b) => only(pl([a, b], CUT));
  if (mode === 'tilt') {
    it.push(
      cut([x, y], [x, y + h]),
      cut([x + w, y], [x + w, y + h]),
      cut([x, y], [x + w, y]),
      only(
        pl(
          [
            [x, y + h],
            [x + w, y + h]
          ],
          FOLD
        )
      )
    );
    return;
  }
  /* roll: the door art shows in the 3D view only; on paper the opening is blank and cut out */
  for (let i = i0; i < it.length; i++) it[i] = Object.assign({}, it[i], { previewOnly: true });
  it.push(
    only(poly(rectP(x, y, w, h), { fill: '#ffffff' })),
    cut([x, y], [x + w, y]),
    cut([x + w, y], [x + w, y + h]),
    cut([x + w, y + h], [x, y + h]),
    cut([x, y + h], [x, y]),
    only(
      txt('CUT OUT', x + w / 2, y + h / 2 - 0.3, {
        sizeFt: Math.min(1, w / 7),
        anchor: 'middle',
        fill: '#9a9a9a'
      })
    )
  );
}
