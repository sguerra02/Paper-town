/* Entry point: wires up the interface, builds the first model and opens the catalog. */

import { render } from './app.js';
import { initPdf } from './print/pdf.js';
import { initCatalog, showView } from './ui/catalog.js';
import { initControls, syncControls } from './ui/controls.js';
import { initDesignFile } from './ui/design-file.js';
import { initEditor } from './ui/editor.js';
import { initFootprint } from './ui/footprint.js';

initPdf();
initControls();
initEditor();
initFootprint(render);
initDesignFile();
initCatalog();

syncControls();
render();
showView(location.hash === '#design' ? 'design' : 'catalog');
