/* Entertainment venues presets. Each entry is a name plus the settings (v) it applies on top of the defaults. */

export const VENUE_PRESETS = [
  {
    name: 'Movie theatre',
    v: {
      foot: 'rect',
      venueKind: 'theater',
      width: 34,
      depth: 40,
      stories: 1,
      storyH: 24,
      found: 0.5,
      sign: 'RIALTO',
      wallFinish: 'stucco',
      wallColor: '#e6d8b8',
      trimColor: '#3a2a2a',
      windowColor: '#3a2a2a',
      doorColor: '#3a2a2a',
      accentColor: '#b3282d',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Casino',
    v: {
      foot: 'rect',
      venueKind: 'casino',
      width: 44,
      depth: 32,
      stories: 2,
      storyH: 13,
      found: 0.5,
      sign: 'LUCKY STAR',
      wallFinish: 'panel',
      wallColor: '#3a2140',
      trimColor: '#c9a646',
      windowColor: '#1c1c28',
      doorColor: '#1c1c28',
      accentColor: '#8a1f3a',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Bowling alley',
    v: {
      foot: 'rect',
      venueKind: 'bowling',
      width: 40,
      depth: 48,
      stories: 1,
      storyH: 18,
      found: 0.5,
      sign: 'STAR LANES',
      wallFinish: 'block',
      wallColor: '#e8e2d4',
      trimColor: '#e84a3a',
      windowColor: '#2f4f6f',
      doorColor: '#2f4f6f',
      accentColor: '#1f7ab8',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Fitness gym',
    v: {
      foot: 'rect',
      venueKind: 'gym',
      width: 40,
      depth: 44,
      stories: 1,
      storyH: 18,
      found: 0.25,
      sign: 'IRON FITNESS',
      wallFinish: 'panel',
      wallColor: '#3a3f45',
      trimColor: '#9aa3aa',
      windowColor: '#1e2226',
      doorColor: '#1e2226',
      accentColor: '#f2a900',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Modern bar',
    v: {
      foot: 'rect',
      venueKind: 'bar',
      width: 30,
      depth: 40,
      stories: 1,
      storyH: 14,
      found: 0.25,
      sign: 'TAPROOM',
      wallFinish: 'batten',
      wallColor: '#2b2d30',
      trimColor: '#4a4d52',
      windowColor: '#1c1d20',
      doorColor: '#1c1d20',
      accentColor: '#ff4fa3',
      roofColor: '#6b6f70'
    }
  },
  {
    name: 'Opera house',
    v: {
      variant: 'opera',
      foot: 'rect',
      venueKind: 'bar',
      width: 40,
      depth: 50,
      stories: 2,
      storyH: 14,
      found: 0.5,
      sign: 'OPERA HOUSE',
      wallFinish: 'brick',
      wallColor: '#b0705a',
      trimColor: '#efe7d6',
      roofColor: '#6b6f70',
      windowColor: '#2f3b35',
      doorColor: '#3a2a22',
      accentColor: '#5a1f2a'
    }
  },
  {
    name: 'Arcade',
    v: {
      foot: 'rect',
      venueKind: 'bar',
      width: 30,
      depth: 40,
      stories: 1,
      storyH: 14,
      found: 0.25,
      sign: 'ARCADE',
      wallFinish: 'stucco',
      wallColor: '#2a2a4a',
      trimColor: '#4a4a6a',
      roofColor: '#6b6f70',
      windowColor: '#1c1d20',
      doorColor: '#1c1d20',
      accentColor: '#3ad0e8'
    }
  },
  {
    name: 'Roller rink',
    v: {
      variant: 'rink',
      foot: 'rect',
      venueKind: 'bar',
      width: 44,
      depth: 60,
      stories: 1,
      storyH: 12,
      found: 0.5,
      sign: 'ROLLER RINK',
      wallFinish: 'panel',
      roofFinish: 'seam',
      wallColor: '#e6e1d6',
      trimColor: '#f4f4f2',
      roofColor: '#9aa0a4',
      windowColor: '#2a3a4a',
      doorColor: '#2a3a4a',
      accentColor: '#d9542a'
    }
  },
  {
    name: 'Pool hall',
    v: {
      foot: 'rect',
      venueKind: 'bar',
      width: 26,
      depth: 40,
      stories: 1,
      storyH: 14,
      found: 0.25,
      sign: 'BILLIARDS',
      wallFinish: 'brick',
      wallColor: '#5a3a2a',
      trimColor: '#3a2a22',
      roofColor: '#6b6f70',
      windowColor: '#1c1d20',
      doorColor: '#1c1d20',
      accentColor: '#3ad07a'
    }
  },
  {
    name: 'Drive-in movie',
    v: {
      variant: 'drivein',
      foot: 'rect',
      venueKind: 'bar',
      width: 18,
      depth: 14,
      stories: 1,
      storyH: 9,
      found: 0.5,
      sign: 'SNACK BAR',
      wallFinish: 'block',
      wallColor: '#efe9dc',
      trimColor: '#f4f4f2',
      roofColor: '#6b6f70',
      windowColor: '#2a3a4a',
      doorColor: '#2a3a4a',
      accentColor: '#c8282d'
    }
  }
];
