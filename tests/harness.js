// Opens the app in headless Chromium. Three.js and pdf-lib are served from node_modules,
// so tests run offline. TARGET=dist tests the bundled build instead of the source modules.
const { chromium } = require('playwright');
const path = require('path');
const { serve } = require('../scripts/serve');

const ROOT = path.join(__dirname, '..');

async function openApp() {
  const dir = process.env.TARGET === 'dist' ? path.join(ROOT, 'dist') : ROOT;
  const server = await serve(dir, 0);
  const url = `http://localhost:${server.address().port}/`;
  const opts = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] };
  if (process.env.CHROMIUM_PATH) opts.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/three.min.js', r => r.fulfill({ path: require.resolve('three/build/three.min.js'), contentType: 'text/javascript' }));
  await page.route('**/pdf-lib.min.js', r => r.fulfill({ path: require.resolve('pdf-lib/dist/pdf-lib.min.js'), contentType: 'text/javascript' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.goto(url);
  await page.waitForSelector('.cat-card');
  await page.click('[data-view="design"]');
  const close = async () => { await browser.close(); server.close(); };
  return { browser, page, errors, close };
}
module.exports = { openApp, ROOT };
