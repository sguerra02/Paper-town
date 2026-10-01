/* Backyard and garden presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const GARDEN_PRESETS = [
  {
    name: 'Greenhouse',
    v: {
      foot: 'rect',
      gKind: 'greenhouse',
      width: 16,
      depth: 10,
      stories: 1,
      storyH: 7,
      found: 0,
      pitch: 8,
      eave: 0.2,
      rake: 0.2,
      roofFinish: 'glass',
      wallFinish: 'block',
      wallColor: '#d9d6cf',
      trimColor: '#f4f4f2',
      roofColor: '#bcd9d3',
      windowColor: '#f4f4f2',
      doorColor: '#f4f4f2',
      accentColor: '#3f6a33'
    }
  },
  {
    name: 'Dog house',
    v: {
      foot: 'rect',
      gKind: 'doghouse',
      width: 3.6,
      depth: 3,
      stories: 1,
      storyH: 2.4,
      found: 0.2,
      pitch: 12,
      eave: 0.3,
      rake: 0.3,
      roofFinish: 'asphalt',
      wallFinish: 'siding',
      sign: 'REX',
      wallColor: '#b5462f',
      trimColor: '#f4f1ea',
      roofColor: '#3f4448',
      windowColor: '#f4f1ea',
      doorColor: '#3f4448',
      accentColor: '#b5462f'
    }
  },
  {
    name: 'Chicken coop',
    v: {
      foot: 'rect',
      gKind: 'coop',
      width: 6,
      depth: 4,
      stories: 1,
      storyH: 5.5,
      found: 2,
      pitch: 9,
      eave: 0.4,
      rake: 0.4,
      roofFinish: 'corr',
      wallFinish: 'batten',
      sign: 'EGGS',
      wallColor: '#9b2f22',
      trimColor: '#f4f1ea',
      roofColor: '#8a8f93',
      windowColor: '#f4f1ea',
      doorColor: '#9b2f22',
      accentColor: '#9b2f22'
    }
  }
];
