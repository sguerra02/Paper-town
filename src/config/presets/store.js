/* Main Street storefronts presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const STORE_PRESETS = [
  {
    name: 'Brick mercantile',
    v: {
      foot: 'rect',
      storeStyle: 'classic',
      width: 26,
      depth: 32,
      stories: 2,
      storyH: 10,
      found: 0.5,
      parapet: 'cornice',
      awning: true,
      sign: 'MERCANTILE',
      wallFinish: 'brick',
      wallColor: '#8e4535',
      trimColor: '#efe7d6',
      windowColor: '#2f3b35',
      doorColor: '#2f3b35',
      accentColor: '#1f4d3a',
      roofColor: '#55595c'
    }
  },
  {
    name: 'Main Street row',
    v: {
      foot: 'row',
      storeStyle: 'classic',
      units: 3,
      vary: true,
      width: 20,
      depth: 28,
      stories: 2,
      storyH: 9,
      found: 0.5,
      parapet: 'stepped',
      awning: true,
      sign: 'HARDWARE',
      wallFinish: 'brick',
      wallColor: '#9a4d3b',
      trimColor: '#f0e8d8',
      windowColor: '#3a2f2a',
      doorColor: '#3a2f2a',
      accentColor: '#7a2330',
      roofColor: '#55595c'
    }
  },
  {
    name: 'Western false front',
    v: {
      foot: 'rect',
      storeStyle: 'classic',
      width: 24,
      depth: 36,
      stories: 1,
      storyH: 11,
      found: 0.5,
      parapet: 'arched',
      awning: false,
      sign: 'SALOON',
      wallFinish: 'siding',
      wallColor: '#c9b27c',
      trimColor: '#f2ead7',
      windowColor: '#5a3b2a',
      doorColor: '#5a3b2a',
      accentColor: '#5a3b2a',
      roofColor: '#55595c'
    }
  },
  {
    name: 'Modern storefront',
    v: {
      foot: 'rect',
      storeStyle: 'modern',
      width: 28,
      depth: 30,
      stories: 1,
      storyH: 11,
      found: 0.25,
      awning: true,
      sign: 'STUDIO',
      wallFinish: 'panel',
      wallColor: '#d8d6d0',
      trimColor: '#f4f4f2',
      windowColor: '#3a3f44',
      doorColor: '#3a3f44',
      accentColor: '#e0572a',
      roofColor: '#55595c'
    }
  },
  {
    name: 'Modern strip row',
    v: {
      foot: 'row',
      storeStyle: 'modern',
      units: 3,
      vary: true,
      width: 20,
      depth: 28,
      stories: 1,
      storyH: 11,
      found: 0.25,
      awning: true,
      sign: 'COFFEE',
      wallFinish: 'stucco',
      wallColor: '#e3dfd6',
      trimColor: '#f4f4f2',
      windowColor: '#2f3438',
      doorColor: '#2f3438',
      accentColor: '#2a7a6b',
      roofColor: '#55595c'
    }
  }
];
