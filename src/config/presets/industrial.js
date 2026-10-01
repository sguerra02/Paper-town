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
  }
];
