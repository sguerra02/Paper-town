/* Industrial buildings presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const INDUSTRIAL_PRESETS = [
  {
    name: 'Sawtooth factory',
    v: {
      foot: 'rect',
      indKind: 'factory',
      width: 30,
      depth: 36,
      stories: 1,
      storyH: 20,
      found: 0.5,
      sign: 'IRONWORKS',
      wallFinish: 'brick',
      roofFinish: 'corr',
      wallColor: '#9a4a38',
      trimColor: '#d9d2c3',
      windowColor: '#39474d',
      doorColor: '#5a6166',
      accentColor: '#5a6166',
      roofColor: '#7a7f84'
    }
  },
  {
    name: 'Self storage',
    v: {
      foot: 'rect',
      indKind: 'storage',
      width: 60,
      depth: 24,
      stories: 1,
      storyH: 10,
      found: 0.5,
      sign: 'STORAGE',
      wallFinish: 'panel',
      roofFinish: 'corr',
      wallColor: '#e3e6e8',
      trimColor: '#f5f6f7',
      windowColor: '#3b4a55',
      doorColor: '#e8742a',
      accentColor: '#e8742a',
      roofColor: '#9aa0a4'
    }
  },
  {
    name: 'Steel warehouse',
    v: {
      variant: 'warehouse',
      foot: 'rect',
      indKind: 'storage',
      width: 60,
      depth: 40,
      stories: 1,
      storyH: 14,
      found: 0.5,
      sign: 'DISTRIBUTION',
      wallFinish: 'panel',
      roofFinish: 'corr',
      wallColor: '#c9ced0',
      trimColor: '#f5f6f7',
      roofColor: '#9aa0a4',
      windowColor: '#3b4a55',
      doorColor: '#e4e6e8',
      accentColor: '#2a5aa8'
    }
  },
  {
    name: 'Brick mill',
    v: {
      variant: 'mill',
      foot: 'rect',
      indKind: 'storage',
      width: 70,
      depth: 30,
      stories: 2,
      storyH: 14,
      found: 1,
      pitch: 4,
      sign: 'WOOLEN MILL',
      wallFinish: 'brick',
      roofFinish: 'slate',
      wallColor: '#9a4a38',
      trimColor: '#e8dfcc',
      roofColor: '#55595c',
      windowColor: '#2f3b35',
      doorColor: '#4a3a2a',
      accentColor: '#4a3a2a'
    }
  },
  {
    name: 'Quonset hut',
    v: {
      variant: 'quonset',
      foot: 'rect',
      indKind: 'storage',
      width: 30,
      depth: 48,
      stories: 1,
      storyH: 10,
      found: 0,
      sign: 'QUONSET',
      wallFinish: 'panel',
      roofFinish: 'corr',
      wallColor: '#a9adb0',
      trimColor: '#d9dcde',
      roofColor: '#a9adb0',
      windowColor: '#3b4a55',
      doorColor: '#7a7f84',
      accentColor: '#5a6f4a'
    }
  },
  {
    name: 'Machine shop',
    v: {
      variant: 'shop',
      foot: 'rect',
      indKind: 'storage',
      width: 46,
      depth: 34,
      stories: 1,
      storyH: 16,
      found: 0.5,
      pitch: 3,
      sign: 'MACHINE SHOP',
      wallFinish: 'block',
      roofFinish: 'corr',
      wallColor: '#d9d6cf',
      trimColor: '#f4f4f2',
      roofColor: '#8a8f93',
      windowColor: '#3b4a55',
      doorColor: '#e4e6e8',
      accentColor: '#c8282d'
    }
  },
  {
    name: 'Grain elevator',
    v: {
      variant: 'elevator',
      foot: 'rect',
      indKind: 'storage',
      width: 44,
      depth: 14,
      stories: 1,
      storyH: 14,
      found: 0.5,
      pitch: 8,
      sign: 'FARMERS COOP',
      wallFinish: 'panel',
      roofFinish: 'seam',
      wallColor: '#d8d2c4',
      trimColor: '#efebe2',
      roofColor: '#8f9597',
      windowColor: '#3b4a55',
      doorColor: '#7a7f84',
      accentColor: '#8a1f2a'
    }
  },
  {
    name: 'Lumber mill',
    v: {
      variant: 'lumber',
      foot: 'rect',
      indKind: 'storage',
      width: 36,
      depth: 30,
      stories: 1,
      storyH: 14,
      found: 0.5,
      pitch: 6,
      sign: 'LUMBER CO',
      wallFinish: 'batten',
      roofFinish: 'corr',
      wallColor: '#8a6a48',
      trimColor: '#e9e4d8',
      roofColor: '#8a8f93',
      windowColor: '#3b4a55',
      doorColor: '#6a5a48',
      accentColor: '#6a5a48'
    }
  },
  {
    name: 'Brewery',
    v: {
      variant: 'brewery',
      foot: 'rect',
      indKind: 'storage',
      width: 40,
      depth: 30,
      stories: 2,
      storyH: 12,
      found: 0.5,
      pitch: 6,
      sign: 'BREWING CO',
      wallFinish: 'brick',
      roofFinish: 'asphalt',
      wallColor: '#7d3a2c',
      trimColor: '#e8dfcc',
      roofColor: '#55595c',
      windowColor: '#2f3b35',
      doorColor: '#3a2a22',
      accentColor: '#2f5a3a'
    }
  },
  {
    name: 'Freight depot',
    v: {
      variant: 'depot',
      foot: 'rect',
      indKind: 'storage',
      width: 60,
      depth: 24,
      stories: 1,
      storyH: 14,
      found: 1.5,
      pitch: 5,
      sign: 'FREIGHT',
      wallFinish: 'siding',
      roofFinish: 'asphalt',
      wallColor: '#c8a46a',
      trimColor: '#5a3a22',
      roofColor: '#55595c',
      windowColor: '#2f3b35',
      doorColor: '#7a3b2a',
      accentColor: '#5a3a22'
    }
  }
];
