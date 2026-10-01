/* Saving and opening design files (.json). */
import { render } from '../app.js';
import { EDIT, S } from '../config/state.js';
import { $, saveFile, status } from '../lib/dom.js';
import { syncControls } from './controls.js';

/** Wires up this module's event listeners. Called once from main.js. */
export function initDesignFile() {
  $('#saveDesign').addEventListener('click', () => {
    const data = { app: 'gable-crease', version: 1, saved: new Date().toISOString(), settings: S };
    saveFile(
      `gable-crease-${S.type}-design.json`,
      new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }),
      'Design'
    );
  });
  $('#openDesign').addEventListener('click', () => $('#designFile').click());
  $('#designFile').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || d.app !== 'gable-crease' || !d.settings) throw new Error('bad');
        Object.assign(S, d.settings);
        S.custom = S.custom || {};
        EDIT.key = null;
        syncControls();
        render();
        status('Design opened.');
      } catch (err) {
        status('That file is not a Gable & Crease design.');
      }
    };
    r.readAsText(file);
    e.target.value = '';
  });
}
