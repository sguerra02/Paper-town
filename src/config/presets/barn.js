/* Farm buildings presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const BARN_PRESETS = [
  {
    name: 'Gambrel barn + silo',
    v: {
      foot: 'rect',
      roof: 'gambrel',
      width: 36,
      depth: 26,
      stories: 1,
      storyH: 14,
      found: 1,
      pitch: 8,
      eave: 1,
      rake: 0.75,
      silo: true,
      wallFinish: 'batten',
      roofFinish: 'shake',
      wallColor: '#9b2f22',
      trimColor: '#f4f1ea',
      roofColor: '#5b534b',
      windowColor: '#f4f1ea',
      doorColor: '#9b2f22',
      accentColor: '#f4f1ea'
    }
  },
  {
    name: 'Gable barn',
    v: {
      foot: 'rect',
      roof: 'gable',
      width: 34,
      depth: 24,
      stories: 1,
      storyH: 13,
      found: 1,
      pitch: 10,
      eave: 1,
      rake: 0.75,
      silo: false,
      wallFinish: 'batten',
      roofFinish: 'corr',
      wallColor: '#7a6a57',
      trimColor: '#e9e4d8',
      roofColor: '#8a8f93',
      windowColor: '#e9e4d8',
      doorColor: '#6a5a48',
      accentColor: '#e9e4d8'
    }
  }
];
