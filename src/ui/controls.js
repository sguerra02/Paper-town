/* The settings panel: shows the right controls for each building type and writes changes into S. */
import { render } from '../app.js';
import { ROWABLE, STORY_LIM } from '../config/constants.js';
import { PRESETS } from '../config/presets/index.js';
import { NUM, S, applyPreset } from '../config/state.js';
import { $ } from '../lib/dom.js';
import { clamp, cleanSign } from '../lib/math.js';
import { effFoot, effRoof } from '../model/building/shell.js';

export const NUMSET = { units: 1, bays: 1 };

export const SC_FIELDS = {
  lawn: ['l', 'w', 't', 'p'],
  cobble: ['l', 'w', 't'],
  gravel: ['l', 'w', 't'],
  sand: ['l', 'w', 't'],
  water: ['l', 'w', 't'],
  forest: ['l', 'w', 't'],
  dirt: ['l', 'w', 't'],
  pond: ['w'],
  parking: ['l', 'w', 't'],
  tracks: ['l', 't'],
  rocks: ['c', 'h'],
  wall: ['h', 'l', 'w'],
  train: ['c'],
  gazebo: ['h', 'w'],
  tentA: ['c', 'h', 'l', 'w'],
  tentParty: ['h', 'w'],
  beds: ['c', 'h', 'l', 'w'],
  tree: ['c', 'h'],
  pine: ['c', 'h'],
  bush: ['c', 'h'],
  hedge: ['h', 'l', 'w'],
  fence: ['h', 'l'],
  street: ['l', 's'],
  lamp: ['c', 'h'],
  hydrant: ['c'],
  mailbox: ['c'],
  car: ['c']
};

export function syncControls() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (el.type === 'checkbox') el.checked = !!S[k];
    else el.value = S[k];
  });
  document
    .querySelectorAll('[data-set]')
    .forEach(g =>
      g
        .querySelectorAll('button')
        .forEach(b => b.setAttribute('aria-pressed', String(String(S[g.dataset.set]) === b.dataset.v)))
    );
  const T = S.type,
    f = effFoot(),
    wing = f === 'L' || f === 'T' || f === 'U';
  $('#customWrap').hidden = S.scale !== 'custom';
  $('#roadWrap').hidden = T !== 'road';
  $('#storeStyleWrap').hidden = T !== 'store';
  $('#officeStyleWrap').hidden = T !== 'office';
  $('#towerTopWrap').hidden = T !== 'castle';
  const feet = T === 'house' ? ['rect', 'L', 'T', 'U', 'row'] : ROWABLE[T] ? ['rect', 'row'] : ['rect'];
  $('#footWrap').hidden = feet.length === 1;
  document.querySelectorAll('[data-set="foot"] button').forEach(b => {
    b.disabled = !feet.includes(b.dataset.v);
    b.setAttribute('aria-pressed', String(b.dataset.v === f));
  });
  $('#wingWrap').hidden = !wing;
  $('#rowWrap').hidden = f !== 'row';
  const Lm = STORY_LIM[T];
  $('#storiesWrap').hidden = Lm[1] === 1;
  $('#stories').min = Lm[0];
  $('#stories').max = Lm[1];
  $('#stories').value = clamp(S.stories, Lm[0], Lm[1]);
  $('#storiesLabel').textContent = T === 'office' ? 'Floors' : T === 'castle' ? 'Levels' : 'Stories';
  $('#roofTypeWrap').hidden = !(T === 'house' || T === 'barn');
  [...$('#roof').options].forEach(o => {
    o.disabled =
      T === 'barn' ? !['gable', 'gambrel'].includes(o.value) : wing && !['gable', 'hip'].includes(o.value);
  });
  $('#roof').value = effRoof() === 'flat' && T !== 'house' ? S.roof : effRoof();
  $('#parapetWrap').hidden = !(T === 'store' && S.storeStyle === 'classic');
  const pitched =
    (T === 'house' || T === 'barn' || T === 'garden' || T === 'civic') &&
    !['flat', 'saw'].includes(effRoof());
  $('#pitchWrap').hidden = !pitched;
  $('#roofHint').textContent =
    {
      venue: 'Flat roof deck behind a parapet. Marquees, canopies and signs are separate 3D parts.',
      industrial:
        S.indKind === 'factory'
          ? 'Sawtooth roof with clerestory glazing, printed as one zigzag strip.'
          : 'Low-slope metal roof.',
      store: 'Storefronts have a flat roof deck behind the parapet; classic fronts rise into a false front.',
      road: 'Flat roof deck behind a low parapet with the sign band.',
      office: 'Flat roof deck behind a parapet, with a rooftop mechanical box.',
      castle: 'The keep has a walkway deck behind crenellated walls. Corner towers are separate parts.',
      barn: 'Barns take gambrel or gable roofs.'
    }[T] ||
    (wing
      ? 'L, T and U wings take gable or hip roofs. The wing roof glues onto the main roof along the valley.'
      : '');
  $('#signWrap').hidden = !['store', 'road', 'office'].includes(T);
  $('#awningWrap').hidden = T !== 'store';
  $('#awningLabel').textContent =
    S.storeStyle === 'modern' ? 'Flat metal canopy (3D part)' : 'Striped awning (3D part)';
  $('#baysWrap').hidden = !(T === 'road' && S.roadKind === 'gas');
  $('#canopyWrap').hidden = !(T === 'road' && S.roadKind === 'gas');
  ['shuttersWrap', 'chimneyWrap', 'towerWrap', 'shutterSw'].forEach(
    id => ($('#' + id).hidden = T !== 'house')
  );
  $('#siloWrap').hidden = T !== 'barn';
  [
    'porchWrap',
    'winStyleWrap',
    'dormersWrap',
    'garageWrap',
    'gableFishWrap',
    'deckWrap',
    'balcWrap',
    'addonHint'
  ].forEach(id => ($('#' + id).hidden = T !== 'house'));
  $('#deckSizeWrap').hidden = T !== 'house' || S.deck === 'none';
  $('#balcSizeWrap').hidden = T !== 'house' || S.balcony === 'none';
  $('#venueWrap').hidden = T !== 'venue';
  $('#civWrap').hidden = T !== 'civic';
  $('#gardenWrap').hidden = T !== 'garden';
  $('#indWrap').hidden = T !== 'industrial';
  $('#signWrap').hidden =
    !['store', 'road', 'office', 'venue', 'industrial', 'civic'].includes(T) &&
    !(T === 'garden' && S.gKind !== 'greenhouse');
  $('#baysWrap').hidden = !(
    (T === 'road' && S.roadKind === 'gas') ||
    (T === 'civic' && S.civKind === 'fire')
  );
  if (T === 'road' && S.roadKind !== 'motel') $('#storiesWrap').hidden = true;
  const SC = T === 'scenery';
  $('#sceneryWrap').hidden = !SC;
  $('#bldDims').hidden = SC;
  $('#roofSet').hidden = SC;
  $('#detailsLegend').parentElement.hidden = SC;
  $('#wallFinishWrap').hidden = SC;
  $('#scCatWrap').hidden = !SC;
  if (SC) {
    $('#footWrap').hidden = true;
    const fl =
      (S.scKind === 'street'
        ? S.streetKind === 'straight'
          ? ['l', 's', 't']
          : ['s', 't']
        : SC_FIELDS[S.scKind]) || [];
    $('#tileTabsWrap').hidden = !fl.includes('t');
    $('#pathWrap').hidden = !fl.includes('p');
    $('#scCountLabel').textContent = S.scKind === 'train' ? 'Cars behind the engine' : 'How many';
    $('#scCountWrap').hidden = !fl.includes('c');
    $('#scHWrap').hidden = !fl.includes('h');
    $('#scLWrap').hidden = !fl.includes('l');
    $('#scWWrap').hidden = !fl.includes('w');
    $('#sidewalkWrap').hidden = !fl.includes('s');
    $('#crosswalkWrap').hidden = !fl.includes('s');
    $('#scHint').textContent =
      {
        lawn: 'Tiles with tabs on two sides join in any direction: slide each tab under the next tile.',
        street: 'Straight, intersection, T and corner tiles share the same road width, so they line up.',
        tracks: 'Standard gauge rails on ties and ballast. Join sections end to end.',
        train: 'Each car is a frame plus a body. Trucks and wheels are printed on the frame.',
        tree: 'Each tree is two cross-slotted silhouettes. Fold each pair at the trunk, glue back to back, then slide the slots together.',
        fence: 'Fold along the bottom and glue the halves back to back.'
      }[S.scKind] || '';
  }
  $('#swWall').textContent = SC ? 'Foliage' : 'Walls';
  $('#swTrim').textContent = SC ? 'Trunk' : 'Trim';
  $('#swRoof').textContent = SC ? 'Roof / paving' : 'Roof';
  $('#swWinWrap').hidden = SC;
  $('#swDoorWrap').hidden = SC;
  if (SC) $('#shutterSw').hidden = true;
  $('#presets').innerHTML = PRESETS[T].map((p, i) =>
    T === 'scenery' && p.cat !== S.scCat
      ? ''
      : `<button type="button" class="chip" data-preset="${i}" aria-pressed="${T === 'scenery' ? String(p.v.scKind === S.scKind && (p.v.streetKind === undefined || p.v.streetKind === S.streetKind) && (p.v.path === undefined || p.v.path === S.path) && (p.v.scCount === undefined || S.scKind !== 'train' || (p.v.scCount === 0) === (S.scCount === 0))) : 'false'}">${p.name}</button>`
  ).join('');
}

export const KIND_KEY = {
  road: 'roadKind',
  venue: 'venueKind',
  civic: 'civKind',
  industrial: 'indKind',
  garden: 'gKind',
  office: 'officeStyle',
  store: 'storeStyle'
};

export let tmr = null;

export const aside = document.querySelector('aside');

/** Wires up this module's event listeners. Called once from main.js. */
export function initControls() {
  $('#presets').addEventListener('click', e => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    applyPreset(PRESETS[S.type][+b.dataset.preset].v);
    syncControls();
    render();
  });
  aside.addEventListener('input', e => {
    const el = e.target;
    const k = el.dataset.k;
    if (!k) return;
    if (el.type === 'checkbox') S[k] = el.checked;
    else if (el.type === 'number') {
      const v = parseFloat(el.value);
      if (!isFinite(v)) return;
      S[k] = clamp(v, NUM[k][0], NUM[k][1]);
    } else if (el.type === 'text') S[k] = cleanSign(el.value);
    else S[k] = el.value;
    if (el.tagName === 'SELECT' || el.type === 'checkbox') syncControls();
    clearTimeout(tmr);
    tmr = setTimeout(render, el.type === 'number' || el.type === 'color' || el.type === 'text' ? 220 : 0);
  });
  aside.addEventListener('change', e => {
    if (e.target.type === 'number' || e.target.type === 'text') syncControls();
  });
  document.querySelectorAll('[data-set]').forEach(g =>
    g.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]');
      if (!b || b.disabled) return;
      const k = g.dataset.set;
      const prevType = S.type;
      S[k] = NUMSET[k] ? +b.dataset.v : b.dataset.v;
      if (k === 'type' && S.type !== prevType) {
        const cat =
          S.type === 'scenery'
            ? PRESETS.scenery.find(p => p.cat === S.scCat) || PRESETS.scenery[0]
            : PRESETS[S.type][0];
        applyPreset(cat.v);
      } else if (KIND_KEY[S.type] === k) {
        const p = PRESETS[S.type].find(q => q.v[k] === S[k]);
        if (p) applyPreset(p.v);
      } else if (k === 'scCat') {
        const p = PRESETS.scenery.find(q => q.cat === S.scCat);
        if (p) applyPreset(p.v);
      }
      syncControls();
      render();
    })
  );
  $('#zoom').addEventListener('input', e =>
    $('#sheets').style.setProperty('--sheet-w', e.target.value + 'px')
  );
}
