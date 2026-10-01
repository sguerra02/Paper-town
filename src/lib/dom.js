/* Small DOM helpers: element lookup, escaping, the status line and file saving. */

export const $ = s => document.querySelector(s);

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function status(m) {
  $('#status').textContent = m;
}

export async function saveFile(name, blob, label) {
  const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
  if (dl) {
    try {
      await dl.save({ filename: name, data: blob });
      status(label + ' saved.');
    } catch (err) {
      const code = err && err.code;
      status(
        code === 'declined'
          ? 'Download cancelled.'
          : code === 'rate_limited'
            ? 'A download prompt is already open.'
            : 'The file could not be saved here.'
      );
    }
    return;
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    status(label + ' downloaded.');
  } catch (e) {
    status('Downloads are not available in this view.');
  }
}
