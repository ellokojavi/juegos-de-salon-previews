/**
 * El globo de la portada que invita a agregar Juegos de Salón a la pantalla de inicio (D-232), y la
 * hoja con los pasos de cada celular. Los textos van en `COMMON[lang].ins` (i18n.js).
 *
 * - Sale solo en un celular (iPhone o Android) que todavía no abre la app instalada.
 * - La ✕ lo apaga para siempre en ese navegador, igual que "Ya la agregué" o instalarla.
 * - En Android, si Chrome ofrece su propio dialogo de instalar (`beforeinstallprompt`), "Agregar"
 *   abre ese dialogo; si no, la hoja con los pasos del menú.
 * - Dentro de WhatsApp, Instagram u otra app no se puede agregar a inicio: la hoja pide abrir el
 *   link en Safari o en Chrome.
 *
 * Behind the flag `install-invite` (lab: #seccion-install-invite), the new invitation: "Instala Juegos
 * de Salón" with an iridescent card; the ✕ only snoozes it (14 days, then 60); it waits until this
 * phone finished a game; a moment after a game ends it invites from the top (once a week at most);
 * the steps draw Safari's own buttons and an arrow points at the toolbar; and the home footer keeps a
 * "📲 Instalar la app" tile for whoever closed it.
 */
import { el } from './ui.js';

/** La marca de "no mostrar más": la ✕, "Ya la agregué" o la app ya instalada. */
export const INSTALAR_NO_KEY = 'juegos-de-salon:instalar:no';

export const descartado = (storage = globalThis.localStorage) => { try { return storage.getItem(INSTALAR_NO_KEY) === '1'; } catch (_) { return false; } };
export function descartar(si = true, storage = globalThis.localStorage) {
  try { if (si) storage.setItem(INSTALAR_NO_KEY, '1'); else storage.removeItem(INSTALAR_NO_KEY); } catch (_) { /* sin memoria: vuelve a salir */ }
}

/** The snooze of the new ✕ (flag install-invite): { until, n }. The first ✕ waits 14 days, the next 60. */
export const LUEGO_KEY = 'juegos-de-salon:instalar:luego';
/** When the after-game invitation last showed (ms): once a week at most. */
export const TRAS_KEY = 'juegos-de-salon:instalar:tras';
const DIA = 864e5;
export const ESPERAS = [14, 60];
const leer = (storage, k) => { try { return JSON.parse(storage.getItem(k) || 'null'); } catch (_) { return null; } };
export function pospuesto(now = Date.now(), storage = globalThis.localStorage) {
  const v = leer(storage, LUEGO_KEY);
  return !!(v && Number(v.until) > now);
}
export function posponer(now = Date.now(), storage = globalThis.localStorage) {
  const n = Number(leer(storage, LUEGO_KEY)?.n) || 0;
  const dias = ESPERAS[Math.min(n, ESPERAS.length - 1)];
  try { storage.setItem(LUEGO_KEY, JSON.stringify({ until: now + dias * DIA, n: n + 1 })); } catch (_) { /* no memory */ }
  return dias;
}
/** Whether the after-game invitation may show now: a phone that can install, not installed, not snoozed, not in the last 7 days. */
export function puedeInvitarTras({ now = Date.now(), storage = globalThis.localStorage, pasos = pasosDe() } = {}) {
  if (!pasos || descartado(storage) || pospuesto(now, storage)) return false;
  return !(Number(leer(storage, TRAS_KEY)) > now - 7 * DIA);
}
/** iOS 26 moved Share inside ⋯ at the bottom right; before, Share is in the middle of the bar. */
export const iosNuevo = (ua = globalThis.navigator?.userAgent || '') => { const m = /OS (\d+)_/.exec(ua); return !!m && Number(m[1]) >= 26; };

/** Las apps que abren los links con su propio navegador, donde no se puede agregar a inicio. */
const OTRA_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Messenger|TikTok|Snapchat|Twitter|LinkedInApp|GSA\/|; wv\)/;

/**
 * Qué pasos le tocan a este celular, o null si el globo no va:
 *   'ios-safari' · 'ios-chrome' · 'android' (Chrome y los que usan su menú ⋮) · 'samsung' ·
 *   'otra-app-ios' · 'otra-app-android'
 * Un computador, un iPhone con otro navegador (Firefox, Edge) o la app ya instalada: null.
 */
export function pasosDe({ nav = globalThis.navigator, win = globalThis.window } = {}) {
  const ua = String(nav?.userAgent || '');
  // El iPad con iPadOS se presenta como Mac: se reconoce por la pantalla táctil
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints || 0) > 1);
  const android = /Android/.test(ua);
  if (!ios && !android) return null;
  if (nav?.standalone || win?.matchMedia?.('(display-mode: standalone)')?.matches) return null;
  if (OTRA_APP.test(ua)) return ios ? 'otra-app-ios' : 'otra-app-android';
  if (ios) {
    if (/CriOS/.test(ua)) return 'ios-chrome';
    if (/FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)) return null;
    return 'ios-safari';
  }
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  return 'android';
}

/** Los pasos de cada celular: [texto, ícono, nota?] con las claves de `T.ins`. */
const PASOS = {
  'ios-safari': [['iosShare', '⬆️', 'iosShareNote'], ['iosAdd', '+'], ['iosConfirm', '✅']],
  'ios-chrome': [['chromeIosShare', '⬆️'], ['iosAdd', '+'], ['iosConfirm', '✅']],
  android: [['androidMenu', '⋮'], ['androidAdd', '📲'], ['androidConfirm', '✅']],
  samsung: [['samsungMenu', '☰'], ['samsungAdd', '📲'], ['samsungConfirm', '✅']],
};

/** "Toca **Compartir**" → nodos con negritas. */
const conNegritas = texto => String(texto).split(/\*\*(.+?)\*\*/).map((t, i) => (i % 2 ? el('b', {}, t) : t));

/** Safari's Share glyph (a square with an arrow up), drawn so the step looks like the button to tap. */
const SVG = 'http://www.w3.org/2000/svg';
function glifoCompartir(doc) {
  const svg = doc.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '22'); svg.setAttribute('height', '22'); svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M12 3v12', 'M7.5 7.5 12 3l4.5 4.5', 'M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16']) {
    const p = doc.createElementNS(SVG, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
  }
  return svg;
}

// Chrome's own dialog on Android, kept from the moment the page loads: "Instalar" opens it
let dialogo = null;
const alInstalar = new Set();
if (typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('beforeinstallprompt', e => { e.preventDefault(); dialogo = e; });
  globalThis.addEventListener('appinstalled', () => { descartar(); for (const f of alInstalar) f(); });
}

/**
 * What installs: opens Chrome's dialog where there is one, else the sheet with the steps of this
 * phone (or "open the link in Safari" inside another app). Shared by the bubble, the footer tile and
 * the after-game invitation. `nuevo`: the install-invite look and texts (T.ins2 over T.ins).
 */
export function instalador({ T, url: enlace = '.', tap = () => {}, nuevo = false, alListo = () => {}, doc = globalThis.document, nav = globalThis.navigator, win = globalThis.window } = {}) {
  const t = nuevo ? { ...T.ins, ...T.ins2 } : T.ins;
  const pasos = pasosDe({ nav, win });
  let hojaAbierta = null;
  function cerrarHoja() { hojaAbierta?.remove(); hojaAbierta = null; }
  alInstalar.add(() => { alListo(); cerrarHoja(); });
  const botonCerrar = (texto = t.close) => el('button', { class: 'btn btn--ghost', type: 'button', onClick: () => { tap(); cerrarHoja(); } }, texto);

  function hoja(id, ...hijos) {
    cerrarHoja();
    const panel = el('div', { class: `hoja${nuevo ? ' hoja--tornasol' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${id}-titulo`, id },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), ...hijos);
    hojaAbierta = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: cerrarHoja }), panel);
    doc.body.append(hojaAbierta);
    panel.querySelector('button')?.focus();
    return panel;
  }

  /** The new steps on iPhone draw the very button to tap: Safari's ⋯ or Share, the "+" of the list, the blue Add. */
  function pasosNuevos() {
    if (pasos !== 'ios-safari' && pasos !== 'ios-chrome') return null;
    const nuevoIos = pasos === 'ios-safari' && iosNuevo(nav?.userAgent);
    const primero = pasos === 'ios-chrome' ? ['chromeIosShare', glifoCompartir(doc)] : nuevoIos ? ['ios26More', '⋯'] : ['iosShare', glifoCompartir(doc)];
    return [primero, ['iosAdd', el('span', { class: 'glifo-mas' }, '+')], ['iosConfirm', el('span', { class: 'glifo-agregar' }, t.iosAddBtn)]];
  }

  function hojaPasos() {
    const paso = (n, [texto, icono, nota]) => el('div', { class: 'hoja-paso' },
      el('span', { class: 'hoja-num' }, String(n)),
      el('div', {}, el('p', {}, ...conNegritas(t[texto])), nota && !nuevo ? el('small', { class: 'muted' }, t[nota]) : null),
      el('span', { class: 'hoja-icono', 'aria-hidden': 'true' }, icono));
    const despues = el('p', { class: 'hoja-caja', hidden: true }, t.doneNext);
    const ya = el('button', { class: 'btn btn--yellow', type: 'button', id: 'btn-ya-agregue', onClick: () => {
      tap(); descartar(); alListo(); despues.hidden = false; ya.remove(); flecha?.remove();
    } }, t.done);
    const lista = (nuevo && pasosNuevos()) || PASOS[pasos];
    // On iPhone with Safari the steps start at its toolbar, below the page: an arrow points at it
    const flecha = nuevo && pasos === 'ios-safari'
      ? el('div', { class: `instalar-flecha${iosNuevo(nav?.userAgent) ? ' instalar-flecha--derecha' : ''}`, 'aria-hidden': 'true' }, el('span', {}, t.arrow), el('b', {}, '↓'))
      : null;
    const panel = hoja('hoja-agregar',
      el('h2', { id: 'hoja-agregar-titulo' }, t.sheetTitle),
      nuevo ? el('p', { class: 'muted hoja-lead' }, t.sheetLead) : null,
      ...lista.map((p, i) => paso(i + 1, p)),
      despues,
      el('div', { class: 'btn-row' }, ya, botonCerrar()));
    if (flecha) { panel.classList.add('hoja--flecha'); panel.parentNode.append(flecha); }
  }

  function hojaOtraApp() {
    const url = new URL(enlace, doc.baseURI).href;
    hoja('hoja-otra-app-portada',
      el('h2', { id: 'hoja-otra-app-portada-titulo' }, pasos === 'otra-app-ios' ? t.otherTitleIos : t.otherTitleAndroid),
      el('p', { class: 'muted' }, ...conNegritas(pasos === 'otra-app-ios' ? t.otherLeadIos : t.otherLeadAndroid)),
      el('p', { class: 'hoja-link' }, url.replace(/^https?:\/\//, '')),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn btn--yellow', type: 'button', onClick: async ev => {
          tap();
          const b = ev.currentTarget;
          try { await nav.clipboard.writeText(url); b.textContent = t.copied; } catch (_) { b.textContent = url; }
        } }, t.copy),
        botonCerrar()));
  }

  async function agregar() {
    tap();
    if (dialogo) {
      const d = dialogo; dialogo = null;
      try {
        await d.prompt();
        const { outcome } = await d.userChoice;
        if (outcome === 'accepted') { descartar(); alListo(); }
        return;
      } catch (_) { /* si falla, los pasos */ }
    }
    if (!pasos) return;
    if (pasos.startsWith('otra-app')) hojaOtraApp(); else hojaPasos();
  }
  return { agregar, cerrarHoja, pasos };
}

/**
 * Pone el globo en la portada, si le toca a este celular.
 * @param {object} o
 * @param {object} o.T   los textos comunes del idioma de quien mira (COMMON[lang])
 * @param {string} o.url  la portada en ese idioma (homeUrl), la que se copia para abrirla en el navegador
 * @param {() => void} [o.tap]  el sonido del toque
 * @param {number} [o.espera]  cuánto espera antes de salir, para no tapar la portada al llegar
 * @param {boolean} [o.nuevo]  the install-invite look and its ✕ that snoozes (flag install-invite)
 * @param {boolean} [o.tras]  the after-game invitation: from the top, says "Enjoyed it?", goes by itself
 */
export function globoInstalar({ T, url = '.', tap = () => {}, espera = 2500, nuevo = false, tras = false, doc = globalThis.document, nav = globalThis.navigator, win = globalThis.window } = {}) {
  const t = nuevo ? { ...T.ins, ...T.ins2 } : T.ins;
  let globo = null;
  function quitar() {
    if (!globo) return;
    const g = globo; globo = null;
    g.classList.add('fuera');
    setTimeout(() => g.remove(), 300);
  }
  const ins = instalador({ T, url, tap, nuevo, alListo: quitar, doc, nav, win });
  if (!ins.pasos || descartado() || (nuevo && pospuesto())) return null;

  setTimeout(() => {
    if (descartado() || doc.getElementById('globo-instalar')) return;
    const clase = `globo-instalar${nuevo ? ' globo-instalar--tornasol' : ''}${tras ? ' globo-instalar--arriba' : ''}`;
    globo = el('aside', { class: clase, id: 'globo-instalar', 'data-pasos': ins.pasos, 'aria-label': t.sheetTitle },
      el('span', { class: 'globo-marco' }, el('img', { class: 'globo-icono', src: new URL('../icons/apple-touch-icon.png', import.meta.url).href, alt: '', width: 48, height: 48 })),
      el('div', { class: 'globo-texto' }, el('b', {}, t.title), el('span', {}, tras ? t.subTras : t.sub)),
      el('button', { class: 'btn btn--yellow btn--sm globo-agregar', type: 'button', id: 'btn-globo-agregar', onClick: ins.agregar }, t.add),
      el('button', { class: 'globo-cerrar', type: 'button', id: 'btn-globo-cerrar', 'aria-label': nuevo ? t.later : t.dismiss, title: nuevo ? t.later : t.dismiss,
        onClick: () => { tap(); if (nuevo) posponer(); else descartar(); quitar(); } }, '✕'));
    doc.body.append(globo);
    // The after-game invitation does not stay over the end screen: it goes by itself, without snoozing
    if (tras) setTimeout(() => { if (!doc.querySelector('.hoja-capa')) quitar(); }, 12000);
  }, espera);

  return { agregar: ins.agregar, quitar };
}

/**
 * A moment after a game ends (stats.js' trackFinish, every game, C-21), behind flag install-invite:
 * the bubble from the top, once a week at most, on a phone that can install and has not snoozed it.
 */
export async function invitarTrasPartida({ now = Date.now(), storage = globalThis.localStorage } = {}) {
  if (!puedeInvitarTras({ now, storage })) return false;
  const [{ flag }, { COMMON, getLang, homeUrl }] = await Promise.all([import('./flags.js'), import('./i18n.js')]);
  if (!(await flag('install-invite'))) return false;
  const lang = getLang();
  try { storage.setItem(TRAS_KEY, String(now)); } catch (_) { /* no memory */ }
  return !!globoInstalar({ T: COMMON[lang], url: homeUrl(lang), nuevo: true, tras: true, espera: 1800 });
}
