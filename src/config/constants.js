/* Print constants, paper sizes and display names shared across the app. */

export const MM = 1 / 25.4;

export const MARGIN = 0.35,
  GAP = 0.14,
  HEADER = 1.02,
  FOOTER = 0.3,
  LABEL = 0.17;

export const PAPERS = {
  letter: { name: 'Letter', w: 8.5, h: 11 },
  legal: { name: 'Legal', w: 8.5, h: 14 },
  a4: { name: 'A4', w: 210 * MM, h: 297 * MM },
  a3: { name: 'A3', w: 297 * MM, h: 420 * MM }
};

export const THICK = { copy: 0.1, card65: 0.23, card110: 0.3 };

export const WALL_NAMES = {
  log: 'Logs',
  shingle: 'Cedar shingle',
  tudor: 'Tudor half-timber',
  siding: 'Lap siding',
  brick: 'Brick',
  batten: 'Board & batten',
  stucco: 'Stucco',
  block: 'Concrete block',
  stone: 'Fieldstone',
  panel: 'Metal panel',
  stave: 'Concrete stave'
};

export const ROOF_NAMES = {
  gable: 'Gable',
  hip: 'Hip',
  gambrel: 'Gambrel',
  shed: 'Shed',
  flat: 'Flat',
  saw: 'Sawtooth'
};

export const COVER_NAMES = {
  asphalt: '3-tab asphalt',
  arch: 'Architectural shingle',
  shake: 'Cedar shake',
  slate: 'Slate',
  fish: 'Fish-scale shingle',
  tile: 'Clay tile',
  seam: 'Standing-seam metal',
  corr: 'Corrugated metal'
};

export const TYPE_NAMES = {
  civic: 'Civic',
  garden: 'Backyard',
  house: 'House',
  store: 'Storefront',
  road: 'Roadside',
  office: 'Office building',
  barn: 'Barn',
  castle: 'Castle',
  venue: 'Entertainment',
  industrial: 'Industrial',
  scenery: 'Scenery'
};

export const VARY_WALL = {
  brick: ['#7b3a2d', '#a8614a', '#8a5a44', '#6e4a3c'],
  other: ['#7f98a6', '#c9b37e', '#8c9b7a', '#b77a6a', '#d8d4c8']
};

export const VARY_ACC = ['#1f4d3a', '#7a2330', '#2a4a7a', '#8a5a1c'];

export const SIGNS = {
  store: ['BAKERY', 'BARBER', 'CAFE', 'DRY GOODS', 'BOOKS'],
  office: ['INSURANCE', 'TITLE CO', 'DENTAL', 'REALTY'],
  house: []
};

export const CUT = { stroke: '#111111', w: 0.6 };

export const FOLD = { stroke: '#111111', w: 0.5, dash: [4, 1.6, 0.8, 1.6] };

export const TABFILL = '#e2e2dd';

export const ROWABLE = { house: 1, store: 1, office: 1, venue: 1 };

export const STORY_LIM = {
  civic: [1, 3],
  garden: [1, 1],
  house: [1, 3],
  store: [1, 4],
  road: [1, 2],
  office: [2, 12],
  barn: [1, 2],
  castle: [1, 4],
  venue: [1, 3],
  industrial: [1, 2],
  scenery: [1, 1]
};
