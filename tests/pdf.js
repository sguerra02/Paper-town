// Exports a PDF for a few presets and checks that each one has pages.
const { openApp } = require('./harness');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const CASES = [['house', 'Lake house'], ['house', 'Haunted house'], ['road', 'Roadside diner'], ['castle', null]];
(async () => {
  const { page, errors, close } = await openApp();
  const out = path.join(__dirname, '..', 'test-output');
  fs.mkdirSync(out, { recursive: true });
  let failed = 0;
  for (const [type, name] of CASES) {
    await page.click(`[data-set="type"] button[data-v="${type}"]`);
    await page.waitForTimeout(200);
    if (name) await page.click(`#presets .chip:text-is("${name}")`);
    await page.waitForTimeout(800);
    await page.evaluate(() => { window.__pdf = null; window.claude = { use: async () => ({ save: async ({ data }) => { window.__pdf = Array.from(new Uint8Array(await data.arrayBuffer())); return { status: 'saved' }; } }) }; });
    await page.click('#dl');
    await page.waitForFunction(() => window.__pdf, null, { timeout: 30000 });
    const bytes = Buffer.from(await page.evaluate(() => window.__pdf));
    const doc = await PDFDocument.load(bytes);
    const file = path.join(out, `${type}-${(name || 'default').toLowerCase().replace(/\W+/g, '-')}.pdf`);
    fs.writeFileSync(file, bytes);
    const ok = doc.getPageCount() > 0;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${type} · ${name || 'first preset'} → ${doc.getPageCount()} pages (${path.relative(process.cwd(), file)})`);
  }
  if (errors.length) { failed++; console.log('Page errors:', errors); }
  await close();
  process.exit(failed ? 1 : 0);
})();
