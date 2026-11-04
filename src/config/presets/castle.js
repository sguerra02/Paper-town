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
  },
  {
    name: 'Gatehouse',
    v: {
      variant: 'gatehouse',
      foot: 'rect',
      towerTop: 'crenel',
      width: 30,
      depth: 20,
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
    name: 'Watchtower',
    v: {
      variant: 'watchtower',
      foot: 'rect',
      towerTop: 'crenel',
      width: 14,
      depth: 14,
      stories: 3,
      storyH: 10,
      found: 1,
      wallFinish: 'stone',
      wallColor: '#a39d90',
      trimColor: '#7d786c',
      roofColor: '#3f4450',
      windowColor: '#4a3a2a',
      doorColor: '#5a3a22',
      accentColor: '#8a1f2a'
    }
  },
  {
    name: 'Ruined keep',
    v: {
      variant: 'ruin',
      foot: 'rect',
      towerTop: 'crenel',
      width: 26,
      depth: 26,
      stories: 2,
      storyH: 12,
      found: 1,
      wallFinish: 'stone',
      wallColor: '#8f8a80',
      trimColor: '#6f6a60',
      roofColor: '#3f4450',
      windowColor: '#4a3a2a',
      doorColor: '#1d1b19',
      accentColor: '#8a1f2a'
    }
  },
  {
    name: 'Wooden motte keep',
    v: {
      variant: 'motte',
      foot: 'rect',
      width: 18,
      depth: 18,
      stories: 2,
      storyH: 10,
      found: 0.5,
      pitch: 10,
      eave: 1,
      rake: 0.75,
      wallFinish: 'batten',
      roofFinish: 'shake',
      wallColor: '#7a5c3e',
      trimColor: '#5a4430',
      roofColor: '#5b534b',
      windowColor: '#4a3a2a',
      doorColor: '#4a3a2a',
      accentColor: '#8a1f2a'
    }
  },
  {
    name: 'Round shell keep',
    v: {
      variant: 'shell',
      foot: 'rect',
      width: 36,
      depth: 36,
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
    name: 'Curtain wall section',
    v: {
      variant: 'curtain',
      foot: 'rect',
      towerTop: 'crenel',
      width: 40,
      depth: 6,
      stories: 2,
      storyH: 10,
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
    name: 'Fortified manor',
    v: {
      variant: 'manor',
      foot: 'rect',
      towerTop: 'cone',
      width: 40,
      depth: 26,
      stories: 2,
      storyH: 11,
      found: 1,
      pitch: 10,
      eave: 1,
      rake: 0.75,
      wallFinish: 'stone',
      roofFinish: 'slate',
      wallColor: '#b5ab98',
      trimColor: '#8d8574',
      roofColor: '#3f4450',
      windowColor: '#3a3226',
      doorColor: '#5a3a22',
      accentColor: '#2a4a7a'
    }
  },
  {
    name: 'Wizard tower',
    v: {
      variant: 'wizard',
      foot: 'rect',
      width: 14,
      depth: 14,
      stories: 4,
      storyH: 10,
      found: 1,
      wallFinish: 'stone',
      roofFinish: 'slate',
      wallColor: '#7d7a8a',
      trimColor: '#5d5a6a',
      roofColor: '#3a2f6a',
      windowColor: '#3a3226',
      doorColor: '#3a2f6a',
      accentColor: '#e9c95a'
    }
  }
];
