/**
 * Tembleque / The Wobbles: the cover (C-2). A lever picks the level, Sudoku's (Pintaminas' hard-mode
 * switch): down and green is easy, the 2D plank; up and red is hard, the 3D disc. The picture above shows
 * the level the lever shows, moving, and ¡A jugar! opens it. Each level is a page of its own that keeps
 * the owner's prototype whole: easy/ and hard/; their ‹ comes back here. Lab only (D-395); docs/games/wobbles.md.
 */
import { $, el, vibrate } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { trackVisit } from '../../assets/js/transport/stats.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import { labAccess } from '../../assets/js/lab-access.js';
import { flag } from '../../assets/js/flags.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { bloqueJugador, avisoPartida, bloqueTabla } from '../../assets/js/ranking.js';
import { salidasFin } from '../../assets/js/fin.js';
import { ponerBuzon } from '../../assets/js/buzon.js';
import { rankingsVisibles } from '../../assets/js/jugador.js';
import { GAME_ID, LOCALES } from './rules.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/wobbles.js';

const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const QUIET = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** The level the lever shows: easy until it is flipped, as in Sudoku. */
let chosen = 'easy';

/* ---------------- The picture: each level, moving ---------------- */
const cube = (x, y, s, [top, right, left]) => `<polygon points="${x},${y - s * 0.5} ${x + s * 0.87},${y} ${x},${y + s * 0.5} ${x - s * 0.87},${y}" fill="${top}"/><polygon points="${x - s * 0.87},${y} ${x},${y + s * 0.5} ${x},${y + s * 1.5} ${x - s * 0.87},${y + s}" fill="${left}"/><polygon points="${x},${y + s * 0.5} ${x + s * 0.87},${y} ${x + s * 0.87},${y + s} ${x},${y + s * 1.5}" fill="${right}"/>`;
const TEAL = ['#5fefe2', '#23ac9f', '#19806f'], ROSE = ['#ff6fae', '#d92574', '#a01a55'], GOLD = ['#ffe27a', '#e0a91a', '#a87a08'];
const neon = (x, y, w, h, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${col}" fill-opacity="0.18" stroke="${col}" stroke-width="2.2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8"/>`;
const PIC_2D = `<svg class="wb-2d" viewBox="0 0 200 140" aria-hidden="true">
  <defs><linearGradient id="wb-plank" x1="0" x2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <filter id="wb-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <circle cx="168" cy="22" r="8" fill="#ffe9a8" opacity="0.9"/><circle cx="172" cy="19" r="7" fill="#1e0a3c"/>
  <clipPath id="wb-land"><rect x="0" y="0" width="200" height="140" rx="12"/></clipPath>
  <g clip-path="url(#wb-land)"><path d="M0 116 Q40 96 80 112 T160 106 T200 112 V140 H0Z" fill="#2e1258"/>
  <rect x="0" y="122" width="200" height="18" fill="#173f7a"/><line x1="0" y1="122" x2="200" y2="122" stroke="#2ee6d6" stroke-width="1.4" filter="url(#wb-glow)"/></g>
  <path d="M95 100h10l14 22h-38z" fill="#1a0b38" stroke="#2ee6d6" stroke-opacity="0.6" stroke-width="1"/>
  <line x1="40" y1="14" x2="160" y2="14" stroke="#bea0ff" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round"/>
  <g class="wb-claw"><rect x="93" y="9" width="14" height="10" rx="3" fill="#2ee6d6" filter="url(#wb-glow)"/><line x1="100" y1="19" x2="100" y2="27" stroke="#2ee6d6" stroke-width="1.2"/>
    <g class="wb-drop">${neon(92, 27, 16, 16, '#ffd23f')}</g></g>
  <g class="wb-stars" fill="#fff"><circle cx="30" cy="30" r="1"/><circle cx="62" cy="44" r="0.8"/><circle cx="142" cy="40" r="1"/><circle cx="186" cy="52" r="0.8"/></g>
  <g class="wb-plank" filter="url(#wb-glow)">
    <rect x="40" y="94" width="120" height="7" rx="3.5" fill="url(#wb-plank)"/>
    ${neon(62, 76, 18, 18, '#2ee6d6')}${neon(84, 76, 18, 18, '#2ee6d6')}${neon(64, 64, 36, 11, '#ff2e88')}<circle cx="142" cy="85" r="9" fill="#9dff3a" fill-opacity="0.18" stroke="#9dff3a" stroke-width="2.2"/>
    <g class="wb-landed">${neon(108, 78, 16, 16, '#ffd23f')}</g>
  </g>
  <circle cx="100" cy="98" r="3.4" fill="#9dff3a" filter="url(#wb-glow)"/>
</svg>`;
const PIC_3D = `<svg class="wb-3d" viewBox="0 0 200 140" aria-hidden="true">
  <defs><linearGradient id="wb-rim" x1="0" x2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset=".35" stop-color="#9dff3a"/><stop offset=".65" stop-color="#2ee6d6"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <linearGradient id="wb-col" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1464"/><stop offset="1" stop-color="#3a1464" stop-opacity="0"/></linearGradient>
    <radialGradient id="wb-halo"><stop offset="0" stop-color="#8a4dff" stop-opacity="0.35"/><stop offset="1" stop-color="#8a4dff" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="100" cy="92" rx="95" ry="56" fill="url(#wb-halo)"/>
  <path d="M93 98h14v42H93z" fill="url(#wb-col)"/>
  <ellipse class="wb-hoop" cx="100" cy="86" rx="72" ry="38" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="1 0"/>
  <g class="wb-disc">
    <ellipse cx="100" cy="97" rx="66" ry="33" fill="#3a1464"/>
    <ellipse cx="100" cy="91" rx="66" ry="33" fill="#7a56b8" stroke="url(#wb-rim)" stroke-width="5"/>
    <ellipse cx="100" cy="91" rx="44" ry="22" fill="none" stroke="#fff" stroke-opacity="0.15"/><path d="M38 91H162M100 61V121" stroke="#fff" stroke-opacity="0.18"/>
    ${cube(78, 70, 15, TEAL)}${cube(78, 55, 15, TEAL)}${cube(122, 78, 13, ROSE)}${cube(104, 94, 11, GOLD)}
  </g>
  <g class="wb-hover"><ellipse cx="100" cy="86" rx="14" ry="7" fill="#0e0222" opacity="0.45"/>${cube(100, 18, 14, ROSE)}</g>
</svg>`;

/** The picture and how to play follow the lever. */
function drawPicture() {
  $('#pic').classList.toggle('hard', chosen === 'hard');
  $('#how').replaceChildren(...L.como[chosen].map(step => el('li', {}, step)));
}

/* ---------------- The level lever: Sudoku's (Pintaminas' electric switch), as is ---------------- */
/**
 * Down with a green knob is easy, up with a red knob is hard. Flipping it sends an electric wave around
 * the plate and turns the whole cover over: easy is the usual night, hard is a charged red-violet panel,
 * with a flash over the view, sparks and a glow that flickers like a bad contact.
 */
let flicker = 0;
function setTheme() {
  const hard = chosen === 'hard';
  document.body.classList.toggle('wb-hard', hard);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hard ? '#2a0612' : '#150726');
}
function lightning() {
  if (QUIET()) return;
  const x = el('div', { class: 'wb-flash', 'aria-hidden': 'true' });
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}
function wave(lever, hard) {
  const w = el('span', { class: 'wb-wave' + (hard ? ' hard' : ''), 'aria-hidden': 'true' });
  lever.querySelector('.wb-plate').append(w);
  setTimeout(() => w.remove(), 900);
  lever.classList.remove('zap'); void lever.offsetWidth; lever.classList.add('zap');
}
function startFlicker(lever) {
  const n = ++flicker;
  if (QUIET()) return;
  const step = () => {
    if (n !== flicker || !lever.isConnected || chosen !== 'hard') { lever.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    lever.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(step, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  step();
}
function renderModes() {
  const hard = chosen === 'hard';
  const title = el('b', {}, T.switch[+hard].title), sub = el('span', { class: 'muted' }, T.switch[+hard].sub);
  const lever = el('button', {
    type: 'button', class: 'wb-lever' + (hard ? ' on' : ''), id: 'btn-level', role: 'switch',
    'aria-checked': String(hard), 'aria-label': T.switch[1].title,
    onClick: () => {
      chosen = chosen === 'hard' ? 'easy' : 'hard';
      const on = chosen === 'hard';
      if (on) { lightning(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      lever.classList.toggle('on', on);
      lever.setAttribute('aria-checked', String(on));
      title.textContent = T.switch[+on].title; sub.textContent = T.switch[+on].sub;
      if (!QUIET()) wave(lever, on);
      if (on) startFlicker(lever); else flicker++;
      setTheme(); drawPicture();
    },
  },
  el('span', { class: 'wb-plate', 'aria-hidden': 'true' },
    el('span', { class: 'wb-track', html: '<svg viewBox="0 0 70 60"><path class="wb-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'wb-bolt b1' }, '⚡'), el('span', { class: 'wb-bolt b2' }, '⚡'), el('span', { class: 'wb-bolt b3' }, '⚡'),
    el('span', { class: 'wb-arm' }, el('span', { class: 'wb-knob' })), el('span', { class: 'wb-axle' })),
  el('span', { class: 'wb-label' }, title, sub));
  // ¡A jugar! opens the level the lever shows; `?lang` goes along if it came
  const play = () => { SFX.tap(); location.href = (chosen === 'hard' ? 'hard/' : 'easy/') + location.search; };
  $('#modes').replaceChildren(lever,
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'solo', onClick: play }, T.play));
  if (hard) startFlicker(lever);
  setTheme(); drawPicture();
}

// The cover ends with the site's footer, the game's own comment as its option (C-17, U-38)
function footer() {
  const comment = el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, pantalla: 'cover', nivel: chosen, idioma: lang, url: location.pathname } }),
  }, T.comentarAbrir);
  footerInto($('#pie'), { screen: `${GAME_ID}-cover`, inbox: false, options: [comment], lang });
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#pic').innerHTML = PIC_2D + PIC_3D;
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  renderModes();
  $('#rk-slot').append(bloqueJugador({ alTocar: () => SFX.tap() }));
  footer();
  // Behind the lab flag cover-dialogs, the steps and the sign-in open as dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
}


/* ---------------- The result (C-19), on each level's page ---------------- */
/*
 * Each level is the owner's prototype, a classic script: its game-over card says `wobbles:over` (score,
 * time, breakdown) and this adds what every result has, in C-19's order under the score and ↻ Again: the
 * rankings notice (one line), the exits from fin.js (back to the lab), the breakdown, the level's table
 * (wobbles_easy, wobbles_hard) and the 💬 link last. `wobbles:clear` empties it when a game starts.
 */
/** The level this page is: its table is the game's with the level as its variant. */
const resultLevel = /\/hard\/?$/.test(location.pathname) ? 'hard' : 'easy';
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const byId = id => document.getElementById(id);
const C = COMMON[lang] || COMMON.es;

function wireResult() {
  document.addEventListener('wobbles:clear', () => {
    for (const id of ['cAviso', 'cExits', 'cDetail', 'cRank']) byId(id)?.replaceChildren();
  });

  document.addEventListener('wobbles:over', ({ detail: { score, ms, lines } }) => {
    const s = Math.max(0, score | 0);
    byId('cExits').replaceChildren(salidasFin('lab', { lang, raiz: '../../../' }));
    // The breakdown is the long detail: after the exits (C-19, D-353)
    byId('cDetail').replaceChildren(el('ul', {}, lines.map(l => el('li', {}, l))));
    const rank = byId('cRank');
    rank.replaceChildren();
    byId('cAviso').replaceChildren();
    if (!rankingsVisibles()) return;
    const table = bloqueTabla({ tabla: `${GAME_ID}_${resultLevel}`, titulo: fmt(C.rk.titleOf, { game: manifest.name[lang] || manifest.name.es }), entrar: false });
    rank.append(table);
    // Signed in, the score is recorded and said; not yet, the one-line offer to make it count
    byId('cAviso').append(avisoPartida({ juego: GAME_ID, variante: resultLevel, s, ms, alAnotar: () => table.recargar() }));
    ponerBuzon(byId('card'), { juego: GAME_ID });
  });
}

// The cover (with its visit, D-208) or a level's result: the levels load this module too
if (document.getElementById('screen-intro')) {
  trackVisit();
  /* ---------------- Lab: the pieces a game starts with, in the «T» tester tab ---------------- */
/**
 * On the cover, for a lab key holder: − and + set how many pieces the plank or the disc starts with (0 to
 * 40), one number for both levels, kept on the phone; each level reads it when a game starts and lays them
 * with its own physics (docs/games/wobbles.md). Texts in the three languages.
 */
const START_KEY = 'balanza-lab:start-pieces', START_MAX = 40;
const START_T = { es: ['🧱 Piezas al empezar', 'Fácil y difícil, desde la próxima partida'], en: ['🧱 Pieces at the start', 'Easy and hard, from the next game'], pt: ['🧱 Peças ao começar', 'Fácil e difícil, a partir da próxima partida'] }[lang] || [];
function readStart() { try { return Math.max(0, Math.min(START_MAX, parseInt(localStorage.getItem(START_KEY), 10) || 0)); } catch (_) { return 0; } }
function startControl() {
  let n = readStart();
  const num = el('b', { id: 'tr-piezas', style: 'font:400 1.6rem/1 var(--font-display);min-width:2ch;text-align:center' }, String(n));
  const step = d => { n = Math.max(0, Math.min(START_MAX, n + d)); num.textContent = n; try { localStorage.setItem(START_KEY, String(n)); } catch (_) { /* no storage */ } };
  const btn = (txt, d) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', style: 'font-size:1.4rem', 'aria-label': d < 0 ? '-1' : '+1', onClick: () => { SFX.tap(); step(d); } }, txt);
  return el('div', { class: 'tr-sim' }, el('small', {}, START_T[0]),
    el('div', { class: 'tr-fila', style: 'justify-content:space-between' }, btn('−', -1), num, btn('+', 1)),
    el('p', { class: 'muted', style: 'margin:0;font-size:0.8rem' }, START_T[1]));
}
labAccess().then(ok => ok && import('../../assets/js/tester-ribbon.js').then(m => m.setTesterContext(startControl()))).catch(() => {});

// The hook for the end-to-end tests (C-14)
  window.__wobbles = { id: manifest.id, get level() { return chosen; } };
  init();
} else {
  wireResult();
  // The nine cheers of a balanced drop, on trial (lab: #seccion-wobbles-cheers): off, it is always ¡Perfecto!; its switch is in the «T» tab
  flag('wobbles-cheers').then(on => { window.__wobblesCheers = on; }).catch(() => {});
  window.__wobblesResult = { level: resultLevel, table: `${GAME_ID}_${resultLevel}` };
}
