// Renders every preset of every building type and scenery category; exits 1 on any page error.
const { openApp } = require('./harness');
(async () => {
  const { page, errors, close } = await openApp();
  const types = await page.$$eval('[data-set="type"] button', bs => bs.map(b => b.dataset.v));
  let count = 0, failed = 0;
  for (const type of types) {
    await page.click(`[data-set="type"] button[data-v="${type}"]`);
    await page.waitForTimeout(200);
    const cats = type === 'scenery' ? await page.$$eval('[data-set="scCat"] button', bs => bs.map(b => b.dataset.v)) : [null];
    for (const cat of cats) {
      if (cat) { await page.click(`[data-set="scCat"] button[data-v="${cat}"]`); await page.waitForTimeout(200); }
      const n = await page.$$eval('#presets .chip', c => c.length);
      for (let i = 0; i < n; i++) {
        const chips = await page.$$('#presets .chip');
        const name = await chips[i].textContent();
        const before = errors.length;
        await chips[i].click();
        await page.waitForTimeout(350);
        const ok = errors.length === before;
        count++; if (!ok) failed++;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${type}${cat ? '/' + cat : ''} · ${name.trim()}${ok ? '' : ' → ' + errors.slice(before).join(' | ')}`);
      }
    }
  }
  console.log(`\n${count} presets, ${failed} failed`);
  await close();
  process.exit(failed ? 1 : 0);
})();
