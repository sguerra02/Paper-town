/* Scenery pieces presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const SCENERY_PRESETS = [
  { cat: 'ground', name: 'Grass', v: { scKind: 'lawn', scL: 30, scW: 24, path: false, tileTabs: 'two' } },
  {
    cat: 'ground',
    name: 'Grass + path',
    v: { scKind: 'lawn', scL: 30, scW: 24, path: true, tileTabs: 'two' }
  },
  { cat: 'ground', name: 'Cobblestone', v: { scKind: 'cobble', scL: 24, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Gravel', v: { scKind: 'gravel', scL: 30, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Sand', v: { scKind: 'sand', scL: 30, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Water', v: { scKind: 'water', scL: 30, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Forest floor', v: { scKind: 'forest', scL: 30, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Dirt', v: { scKind: 'dirt', scL: 30, scW: 24, tileTabs: 'two' } },
  { cat: 'ground', name: 'Pond', v: { scKind: 'pond', scW: 24 } },
  {
    cat: 'roads',
    name: 'Street',
    v: {
      scKind: 'street',
      streetKind: 'straight',
      scL: 30,
      sidewalks: true,
      crosswalk: false,
      tileTabs: 'two',
      roofColor: '#3d4043'
    }
  },
  {
    cat: 'roads',
    name: '4-way intersection',
    v: {
      scKind: 'street',
      streetKind: 'cross',
      sidewalks: true,
      crosswalk: true,
      tileTabs: 'two',
      roofColor: '#3d4043'
    }
  },
  {
    cat: 'roads',
    name: 'T-intersection',
    v: {
      scKind: 'street',
      streetKind: 'tee',
      sidewalks: true,
      crosswalk: true,
      tileTabs: 'two',
      roofColor: '#3d4043'
    }
  },
  {
    cat: 'roads',
    name: 'Corner',
    v: {
      scKind: 'street',
      streetKind: 'corner',
      sidewalks: true,
      crosswalk: true,
      tileTabs: 'two',
      roofColor: '#3d4043'
    }
  },
  {
    cat: 'roads',
    name: 'Parking lot',
    v: { scKind: 'parking', scL: 60, scW: 60, tileTabs: 'none', roofColor: '#3d4043' }
  },
  { cat: 'roads', name: 'Railway track', v: { scKind: 'tracks', scL: 30, tileTabs: 'two' } },
  {
    cat: 'plants',
    name: 'Oak trees',
    v: { scKind: 'tree', scCount: 3, scH: 24, wallColor: '#4f7a3a', trimColor: '#6b4a2f' }
  },
  {
    cat: 'plants',
    name: 'Pine trees',
    v: { scKind: 'pine', scCount: 3, scH: 28, wallColor: '#2f5a3a', trimColor: '#6b4a2f' }
  },
  { cat: 'plants', name: 'Bushes', v: { scKind: 'bush', scCount: 4, scH: 3.5, wallColor: '#4f7a3a' } },
  { cat: 'plants', name: 'Hedgerow', v: { scKind: 'hedge', scH: 4, scL: 40, scW: 3, wallColor: '#3f6a33' } },
  {
    cat: 'plants',
    name: 'Garden beds',
    v: { scKind: 'beds', scCount: 3, scL: 8, scW: 4, scH: 1, wallColor: '#4f8a3a', trimColor: '#8a6a48' }
  },
  { cat: 'structures', name: 'Picket fence', v: { scKind: 'fence', scH: 3.5, scL: 40 } },
  { cat: 'structures', name: 'Stone wall', v: { scKind: 'wall', scH: 3, scL: 30, scW: 2 } },
  {
    cat: 'structures',
    name: 'Gazebo',
    v: { scKind: 'gazebo', scW: 12, scH: 8, roofColor: '#4a4a4f', roofFinish: 'shake' }
  },
  {
    cat: 'structures',
    name: 'Camping tents',
    v: { scKind: 'tentA', scCount: 2, scL: 7, scW: 6, scH: 4.5, accentColor: '#e8742a' }
  },
  {
    cat: 'structures',
    name: 'Party tent',
    v: { scKind: 'tentParty', scW: 14, scH: 7.5, accentColor: '#2a6ab8' }
  },
  { cat: 'objects', name: 'Street lamps', v: { scKind: 'lamp', scCount: 3, scH: 12 } },
  { cat: 'objects', name: 'Fire hydrants', v: { scKind: 'hydrant', scCount: 3, accentColor: '#c8282d' } },
  { cat: 'objects', name: 'Mailboxes', v: { scKind: 'mailbox', scCount: 3, accentColor: '#2a4a7a' } },
  { cat: 'objects', name: 'Boulders', v: { scKind: 'rocks', scCount: 4, scH: 2.5 } },
  { cat: 'vehicles', name: 'Cars', v: { scKind: 'car', scCount: 3, accentColor: '#b3282d' } },
  { cat: 'vehicles', name: 'Freight train', v: { scKind: 'train', scCount: 3, accentColor: '#1f4d8a' } },
  { cat: 'vehicles', name: 'Locomotive', v: { scKind: 'train', scCount: 0, accentColor: '#c8282d' } }
];
