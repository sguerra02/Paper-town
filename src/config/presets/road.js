/* Roadside businesses presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const ROAD_PRESETS = [
  {
    name: 'Motel',
    v: {
      roadKind: 'motel',
      stories: 2,
      width: 58,
      depth: 20,
      storyH: 9,
      found: 0.5,
      sign: 'MOTEL',
      wallFinish: 'stucco',
      wallColor: '#f1e9d6',
      trimColor: '#f7f7f4',
      windowColor: '#2f7a8a',
      doorColor: '#2f7a8a',
      accentColor: '#d9542a',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Roadside diner',
    v: {
      roadKind: 'diner',
      width: 36,
      depth: 20,
      storyH: 11,
      found: 0.5,
      sign: 'DINER',
      wallFinish: 'stucco',
      wallColor: '#ece8de',
      trimColor: '#d9dedf',
      windowColor: '#9aa6aa',
      doorColor: '#9aa6aa',
      accentColor: '#b3282d',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Filling station',
    v: {
      roadKind: 'gas',
      width: 36,
      depth: 24,
      storyH: 12,
      found: 0.5,
      bays: 2,
      canopy: true,
      sign: 'GAS',
      wallFinish: 'block',
      wallColor: '#ecebe4',
      trimColor: '#f7f7f4',
      windowColor: '#2f5f8f',
      doorColor: '#e3e4e0',
      accentColor: '#1f5fa8',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Car wash',
    v: {
      roadKind: 'carwash',
      width: 24,
      depth: 44,
      storyH: 13,
      found: 0.5,
      sign: 'CAR WASH',
      wallFinish: 'block',
      wallColor: '#e9edf0',
      trimColor: '#f7f9fa',
      windowColor: '#3b6f9e',
      doorColor: '#3b6f9e',
      accentColor: '#1d8fd6',
      roofColor: '#6b6f70'
    }
  }
];
