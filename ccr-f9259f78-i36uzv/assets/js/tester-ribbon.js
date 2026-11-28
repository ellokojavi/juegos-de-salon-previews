/**
 * The tester ribbon (lab flag `tester-ribbon`): for lab key holders, a folded tab with a «T» on the
 * screen's right edge, just under the top bar, over the page and never pushing it. Opened, it gives
 * what the key gives: (i) the tester sheet, a link to Labs, and the control the current screen
 * registers with `setTesterContext` (Babel's «Simular final»), and while the flag `offline` is on, a
 * switch that forces offline mode on this phone (connection.js), so testing it needs no airplane mode. It replaces the home page's «tester»
 * chip and Babel's 🧪 tab on the left edge. (ii) A switch for every lab flag this page asked (D-567), to try
 * the page with and without it, on this phone only; a launched flag has none.
 * Two views (D-592): «Testing now» shows only the rows the tester pinned (📌) and any row out of its normal
 * state (a flag turned off, offline mode forced), with the screen's control; «Experiments» lists every row,
 * each with its 📌 and its switch. Hiding a row never changes it. On every screen (tester-boot.js), hidden while playing. Texts in the three languages (C-3). lab: #seccion-tester-ribbon
 */
import { el } from './ui.js';
import { openTesterSheet } from './tester-badge.js';

const T = {
  es: { tab: 'Tester', info: 'Qué es ser tester', labs: 'Ir a Labs', offline: '📴 Modo sin conexión', offlineHint: 'Con los estados de la nube', flagsHint: 'Solo en este celular; la página se recarga',
    now: 'Probando ahora', all: 'Experimentos', back: 'Probando ahora', pin: 'Fijar en Probando ahora', markOff: 'Apagado', markOn: 'Encendido',
    hint: '📌 deja el experimento en Probando ahora. Lo que no fijas sigue igual, solo se esconde.', empty: 'Nada fijado todavía. Elige en Experimentos qué estás probando.' },
  en: { tab: 'Tester', info: 'What being a tester means', labs: 'Go to Labs', offline: '📴 Offline mode', offlineHint: 'With the cloud states', flagsHint: 'On this phone only; the page reloads',
    now: 'Testing now', all: 'Experiments', back: 'Testing now', pin: 'Pin to Testing now', markOff: 'Off', markOn: 'On',
    hint: '📌 keeps the experiment in Testing now. What you do not pin stays as it is, just hidden.', empty: 'Nothing pinned yet. Pick in Experiments what you are testing.' },
  pt: { tab: 'Tester', info: 'O que é ser tester', labs: 'Ir para o Labs', offline: '📴 Modo sem conexão', offlineHint: 'Com os estados da nuvem', flagsHint: 'Só neste celular; a página recarrega',
    now: 'Testando agora', all: 'Experimentos', back: 'Testando agora', pin: 'Fixar em Testando agora', markOff: 'Desligado', markOn: 'Ligado',
    hint: '📌 deixa o experimento em Testando agora. O que você não fixa continua igual, só fica escondido.', empty: 'Nada fixado ainda. Escolha em Experimentos o que está testando.' },
};
export const RIBBON_TEXTS = T;

const CSS = `
.tr { position: fixed; right: 0; z-index: 40; display: flex; align-items: flex-start; top: max(calc(14px + var(--safe-top)), var(--tr-top, calc(70px + var(--safe-top)))); transition: top 0.35s cubic-bezier(0.22, 1, 0.36, 1); font-family: var(--font-body); color: var(--ink); }
.tr-tab { position: relative; overflow: hidden; flex: none; width: 38px; height: 46px; border: 0; padding: 0; cursor: pointer;
  border-radius: 14px 0 0 14px; color: var(--bg1); font: 400 1.75rem/1 var(--font-display);
  text-shadow: 0 0 1px #fff, 0 0 6px rgba(255,255,255,0.9), 0 1px 0 rgba(255,255,255,0.8);
  background: linear-gradient(135deg, var(--pink), var(--purple), var(--cyan), var(--lime), var(--yellow), var(--pink));
  background-size: 400% 400%; animation: tr-iri 6s ease-in-out infinite;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.35) inset, 0 6px 18px rgba(138,77,255,0.45); }
.tr-tab::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.75) 48%, transparent 62%);
  background-size: 260% 100%; animation: tr-brillo 3.2s ease-in-out infinite; }
.tr-tab-wrap { position: relative; flex: none; }
.tr-punto { position: absolute; top: -4px; left: -4px; z-index: 1; width: 13px; height: 13px; border-radius: 999px; background: var(--red); border: 2px solid var(--bg1); box-shadow: 0 0 8px rgba(224,36,60,0.8); pointer-events: none; }
/* Hidden while a game is played (back-guard.js marks it), unless the screen has a test control */
html[data-en-juego] .tr:not(.con-ctx), body.jugando .tr:not(.con-ctx) { display: none; }
.tr:not(.con-ctx) .tr-punto, .tr:not(.con-ctx) .tr-ctx { display: none; }
.tr-tab:focus-visible { outline: 2px solid var(--yellow); outline-offset: 2px; }
@keyframes tr-iri { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes tr-brillo { 0%, 55% { background-position: 160% 0; } 100% { background-position: -60% 0; } }
@media (prefers-reduced-motion: reduce) { .tr-tab, .tr-tab::after { animation: none; } .tr-tab { background-position: 30% 50%; } }
.tr-panel { display: flex; flex-direction: column; gap: 10px; width: min(236px, calc(100vw - 60px)); padding: 12px 14px;
  background: rgba(21,7,38,0.94); border: 1px solid var(--glass-border); border-right: 0; border-radius: 0 0 0 14px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.45);
  max-height: calc(100svh - 64px); overflow-y: auto; overscroll-behavior: contain; }
.tr:not(.abierto) .tr-panel { display: none; }
.tr-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tr-cab b { font: 400 1.25rem/1 var(--font-display); letter-spacing: 0.05em; color: var(--yellow); }
.tr-info { flex: none; width: 32px; height: 32px; border-radius: 999px; border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink); font: 900 0.95rem/1 var(--font-body); cursor: pointer; }
.tr-labs { color: var(--cyan); font-weight: 900; text-decoration: none; display: flex; justify-content: space-between; min-height: 44px; align-items: center; }
.tr-flags { border-top: 1px solid var(--glass-border); padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.tr-flags[hidden] { display: none; }
.tr-flags > small { color: var(--muted); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.68rem; }
.tr-flags .toggle-row { padding: var(--s-6) var(--s-8); gap: var(--s-8); }
.tr-flags .tr-mark { display: block; color: var(--yellow); font-weight: 900; font-size: 0.68rem; letter-spacing: 0.06em; text-transform: uppercase; }
.tr-flags .tr-mark[hidden] { display: none; }
.tr-pin { position: relative; flex: none; width: 36px; height: 36px; border-radius: 999px; border: 1px solid var(--glass-border); background: transparent; font-size: 1rem; line-height: 1; cursor: pointer; opacity: 0.45; filter: grayscale(1); }
.tr-pin::before { content: ''; position: absolute; inset: -4px; }
.tr-pin.on { opacity: 1; filter: none; background: var(--glass); border-color: var(--yellow); }
.tr-pin:focus-visible, .tr-back:focus-visible, .tr-all:focus-visible { outline: 2px solid var(--yellow); outline-offset: 2px; }
.tr-all, .tr-back { background: none; border: 0; padding: 0; color: var(--cyan); font: 900 1rem var(--font-body); min-height: 44px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; text-align: left; }
.tr-hint { color: var(--muted); font-size: 0.8rem; line-height: 1.3; margin: 0; }
/* First view: only what is pinned or changed, the way to every experiment, the screen's control */
.tr:not(.v2) .tr-flags .toggle-row:not(.fijo):not(.cambiado), .tr:not(.v2) .tr-pin, .tr:not(.v2) .tr-back, .tr:not(.v2) .tr-hint--v2 { display: none; }
/* Second view: every row with its 📌, wider so the pin and the switch fit beside the name */
.tr.v2 .tr-panel { width: min(300px, calc(100vw - 60px)); }
.tr.v2 .tr-labs, .tr.v2 .tr-all, .tr.v2 .tr-ctx, .tr.v2 .tr-flags > small, .tr.v2 .tr-hint--empty { display: none; }
.tr.v2 .tr-flags { border-top: 0; padding-top: 0; }
.tr-flags .toggle-row--sub { margin-left: var(--s-16); }
.tr-flags .txt small { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tr-ctx { border-top: 1px solid var(--glass-border); padding-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.tr-sim { display: flex; flex-direction: column; gap: 8px; }
.tr-ctx small { color: var(--muted); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.68rem; }
.tr-fila { display: flex; gap: 8px; align-items: center; }
.tr-fila input { width: 4.2em; padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); color: inherit; font: 800 1rem var(--font-num); text-align: center; }
.tr-fila .btn { flex: 1; }
.tr-sim select { width: 100%; padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); color: inherit; font: 700 0.9rem var(--font-body); }
.tr-sim select option { color: #000; }
@media (prefers-reduced-motion: reduce) { .tr { transition: none; } }
`;

let ribbon = null, ctx = null, ctxRow = null, t = T.es;

function place() {
  if (!ribbon) return;
  const bar = document.querySelector('.topbar');
  // 22 px under the bar's buttons on every screen: closer, the tab reads as glued to them
  const top = bar && bar.getBoundingClientRect().height ? bar.getBoundingClientRect().bottom + 22 : null;
  // As the page scrolls the bar leaves and the tab climbs to the screen's top edge (the CSS max()),
  // gliding there with the transition instead of jumping
  ribbon.style.setProperty('--tr-top', top == null ? 'calc(14px + var(--safe-top))' : `${Math.max(8, top)}px`);
}

let queued = false;
const placeSoon = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; place(); }); };

function drawContext() {
  if (!ribbon) return;
  const box = ribbon.querySelector('.tr-ctx');
  box.replaceChildren(...(ctx ? [ctx] : []));
  syncContext();
}

/**
 * Whether the screen's control shows. One bundled with a row (the cloud states with offline mode, D-592)
 * shows only while that row is in the first view: pinned, or out of its normal state; hidden with it.
 * The red dot on the folded tab follows: this screen has something to try. Without it, only (i) and Labs
 */
function syncContext() {
  if (!ribbon) return;
  const r = ctxRow && ribbon.querySelector(`.tr-flags [data-row="${ctxRow}"]`);
  const shown = !!ctx && (!ctxRow || (!!r && (r.classList.contains('fijo') || r.classList.contains('cambiado'))));
  ribbon.classList.toggle('con-ctx', shown);
}

/** Shows the ribbon (once). The caller has already checked the key and the flag. */
export function testerRibbon({ lang = 'es', labsUrl = new URL('../../labs/', import.meta.url).href } = {}) {
  if (ribbon?.isConnected) return ribbon;
  t = T[lang] || T.es;
  if (!document.getElementById('tr-css')) document.head.append(el('style', { id: 'tr-css' }, CSS));
  const tab = el('button', { type: 'button', class: 'tr-tab', id: 'tr-tab', 'aria-expanded': 'false', 'aria-controls': 'tr-panel', 'aria-label': t.tab }, 'T');
  const panel = el('div', { class: 'tr-panel', id: 'tr-panel' },
    el('div', { class: 'tr-cab' }, el('b', {}, '🧪 Tester'),
      el('button', { type: 'button', class: 'tr-info', id: 'tr-info', 'aria-label': t.info, onClick: () => openTesterSheet(lang, labsUrl) }, 'i')),
    el('a', { class: 'tr-labs', id: 'tr-labs', href: labsUrl }, t.labs, el('span', { 'aria-hidden': 'true' }, '›')),
    el('div', { class: 'tr-flags', id: 'tr-flags', hidden: true }),
    el('div', { class: 'tr-ctx', id: 'tr-ctx' }));
  ribbon = el('div', { class: 'tr', id: 'tester-ribbon' }, el('div', { class: 'tr-tab-wrap' }, tab, el('span', { class: 'tr-punto', 'aria-hidden': 'true' })), panel);
  // Folded, it opens again on the first view
  const toggle = open => { ribbon.classList.toggle('abierto', open); if (!open) showView(1); tab.setAttribute('aria-expanded', String(open)); };
  tab.addEventListener('click', () => toggle(!ribbon.classList.contains('abierto')));
  // Folds again on a tap outside it or Escape: it acts over the page, it never stays in the way
  document.addEventListener('pointerdown', e => { if (!ribbon.contains(e.target)) toggle(false); }, true);
  ribbon.addEventListener('keydown', e => { if (e.key === 'Escape') { toggle(false); tab.focus(); } });
  document.body.append(ribbon);
  drawContext(); place();
  const list = panel.querySelector('.tr-flags');
  views(list);
  offlineSwitch(list);
  labSwitches(list);
  addEventListener('resize', placeSoon);
  addEventListener('scroll', placeSoon, { passive: true });
  document.fonts?.ready.then(place);
  return ribbon;
}

/**
 * The offline switch (D-538): only while the flag `offline` is on for this tester, since without it
 * nothing on the page reacts to the mode. It forces the mode on this phone, every page and tab
 * (connection.js keeps it in localStorage), until switched off; the connection is never touched.
 */
export async function offlineSwitch(box, {
  isOn = () => import('./flags.js').then(m => m.flag('offline')),
  conn = () => import('./connection.js').then(m => m.connection()),
} = {}) {
  if (!box || !(await isOn().catch(() => false))) return null;
  const c = await conn();
  const sw = el('button', { type: 'button', class: 'switch', role: 'switch', id: 'tr-offline', 'aria-label': t.offline });
  const r = row(OFFLINE_ROW, t.offline, t.offlineHint, sw, t.markOn);
  const draw = () => { const on = c.forced(); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on)); r.changed(on); };
  sw.addEventListener('click', () => { c.force(!c.forced()); draw(); });
  c.onChange(draw);
  // first in the list, as it was above the flags
  const first = box.querySelector('.toggle-row') || box.querySelector('.tr-all');
  if (first) first.before(r.node); else box.append(r.node);
  box.hidden = false;
  draw();
  return sw;
}

/**
 * A switch per lab flag this page asked (D-567): off turns the feature off on this phone, and the
 * page reloads to draw without it. Flags asked later (a screen that opens) are added as they come.
 */
/** The offline switch's row id for the pins: not a flag, so it never clashes with one. */
export const OFFLINE_ROW = 'offline-mode';
let pins = null;
const pinStore = () => (pins ??= import('./flags.js'));

/**
 * The two views' frame inside the list (D-592): the «Testing now» label and its empty line, the
 * way to every experiment, and for the second view the way back and what the 📌 does. Rows go
 * between the hints and the way to every experiment.
 */
function views(box) {
  box.replaceChildren(
    el('small', {}, t.now),
    el('button', { type: 'button', class: 'tr-back', id: 'tr-back', onClick: () => showView(1) }, el('span', {}, `‹ ${t.back}`)),
    el('p', { class: 'tr-hint tr-hint--v2' }, t.hint),
    el('p', { class: 'tr-hint tr-hint--empty', id: 'tr-empty' }, t.empty),
    el('button', { type: 'button', class: 'tr-all', id: 'tr-all', onClick: () => showView(2) }, el('span', { class: 'tr-all-n' }, t.all), el('span', { 'aria-hidden': 'true' }, '›')));
}

/** Shows the first view (1, «Testing now») or the second (2, every experiment). */
function showView(n) {
  if (!ribbon) return;
  ribbon.classList.toggle('v2', n === 2);
  ribbon.querySelector('.tr-cab b').textContent = n === 2 ? `🧪 ${t.all}` : '🧪 Tester';
  (n === 2 ? ribbon.querySelector('.tr-back') : ribbon.querySelector('.tr-all'))?.focus({ preventScroll: true });
}

/** The count on the way to every experiment, and the empty line when the first view has no row. */
function count(box) {
  const rows = [...box.querySelectorAll('.toggle-row')];
  box.querySelector('.tr-all-n').textContent = `${t.all} · ${rows.length}`;
  box.querySelector('.tr-hint--empty').hidden = rows.some(r => r.classList.contains('fijo') || r.classList.contains('cambiado'));
  syncContext();
}

/**
 * One row of the list: name, line, a mark while it is out of its normal state, its 📌 and its switch.
 * `changed(on)` marks it (and keeps it in the first view: what is changed is never hidden).
 */
function row(id, name, line, sw, mark, title = '') {
  const markEl = el('span', { class: 'tr-mark', hidden: true }, mark);
  const pin = el('button', { type: 'button', class: 'tr-pin', 'aria-label': t.pin, 'aria-pressed': 'false', 'data-pin': id }, '📌');
  const node = el('div', { class: 'toggle-row', 'data-row': id }, el('div', { class: 'txt' }, el('b', {}, name), markEl, el('small', { title }, line)), pin, sw);
  const drawPin = on => { pin.classList.toggle('on', on); pin.setAttribute('aria-pressed', String(on)); node.classList.toggle('fijo', on); };
  pinStore().then(({ labPinnedList }) => { drawPin(!!labPinnedList()[id]); node.parentNode && count(node.parentNode); });
  pin.addEventListener('click', async () => {
    const { labPinnedList, setLabPinned } = await pinStore();
    const on = !labPinnedList()[id];
    setLabPinned(id, on); drawPin(on); count(node.parentNode);
  });
  return { node, changed: on => { markEl.hidden = !on; node.classList.toggle('cambiado', !!on); node.parentNode && count(node.parentNode); } };
}

/** A flag's name in the T tab when it is not its id (the owner, 2026-11-19). */
const NAMES = { 'home-carousels': 'main page con íconos', 'home-carousels-sheet': '↳ target: hoja con tabs' };
/** Sub-flags: asked only while their main flag is on, so their switch shows only then, under it. */
const SUB = { 'home-carousels-sheet': 'home-carousels' };

export async function labSwitches(box, { flags = () => import('./flags.js'), list = () => import('./flag-list.js') } = {}) {
  if (!box) return;
  const [{ labHere, labOffList, setLabOff }, { FLAGS, PARKED = new Set() }] = await Promise.all([flags(), list()]);
  const shown = new Set();
  const add = id => {
    if (shown.has(id)) return;
    shown.add(id);
    const off = !!labOffList()[id];
    const sw = el('button', { type: 'button', class: 'switch' + (off ? '' : ' on'), role: 'switch', 'aria-checked': String(!off), 'aria-label': id, 'data-flag': id,
      onClick: () => { setLabOff(id, !labOffList()[id]); location.reload(); } });
    const sub = SUB[id];
    const r = row(id, NAMES[id] || id, FLAGS[id] || t.flagsHint, sw, t.markOff, FLAGS[id] || '');
    if (sub) r.node.classList.add('toggle-row--sub');
    r.changed(off);
    // a sub-flag sits right under its main flag's row, indented
    const parent = sub && box.querySelector(`[data-row="${sub}"]`);
    if (parent) parent.after(r.node); else box.querySelector('.tr-all').before(r.node);
    // a main flag asked after its sub-flags (they are asked while the page draws): its subs move under it
    for (const [kid, of] of Object.entries(SUB)) if (of === id) { const k = box.querySelector(`[data-row="${kid}"]`); if (k) r.node.after(k); }
    box.hidden = false;
    count(box);
  };
  // Turned off here, a flag is still asked (and listed), so it can be turned back on. Not the tab's own
  // flag (off, the tab would go with it), nor one whose card went to La Bodega as 💤 (D-593)
  const keep = id => id !== 'tester-ribbon' && !PARKED.has(id) && add(id);
  for (const id of labHere) keep(id);
  addEventListener('lab-flag', e => keep(e.detail));
}

/**
 * The current screen's control (a node), or null when it has none. Folds the ribbon when it changes.
 * `bundle`: the row it goes with (`'offline-mode'` for the cloud states), shown and hidden with it.
 */
export function setTesterContext(node, { bundle = null } = {}) {
  ctx = node || null;
  ctxRow = ctx ? bundle : null;
  ribbon?.classList.remove('abierto');
  drawContext();
}

/** Folds the ribbon (after a context action that leaves the screen). */
export const foldTesterRibbon = () => { ribbon?.classList.remove('abierto'); ribbon?.querySelector('.tr-tab')?.setAttribute('aria-expanded', 'false'); };
