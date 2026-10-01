// Bundles src/ and css/ into one self-contained dist/index.html.
// That single file is what GitHub Pages serves, and it also opens straight from disk.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const { outputFiles } = await build({
  entryPoints: [join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false
});
const js = outputFiles[0].text;

// Inline every local stylesheet in the order index.html lists them.
const css = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)"\s*\/?>/g)]
  .map(m => readFileSync(join(root, m[1]), 'utf8'))
  .join('\n');

const out = html
  .replace(/\s*<link rel="stylesheet" href="css\/[^"]+"\s*\/?>/g, '')
  .replace('</head>', `<style>\n${css}</style>\n</head>`)
  .replace(/<script type="module" src="src\/main.js"><\/script>/, () => `<script>\n${js}</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), out);
console.log(`dist/index.html  ${(out.length / 1024).toFixed(0)} KB`);
