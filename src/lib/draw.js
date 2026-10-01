/* Drawing items (poly, polyline, text, segments) and turning them into SVG. */
import { esc } from './dom.js';
import { f3 } from './math.js';

export const poly = (p, o = {}) => Object.assign({ t: 'poly', p }, o);

export const pl = (p, o = {}) => Object.assign({ t: 'pl', p }, o);

export const txt = (s, x, y, o = {}) => ({
  t: 'text',
  s,
  x,
  y,
  size: o.size || 6,
  sizeFt: o.sizeFt,
  fill: o.fill || '#333333',
  anchor: o.anchor || 'start',
  bold: !!o.bold,
  ang: o.ang || 0
});

export function mapItems(items, m, dAng = 0) {
  return items.map(it => {
    if (it.t === 'poly' || it.t === 'pl') return Object.assign({}, it, { p: it.p.map(m) });
    if (it.t === 'segs') return Object.assign({}, it, { s: it.s.map(([a, b]) => [m(a), m(b)]) });
    if (it.t === 'text') {
      const q = m([it.x, it.y]);
      return Object.assign({}, it, { x: q[0], y: q[1], ang: it.ang + dAng });
    }
    return it;
  });
}

export function pathD(p, close) {
  let d = '';
  p.forEach((q, i) => {
    d += (i ? 'L' : 'M') + f3(q[0]) + ' ' + f3(q[1]);
  });
  return close ? d + 'Z' : d;
}

export function segsD(s) {
  let d = '';
  s.forEach(([a, b]) => {
    d += 'M' + f3(a[0]) + ' ' + f3(a[1]) + 'L' + f3(b[0]) + ' ' + f3(b[1]);
  });
  return d;
}

export function svgItems(items, u) {
  return items
    .map(it => {
      const st = it.stroke
        ? ` stroke="${it.stroke}" stroke-width="${f3(it.w * u)}"` +
          (it.dash ? ` stroke-dasharray="${it.dash.map(v => f3(v * u)).join(' ')}"` : '')
        : '';
      if (it.t === 'poly')
        return `<path d="${pathD(it.p, true)}" fill="${it.fill || 'none'}"${st} stroke-linejoin="round"/>`;
      if (it.t === 'pl') return `<path d="${pathD(it.p, false)}" fill="none"${st} stroke-linejoin="round"/>`;
      if (it.t === 'segs') return it.s.length ? `<path d="${segsD(it.s)}" fill="none"${st}/>` : '';
      if (it.t === 'text') {
        const an = it.anchor === 'middle' ? 'middle' : it.anchor === 'end' ? 'end' : 'start';
        return `<text x="${f3(it.x)}" y="${f3(it.y)}" font-size="${f3(it.size * u)}" font-family="Helvetica,Arial,sans-serif"${it.bold ? ' font-weight="700"' : ''} text-anchor="${an}" fill="${it.fill}"${it.ang ? ` transform="rotate(${f3(it.ang)} ${f3(it.x)} ${f3(it.y)})"` : ''}>${esc(it.s)}</text>`;
      }
      return '';
    })
    .join('');
}
