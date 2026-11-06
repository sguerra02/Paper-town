/* A color picker of our own for the swatches, so every device gets the same full picker: a
   saturation/brightness square, a hue slider, a hex field and a row of handy building colors.
   (The phone's built-in picker can be just a short list of colors.) It writes the color into the
   swatch's <input type="color"> and fires its input event, so the rest of the app is unchanged. */

const PALETTE = [
  '#f4f1ea',
  '#e9e4d6',
  '#d8d2c4',
  '#c9ced0',
  '#9aa0a4',
  '#55595c',
  '#34363a',
  '#1d1b19',
  '#9b2f22',
  '#b3352b',
  '#9a5a3c',
  '#c98f6a',
  '#d8a560',
  '#e8c33a',
  '#f3c13a',
  '#c25a3a',
  '#2f5a3a',
  '#6f8a6a',
  '#5a6f4a',
  '#2f6b4f',
  '#2a4a7a',
  '#2a6a9a',
  '#5aa0c8',
  '#e4577a'
];

const clamp01 = v => Math.max(0, Math.min(1, v));
const hex2 = v =>
  Math.round(v * 255)
    .toString(16)
    .padStart(2, '0');

function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  const n = m ? parseInt(m[1], 16) : 0;
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const mx = Math.max(r, g, b),
    d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: mx ? d / mx : 0, v: mx };
}

function hsvToHex({ h, s, v }) {
  const f = k => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  return '#' + hex2(f(5)) + hex2(f(3)) + hex2(f(1));
}

/* "#abc", "abc", "aabbcc" and "#AABBCC" all become "#aabbcc"; anything else is null */
function normHex(s) {
  let t = String(s || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();
  if (/^[0-9a-f]{3}$/.test(t)) t = t.replace(/./g, ch => ch + ch);
  return /^[0-9a-f]{6}$/.test(t) ? '#' + t : null;
}

let pop, sv, knob, hue, hexIn, prev, title, target, hsv;

function build() {
  pop = document.createElement('div');
  pop.className = 'cpick';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.innerHTML = `
    <div class="cpick-head"><strong class="cpick-title"></strong>
      <button type="button" class="cpick-done">Done</button></div>
    <div class="cpick-sv" aria-label="Saturation and brightness"><span class="cpick-knob"></span></div>
    <input class="cpick-hue" type="range" min="0" max="359" step="1" aria-label="Hue" />
    <div class="cpick-row"><span class="cpick-prev"></span>
      <label class="cpick-hexwrap">Hex <input class="cpick-hex" type="text" inputmode="text" maxlength="7"
        spellcheck="false" autocomplete="off" /></label></div>
    <div class="cpick-pal">${PALETTE.map(c => `<button type="button" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>`;
  document.body.appendChild(pop);
  sv = pop.querySelector('.cpick-sv');
  knob = pop.querySelector('.cpick-knob');
  hue = pop.querySelector('.cpick-hue');
  hexIn = pop.querySelector('.cpick-hex');
  prev = pop.querySelector('.cpick-prev');
  title = pop.querySelector('.cpick-title');

  const fromSv = e => {
    const r = sv.getBoundingClientRect();
    hsv.s = clamp01((e.clientX - r.left) / r.width);
    hsv.v = 1 - clamp01((e.clientY - r.top) / r.height);
    apply(true);
  };
  sv.addEventListener('pointerdown', e => {
    sv.setPointerCapture(e.pointerId);
    fromSv(e);
  });
  sv.addEventListener('pointermove', e => {
    if (sv.hasPointerCapture(e.pointerId)) fromSv(e);
  });
  hue.addEventListener('input', () => {
    hsv.h = +hue.value;
    apply(true);
  });
  hexIn.addEventListener('input', () => {
    const h = normHex(hexIn.value);
    if (!h) return;
    hsv = hexToHsv(h);
    apply(false);
  });
  hexIn.addEventListener('blur', () => (hexIn.value = target ? target.value : hexIn.value));
  pop.querySelector('.cpick-pal').addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    hsv = hexToHsv(b.dataset.c);
    apply(true);
  });
  pop.querySelector('.cpick-done').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !pop.hidden) close();
  });
  document.addEventListener('pointerdown', e => {
    if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.sw')) close();
  });
  window.addEventListener('resize', () => !pop.hidden && place());
}

/* show the current color in the picker and, when asked, write it to the swatch */
function apply(writeHex) {
  const h = hsvToHex(hsv);
  sv.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h} 100% 50%)`;
  knob.style.left = hsv.s * 100 + '%';
  knob.style.top = (1 - hsv.v) * 100 + '%';
  knob.style.background = h;
  hue.value = Math.round(hsv.h);
  prev.style.background = h;
  if (writeHex) hexIn.value = h;
  if (target && target.value !== h) {
    target.value = h;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/* under the swatch on a wide screen, a sheet along the bottom on a phone */
function place() {
  const phone = window.innerWidth < 640;
  pop.classList.toggle('sheet', phone);
  if (phone) {
    pop.style.left = pop.style.top = '';
    return;
  }
  const r = target.getBoundingClientRect(),
    pw = pop.offsetWidth,
    ph = pop.offsetHeight;
  let x = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
  let y = r.bottom + 8;
  if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 8);
  pop.style.left = x + 'px';
  pop.style.top = y + 'px';
}

function open(input) {
  if (!pop) build();
  target = input;
  hsv = hexToHsv(input.value);
  const lbl = input.closest('.sw');
  title.textContent = (lbl ? lbl.textContent.trim() : 'Color') + ' color';
  hexIn.value = input.value;
  pop.hidden = false;
  apply(false);
  place();
}

function close() {
  if (!pop) return;
  pop.hidden = true;
  if (target) target.dispatchEvent(new Event('change', { bubbles: true }));
  target = null;
}

/** Wires up this module's event listeners. Called once from main.js. */
export function initColorPicker() {
  /* catch the click before the browser opens its own picker */
  document.addEventListener(
    'click',
    e => {
      const sw = e.target.closest('.sw');
      if (!sw) return;
      const input = sw.querySelector('input[type="color"]');
      if (!input) return;
      e.preventDefault();
      if (pop && !pop.hidden && target === input) close();
      else open(input);
    },
    true
  );
}
