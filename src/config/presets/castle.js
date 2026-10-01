/* Castles presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const CASTLE_PRESETS = [
  {
    name: 'Stone keep',
    v: {
      foot: 'rect',
      towerTop: 'cone',
      width: 28,
      depth: 28,
      stories: 2,
      storyH: 12,
      found: 1,
      wallFinish: 'stone',
      wallColor: '#9d978a',
      trimColor: '#7d786c',
      roofColor: '#3f4450',
      windowColor: '#4a3a2a',
      doorColor: '#5a3a22',
      accentColor: '#8a1f2a'
    }
  },
  {
    name: 'Battlement fort',
    v: {
      foot: 'rect',
      towerTop: 'crenel',
      width: 32,
      depth: 28,
      stories: 2,
      storyH: 11,
      found: 1,
      wallFinish: 'stone',
      wallColor: '#b8ad97',
      trimColor: '#958b76',
      roofColor: '#3f4450',
      windowColor: '#4a3a2a',
      doorColor: '#4d3421',
      accentColor: '#1f3f7a'
    }
  }
];
