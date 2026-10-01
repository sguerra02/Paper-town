/* Offices and hotels presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const OFFICE_PRESETS = [
  {
    name: 'Hotel',
    v: {
      foot: 'rect',
      officeStyle: 'hotel',
      width: 40,
      depth: 28,
      stories: 5,
      storyH: 10,
      found: 0.5,
      sign: 'GRAND HOTEL',
      wallFinish: 'stucco',
      wallColor: '#e6dccb',
      trimColor: '#b89d74',
      windowColor: '#2d3a42',
      doorColor: '#2d3a42',
      accentColor: '#7a2330',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Glass office',
    v: {
      foot: 'rect',
      officeStyle: 'glass',
      width: 32,
      depth: 24,
      stories: 6,
      storyH: 12,
      found: 0.5,
      sign: 'MERIDIAN',
      wallFinish: 'panel',
      wallColor: '#c9cdd0',
      trimColor: '#5b646a',
      windowColor: '#2e3438',
      doorColor: '#2e3438',
      accentColor: '#0f6c8f',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Brick office block',
    v: {
      foot: 'rect',
      officeStyle: 'punched',
      width: 34,
      depth: 26,
      stories: 4,
      storyH: 12,
      found: 0.5,
      sign: 'FIRST NATIONAL',
      wallFinish: 'brick',
      wallColor: '#8a4a3a',
      trimColor: '#e9e2d3',
      windowColor: '#2c3236',
      doorColor: '#2c3236',
      accentColor: '#2c3236',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Office row',
    v: {
      foot: 'row',
      officeStyle: 'punched',
      units: 3,
      vary: true,
      width: 24,
      depth: 26,
      stories: 3,
      storyH: 10,
      found: 0.5,
      sign: 'LAW OFFICES',
      wallFinish: 'stone',
      wallColor: '#b9ae98',
      trimColor: '#efe9dc',
      windowColor: '#2c3236',
      doorColor: '#2c3236',
      accentColor: '#3a4a5a',
      roofColor: '#6b6f70'
    }
  }
];
