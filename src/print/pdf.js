/* Writes the sheets to a PDF at exact size (72 pt per inch). */
import { current } from '../app.js';
import { S } from '../config/state.js';
import { $, saveFile, status } from '../lib/dom.js';
import { pathD, segsD } from '../lib/draw.js';
import { hexRgb } from '../lib/math.js';

export async function exportPDF() {
  if (!window.PDFLib) {
    status('The PDF library did not load. Reload the page and try again.');
    return;
  }
  const btn = $('#dl');
  btn.disabled = true;
  status('Building PDF…');
  try {
    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
    const c = current;
    const doc = await PDFDocument.create();
    doc.setTitle(`Gable & Crease ${S.width}x${S.depth} ft at 1:${c.den}`);
    doc.setCreator('Gable & Crease');
    const font = await doc.embedFont(StandardFonts.Helvetica),
      bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const col = h => {
      const [r, g, b] = hexRgb(h.slice(0, 7));
      return rgb(r, g, b);
    };
    const pw = c.sz.w * 72,
      ph = c.sz.h * 72,
      P = v => v * 72,
      sc = p => p.map(q => [P(q[0]), P(q[1])]);
    c.pagesItems.forEach(items => {
      const page = doc.addPage([pw, ph]);
      items.forEach(it => {
        if (it.t === 'text') {
          const fnt = it.bold ? bold : font;
          const wd = fnt.widthOfTextAtSize(it.s, it.size);
          const off = it.anchor === 'middle' ? -wd / 2 : it.anchor === 'end' ? -wd : 0;
          const a = (it.ang * Math.PI) / 180;
          const x = P(it.x) + off * Math.cos(a),
            y = P(it.y) + off * Math.sin(a);
          page.drawText(it.s, {
            x,
            y: ph - y,
            size: it.size,
            font: fnt,
            color: col(it.fill),
            rotate: degrees(-it.ang)
          });
          return;
        }
        let d;
        if (it.t === 'poly') d = pathD(sc(it.p), true);
        else if (it.t === 'pl') d = pathD(sc(it.p), false);
        else if (it.t === 'segs') {
          if (!it.s.length) return;
          d = segsD(
            it.s.map(([a, b]) => [
              [P(a[0]), P(a[1])],
              [P(b[0]), P(b[1])]
            ])
          );
        } else return;
        const o = { x: 0, y: ph };
        if (it.fill && it.t === 'poly') {
          o.color = col(it.fill);
          if (it.fill.length === 9) o.opacity = parseInt(it.fill.slice(7), 16) / 255;
        }
        if (it.stroke) {
          o.borderColor = col(it.stroke);
          o.borderWidth = it.w;
          if (it.dash) o.borderDashArray = it.dash;
        }
        if (!o.color && !o.borderColor) return;
        page.drawSvgPath(d, o);
      });
    });
    const bytes = await doc.save();
    const name = `gable-crease-${S.type}-${S.width}x${S.depth}ft-1-${c.den}-${S.paper}.pdf`;
    await saveFile(name, new Blob([bytes], { type: 'application/pdf' }), 'PDF');
  } catch (err) {
    console.error(err);
    status('Something went wrong building the PDF.');
  } finally {
    btn.disabled = false;
  }
}

/** Wires up this module's event listeners. Called once from main.js. */
export function initPdf() {
  $('#dl').addEventListener('click', exportPDF);
}
