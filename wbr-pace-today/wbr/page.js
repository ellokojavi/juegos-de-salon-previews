/**
 * The public page of a shared WBR (/wbr/?id=…): the owner's 🔗 Share in the panel froze one week's WBR in
 * `wbrShared/<id>`; this page reads it over REST (no sign-in, no SDK) and draws it with the panel's own
 * code (`panel/wbr-view.js`), so both look the same. A link the owner stopped sharing says so.
 */
import { el } from '../assets/js/ui.js';
import { param, tiene } from '../assets/js/parametros.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { wbrBody } from '../panel/wbr-view.js';

const vista = document.getElementById('vista');
const aviso = texto => vista.replaceChildren(el('h2', { class: 'display display--md' }, '📋 WBR'), el('p', { class: 'empty' }, texto));
const cuando = ts => new Date(ts).toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles' });

/** Draws one snapshot: what `wbrShared/<id>` holds, its JSON already read. */
function dibujar(s) {
  document.title = `${s.titulo.replace(/^📋 /, '')} 📋 · Juegos de Salón`;
  vista.replaceChildren(
    el('h2', { class: 'display display--md' }, s.titulo),
    el('p', { class: 'muted small' }, `As it read on ${cuando(s.at)}, Pacific time. ${s.nota}`),
    ...wbrBody(s.t, s.destacados || []));
}
// The end-to-end script draws a snapshot of its own (tools/e2e/wbr/shared.mjs), as the panel's __panel.seed
window.__wbr = { draw: s => dibujar(s), gone: () => aviso('This WBR is not shared anymore.') };

async function abrir() {
  if (tiene('test')) return;
  const id = param('id');
  if (!id || !/^[A-Za-z0-9_-]{22}$/.test(id)) return aviso('This link is incomplete: ask for it again.');
  let rec;
  try {
    const r = await fetch(`${firebaseConfig.databaseURL}/wbrShared/${id}.json`);
    rec = r.ok ? await r.json() : null;
  } catch { return aviso('Could not load it: check the connection and reload.'); }
  if (!rec?.json) return aviso('This WBR is not shared anymore.');
  dibujar(JSON.parse(rec.json));
}
abrir();
