/* Turns the chosen colors into a full print palette (color or line art). */
import { S } from '../config/state.js';
import { shade } from '../lib/math.js';

export function colorsFromS() {
  return {
    wall: S.wallColor,
    trim: S.trimColor,
    roof: S.roofColor,
    window: S.windowColor,
    door: S.doorColor,
    shutter: S.shutterColor,
    accent: S.accentColor
  };
}

export function makePal(c) {
  const L = S.mode === 'line',
    g = '#9a9a9a',
    k = '#222222',
    w = '#ffffff';
  return {
    L,
    wall: L ? w : c.wall,
    wallLine: L ? g : shade(c.wall, -0.3),
    trim: L ? w : c.trim,
    trimLine: L ? k : shade(c.trim, -0.4),
    window: L ? w : c.window,
    windowLine: L ? k : shade(c.window, -0.45),
    glass: L ? w : '#2e3c44',
    glassLine: L ? k : '#1a2327',
    roof: L ? w : c.roof,
    roofLine: L ? g : shade(c.roof, -0.38),
    ridge: L ? w : shade(c.roof, -0.18),
    drip: L ? w : shade(c.roof, -0.3),
    door: L ? w : c.door,
    doorLine: L ? k : shade(c.door, -0.45),
    shutter: L ? w : c.shutter,
    shutterLine: L ? k : shade(c.shutter, -0.45),
    accent: L ? w : c.accent,
    accentLine: L ? k : shade(c.accent, -0.4),
    accentText: L ? k : c.trim,
    found: L ? w : '#8d8b85',
    foundLine: L ? g : '#65635e',
    base: L ? w : '#ecebe6',
    deck: L ? w : '#8e9294',
    deckLine: L ? g : '#6f7375',
    concrete: L ? w : '#cfcdc6',
    concreteLine: L ? g : '#a9a79f',
    metal: L ? w : '#c9ced0',
    metalLine: L ? k : '#8c9294'
  };
}
