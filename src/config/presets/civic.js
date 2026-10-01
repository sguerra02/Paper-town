/* Civic buildings presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const CIVIC_PRESETS = [
  {
    name: 'Fire station',
    v: {
      foot: 'rect',
      civKind: 'fire',
      width: 40,
      depth: 34,
      stories: 2,
      storyH: 14,
      found: 0.5,
      bays: 2,
      sign: 'ENGINE 7',
      wallFinish: 'brick',
      wallColor: '#9a4a38',
      trimColor: '#efe7d6',
      windowColor: '#efe7d6',
      doorColor: '#c8282d',
      accentColor: '#c8282d',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Police station',
    v: {
      foot: 'rect',
      civKind: 'police',
      width: 38,
      depth: 30,
      stories: 2,
      storyH: 12,
      found: 1,
      sign: 'POLICE',
      wallFinish: 'stone',
      wallColor: '#c9c2b2',
      trimColor: '#eeeae0',
      windowColor: '#2d3a4a',
      doorColor: '#2d3a4a',
      accentColor: '#1f3f7a',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Church',
    v: {
      foot: 'rect',
      civKind: 'church',
      width: 44,
      depth: 26,
      stories: 1,
      storyH: 18,
      found: 1.5,
      pitch: 14,
      eave: 1,
      rake: 0.75,
      roofFinish: 'slate',
      wallFinish: 'siding',
      wallColor: '#f4f2ec',
      trimColor: '#ffffff',
      roofColor: '#3f444a',
      windowColor: '#ffffff',
      doorColor: '#7a2e2e',
      accentColor: '#7a2e2e'
    }
  },
  {
    name: 'Stone chapel',
    v: {
      foot: 'rect',
      civKind: 'church',
      width: 36,
      depth: 22,
      stories: 1,
      storyH: 16,
      found: 1,
      pitch: 16,
      eave: 0.75,
      rake: 0.5,
      roofFinish: 'slate',
      wallFinish: 'stone',
      wallColor: '#a29a8a',
      trimColor: '#d8d0c0',
      roofColor: '#34383e',
      windowColor: '#d8d0c0',
      doorColor: '#5a3a22',
      accentColor: '#5a3a22'
    }
  },
  {
    name: 'Library',
    v: {
      foot: 'rect',
      civKind: 'library',
      width: 40,
      depth: 30,
      stories: 1,
      storyH: 16,
      found: 3,
      sign: 'PUBLIC LIBRARY',
      wallFinish: 'stone',
      wallColor: '#d6ccb4',
      trimColor: '#f2ede0',
      windowColor: '#f2ede0',
      doorColor: '#3a2a22',
      accentColor: '#3a2a22',
      roofColor: '#6b6f70',
      roofFinish: 'slate'
    }
  },
  {
    name: 'Post office',
    v: {
      foot: 'rect',
      civKind: 'post',
      width: 36,
      depth: 30,
      stories: 1,
      storyH: 15,
      found: 2,
      sign: 'POST OFFICE',
      wallFinish: 'brick',
      wallColor: '#a2553f',
      trimColor: '#f2ede0',
      windowColor: '#f2ede0',
      doorColor: '#2d3a4a',
      accentColor: '#2d3a4a',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Rail depot',
    v: {
      foot: 'rect',
      civKind: 'station',
      width: 44,
      depth: 20,
      stories: 1,
      storyH: 12,
      found: 1,
      pitch: 7,
      eave: 3,
      rake: 2,
      roofFinish: 'slate',
      sign: 'MAPLETON',
      wallFinish: 'batten',
      wallColor: '#c9a25a',
      trimColor: '#5a3a22',
      roofColor: '#6a3a2e',
      windowColor: '#5a3a22',
      doorColor: '#5a3a22',
      accentColor: '#2f4a3a'
    }
  }
];
