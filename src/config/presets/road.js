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
  },
  {
    name: 'Auto repair garage',
    v: {
      roadKind: 'gas',
      canopy: false,
      bays: 3,
      width: 42,
      depth: 28,
      storyH: 14,
      found: 0.5,
      sign: 'AUTO REPAIR',
      wallFinish: 'block',
      wallColor: '#d9d6cf',
      trimColor: '#f4f4f2',
      roofColor: '#6b6f70',
      windowColor: '#2a3a4a',
      doorColor: '#e4e6e8',
      accentColor: '#2a5aa8'
    }
  },
  {
    name: 'Drive-in burger stand',
    v: {
      variant: 'burger',
      roadKind: 'diner',
      width: 26,
      depth: 18,
      storyH: 10,
      found: 0.5,
      sign: 'BURGERS',
      wallFinish: 'stucco',
      wallColor: '#f6efe2',
      trimColor: '#f3c13a',
      roofColor: '#6b6f70',
      windowColor: '#2a3a4a',
      doorColor: '#c8282d',
      accentColor: '#c8282d'
    }
  },
  {
    name: 'Ice cream stand',
    v: {
      variant: 'icecream',
      roadKind: 'diner',
      width: 16,
      depth: 12,
      storyH: 9,
      found: 0.5,
      sign: 'ICE CREAM',
      wallFinish: 'stucco',
      wallColor: '#fbf3ea',
      trimColor: '#ffffff',
      roofColor: '#6b6f70',
      windowColor: '#5aa0c8',
      doorColor: '#e8789a',
      accentColor: '#e8789a'
    }
  },
  {
    name: 'Convenience store',
    v: {
      variant: 'mart',
      roadKind: 'diner',
      width: 34,
      depth: 26,
      storyH: 11,
      found: 0.5,
      sign: 'QUICK MART',
      wallFinish: 'block',
      wallColor: '#e8e4da',
      trimColor: '#f4f4f2',
      roofColor: '#6b6f70',
      windowColor: '#2a3a4a',
      doorColor: '#2a3a4a',
      accentColor: '#1f7a4a'
    }
  },
  {
    name: 'Coffee drive-thru',
    v: {
      variant: 'coffee',
      roadKind: 'diner',
      width: 12,
      depth: 10,
      storyH: 10,
      found: 0.5,
      sign: 'COFFEE',
      wallFinish: 'siding',
      wallColor: '#4a3428',
      trimColor: '#f1ece0',
      roofColor: '#6b6f70',
      windowColor: '#f1ece0',
      doorColor: '#2f6b4f',
      accentColor: '#2f6b4f'
    }
  },
  {
    name: 'Tire & lube shop',
    v: {
      roadKind: 'gas',
      canopy: false,
      bays: 2,
      width: 34,
      depth: 26,
      storyH: 13,
      found: 0.5,
      sign: 'TIRE & LUBE',
      wallFinish: 'panel',
      wallColor: '#e3e6e8',
      trimColor: '#f5f6f7',
      roofColor: '#6b6f70',
      windowColor: '#2a3a4a',
      doorColor: '#e4e6e8',
      accentColor: '#d9542a'
    }
  }
];
