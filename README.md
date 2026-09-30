# Gable & Crease

Configure papercraft buildings and scenery in the browser, then print them to exact scale as PDFs to cut, fold and glue.

- **Catalog** of 80+ models: houses, Main Street storefronts, roadside businesses, offices and hotels, entertainment venues, civic buildings, farm buildings, castles, backyard pieces and scenery (ground tiles, roads and rail, trees, vehicles).
- **Designer** for size, stories, footprint (rectangle, L, T, U, row), roof type and pitch, wall and roof finishes, colors, porches, decks, balconies, dormers, towers and more.
- **Window & door editor**: drag openings on any wall; 10 window shapes, 7 pane patterns, 9 door styles, sliding glass doors, 5 garage door styles; per-window lit, boarded and broken effects.
- **Exact-scale print**: 1:87 (HO), 1:64 (S), 1:48 (O), 1:72, 1:35, tabletop scales, a custom ratio or fit-to-paper, on Letter, Legal, A4 or A3. Oversized parts split into sections with glue strips. Paper thickness offsets, glue tabs, fold lines and a scale bar on every sheet.
- Free, no accounts, runs entirely in the browser.

## Getting started

```sh
npm install
npm start            # http://localhost:5173, runs the source modules directly
```

There is no build step during development: `index.html` loads `src/main.js` as an ES module, so edit a file and reload. Modules need `http://`, so use `npm start` rather than opening the file from disk.

```sh
npm run build        # bundles everything into one file: dist/index.html
npm run preview      # serves dist/ on http://localhost:5174
npm run format       # Prettier over src/, css/ and index.html
```

## Testing

```sh
npx playwright install chromium
npm test             # every preset renders without errors; sample PDFs export
npm run test:dist    # the same checks against the bundled dist/index.html
```

Sample PDFs land in `test-output/`. CI runs both on every push (`.github/workflows/test.yml`).

## Deploying

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`. Turn it on once under **Settings → Pages → Source: GitHub Actions**.

## How it works

Every change runs the same pipeline, in `src/app.js`:

1. **Settings** — everything the user picks lives in one object, `S` (`src/config/state.js`).
2. **Model** — `buildModel()` turns `S` into a list of 3D faces. Each face edge is marked `attach` (gets a glue tab), `auto` (folds to, or tabs onto, its matching edge) or `free` (cut).
3. **Artwork** — `artFor(face)` draws each face's printed surface as vector items, measured in feet.
4. **Pieces** — `buildPieces()` unfolds groups of faces flat at the chosen scale and adds tabs; parts too big for the sheet are split into glued sections.
5. **Sheets** — `pack()` lays pieces onto pages; `pageItems()` adds the header, labels and scale bar.
6. **Output** — SVG sheet previews, the Three.js preview, and the PDF (72 pt per inch, so sizes are exact).

## Project layout

```
index.html                 page markup; loads css/ and src/main.js
css/
  tokens.css               colors, fonts, light and dark themes
  layout.css               header, two-column frame, view switching
  controls.css             settings panel fields, buttons, chips
  designer.css             cutting-mat stage, 3D card, sheet previews
  editor.css               window & door editor
  catalog.css              catalog grid and cards
src/
  main.js                  entry point: wires up the UI and does the first render
  app.js                   compute() and render(): the pipeline above
  config/
    state.js               S (settings), EDIT (editor selection), NUM limits, applyPreset
    constants.js           paper sizes, paper thickness, margins, display names
    presets/               one file per building type, plus index.js that collects them
  lib/
    dom.js                 $, esc, status line, saveFile
    math.js                clamp, color shading, seeded random, hashing
    geometry.js            vectors, polygons, clipping, arches and other shapes
    draw.js                poly / text / segment items and SVG output
  model/
    index.js               buildModel()
    faces.js               mkFace, wallFace, boxFaces
    palette.js             colors → print palette (color or line art)
    building/shell.js      footprint, walls, wings, buildUnit()
    building/roofs.js      gable, hip, gambrel, shed, flat, sawtooth
    features/house.js      porches, dormers, chimneys
    features/towers.js     towers, silos, steeples, civic extras
    features/commercial.js awnings, canopies, marquees, signs
    features/addons.js     decks and balconies (printed on their own sheets)
    scenery/               trees, objects, ground tiles, trains
  art/
    index.js               artFor(): picks the artwork by face kind
    textures.js            siding, brick, shingles, half-timber, roofs
    facades/               per building type: commercial, venues, civic, rural, castle
    openings/              windows, doors, garage doors and glass effects
    parts.js               chimneys, signs, porch parts, railings, pumps
    scenery/               ground, objects, stone and rail artwork
  print/
    unfold.js              faces → flat pieces with tabs
    split.js               oversized parts → glued sections
    layout.js              paper, scale, packing onto sheets
    sheets.js              sheet header, labels, scale bar
    pdf.js                 PDF export
  ui/
    controls.js            settings panel
    editor.js              window & door editor
    preview3d.js           Three.js preview
    catalog.js             catalog view and thumbnails
    design-file.js         save / open design .json
scripts/
  build.mjs                esbuild bundle → dist/index.html
  serve.js                 local static server
tests/                     Playwright checks (see Testing)
```

## Where to change what

| To… | Edit |
| --- | --- |
| Add or tweak a catalog model | `src/config/presets/<type>.js` |
| Add a setting | default in `src/config/state.js`, control in `index.html`, visibility in `src/ui/controls.js`, then read it in the model or art code |
| Change a building type's facade | `src/art/facades/` |
| Add a window, door or garage style | `src/art/openings/` and the style list in `src/ui/editor.js` |
| Add a wall or roof finish | `src/art/textures.js` and the finish list in `index.html` |
| Add a building feature (bay window, cupola…) | a builder in `src/model/features/`, called from `buildUnit()` in `src/model/building/shell.js` |
| Add a scenery piece | `src/model/scenery/` for the shape, `src/art/scenery/` for the artwork, a preset in `src/config/presets/scenery.js` |
| Change sheet layout or margins | `src/config/constants.js` and `src/print/` |
| Restyle the site | `css/` (colors and fonts are in `tokens.css`) |

Units: model and artwork coordinates are in feet with y up; sheet coordinates are in inches with y down.
