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
  },
  {
    name: 'Brick apartment block',
    v: {
      foot: 'rect',
      officeStyle: 'punched',
      width: 36,
      depth: 28,
      stories: 5,
      storyH: 10,
      found: 0.5,
      sign: 'THE ASHFORD',
      wallFinish: 'brick',
      wallColor: '#9a5a3c',
      trimColor: '#efe7d6',
      roofColor: '#6b6f70',
      windowColor: '#2c3236',
      doorColor: '#2c3236',
      accentColor: '#2f5a3a'
    }
  },
  {
    name: 'Art deco tower',
    v: {
      variant: 'deco',
      foot: 'rect',
      officeStyle: 'punched',
      width: 36,
      depth: 32,
      stories: 10,
      storyH: 11,
      found: 0.5,
      sign: 'NATIONAL',
      wallFinish: 'stone',
      wallColor: '#d8cdb6',
      trimColor: '#e9e2d0',
      roofColor: '#6b6f70',
      windowColor: '#2a3a42',
      doorColor: '#2a3a42',
      accentColor: '#2a4a5a'
    }
  },
  {
    name: 'Mid-century office',
    v: {
      foot: 'rect',
      officeStyle: 'glass',
      width: 44,
      depth: 30,
      stories: 3,
      storyH: 11,
      found: 0.5,
      sign: 'ACME',
      wallFinish: 'panel',
      wallColor: '#d9d6cf',
      trimColor: '#f4f4f2',
      roofColor: '#6b6f70',
      windowColor: '#3b6a7a',
      doorColor: '#3b6a7a',
      accentColor: '#d9a531'
    }
  },
  {
    name: 'Medical clinic',
    v: {
      variant: 'clinic',
      foot: 'rect',
      officeStyle: 'punched',
      width: 34,
      depth: 28,
      stories: 2,
      storyH: 11,
      found: 0.5,
      sign: 'CLINIC',
      wallFinish: 'stucco',
      wallColor: '#eef0ee',
      trimColor: '#f8f8f6',
      roofColor: '#6b6f70',
      windowColor: '#2d4a5a',
      doorColor: '#2d4a5a',
      accentColor: '#2a6aa8'
    }
  },
  {
    name: 'Small-town inn',
    v: {
      foot: 'rect',
      officeStyle: 'hotel',
      width: 34,
      depth: 26,
      stories: 3,
      storyH: 9,
      found: 0.5,
      sign: 'THE INN',
      wallFinish: 'siding',
      wallColor: '#e8dcc4',
      trimColor: '#4a3a2a',
      roofColor: '#6b6f70',
      windowColor: '#2d3a42',
      doorColor: '#2d3a42',
      accentColor: '#2f5a3a'
    }
  },
  {
    name: 'Parking garage',
    v: {
      variant: 'parkgarage',
      foot: 'rect',
      officeStyle: 'punched',
      width: 60,
      depth: 50,
      stories: 4,
      storyH: 10,
      found: 0.5,
      sign: 'PARKING',
      wallFinish: 'block',
      wallColor: '#d3d0c8',
      trimColor: '#e8e6e0',
      roofColor: '#6b6f70',
      windowColor: '#2c3236',
      doorColor: '#2c3236',
      accentColor: '#2a4a9a'
    }
  }
];
