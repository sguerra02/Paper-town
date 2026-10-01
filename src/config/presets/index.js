/* All preset designs, keyed by building type. Each type lives in its own file in this folder; the catalog lists them all. */
import { BARN_PRESETS } from './barn.js';
import { CASTLE_PRESETS } from './castle.js';
import { CIVIC_PRESETS } from './civic.js';
import { GARDEN_PRESETS } from './garden.js';
import { HOUSE_PRESETS } from './house.js';
import { INDUSTRIAL_PRESETS } from './industrial.js';
import { OFFICE_PRESETS } from './office.js';
import { ROAD_PRESETS } from './road.js';
import { SCENERY_PRESETS } from './scenery.js';
import { STORE_PRESETS } from './store.js';
import { VENUE_PRESETS } from './venue.js';

export const PRESETS = {
  house: HOUSE_PRESETS,
  store: STORE_PRESETS,
  road: ROAD_PRESETS,
  office: OFFICE_PRESETS,
  venue: VENUE_PRESETS,
  civic: CIVIC_PRESETS,
  garden: GARDEN_PRESETS,
  industrial: INDUSTRIAL_PRESETS,
  scenery: SCENERY_PRESETS,
  barn: BARN_PRESETS,
  castle: CASTLE_PRESETS
};
