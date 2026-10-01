/* Number, color and random helpers. */

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const f3 = n => (Math.round(n * 1000) / 1000).toString();

export function hexRgb(h) {
  h = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255);
}

export function shade(h, amt) {
  const c = hexRgb(h).map(v => (amt < 0 ? v * (1 + amt) : v + (1 - v) * amt));
  return (
    '#' +
    c
      .map(v =>
        Math.round(clamp(v, 0, 1) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

export const cleanSign = s =>
  String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 &'.,!#\-]/g, '')
    .slice(0, 18);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash01(x, y, w) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + w * 3.71) * 43758.5453) % 1;
}
