/**
 * The way out of a result screen, by context (C-19, D-343): each end screen offers the exits that
 * are right at that moment, with the same words and in the same place, after its main actions.
 *   hoy    → back to One a Day (the header's ‹ Menu is the way to the menu; the card already offers
 *            play another / replay)
 *   podio  → the main menu: the Cup is over
 *   suelto → the main menu (play again is the game's own main action)
 *   lab    → the lab, for a game played from /labs/ (C-19: "or to the lab")
 * A Cup day has no exit here: its only way out is back to the board, the Cup's home.
 *
 * Under the exits of a game played on its own (`suelto`, `lab`), behind the lab flag
 * `solo-result-today-card` (#1597): one cyan line to today's Uno al día game, for whoever has not
 * played it yet (`todayLine` in uno-al-dia-ui.js). Never on a cover (`portada`), in Uno al día
 * (`?today`, or the `hoy` context) or in La Copa (a Cup day has no exits here; the podium is `podio`).
 * lab: #seccion-solo-result-today-card
 */
import { el } from './ui.js';
import { COMMON } from './i18n.js';
import { tiene } from './parametros.js';

export const SALIDAS = Object.freeze({ hoy: ['hoy'], podio: ['menu'], suelto: ['menu'], lab: ['lab'] });

/** The contexts whose result offers today's Uno al día game (#1597): a game played on its own. */
export const WITH_TODAY = Object.freeze(['suelto', 'lab']);
/** Whether these exits may carry the Uno al día line: a result (not a cover) of a game on its own, not in `?today`. Pure, for node. */
export const offersToday = (contexto, { portada = false, search = globalThis.location?.search || '' } = {}) =>
  !portada && WITH_TODAY.includes(contexto) && !tiene('today', search);

/**
 * The row of exits for `contexto`, as links; `raiz` is the site root seen from the page. A cover that
 * borrows them passes `portada: true`: what follows a result is not offered before playing.
 */
export function salidasFin(contexto, { lang = 'es', raiz = '../', portada = false } = {}) {
  const C = COMMON[lang] || COMMON.es;
  const destino = { hoy: [`${raiz}today/`, C.uad.verTodo], menu: [raiz || './', C.volverMenu], lab: [`${raiz}labs/`, C.volverLab] };
  const lista = SALIDAS[contexto];
  // A single exit goes full width; several share a row
  const caja = el('div', { class: lista.length > 1 ? 'btn-row fin-salidas' : 'stack fin-salidas', id: 'fin-salidas' },
    lista.map(k => el('a', { class: 'btn btn--ghost btn--sm', id: `btn-fin-${k}`, href: destino[k][0] }, destino[k][1])));
  if (offersToday(contexto, { portada })) addTodayLine(caja, { lang, raiz });
  return caja;
}

/** Puts the Uno al día line under the exits once the flag answers; its modules load only then. */
async function addTodayLine(caja, { lang, raiz }) {
  try {
    const { flag } = await import('./flags.js');
    if (!(await flag('solo-result-today-card'))) return;
    const { todayLine } = await import('./uno-al-dia-ui.js');
    const linea = todayLine({ lang, raiz });
    if (linea && !caja.querySelector('.uad-fin')) caja.append(linea);
  } catch (_) { /* without it the result is as always */ }
}
