/**
 * ⚡ ¡Al toque! (id `microgames`) — its screen in La Copa, Uno al día and on its standalone page /in-a-flash/
 * (D-456's way: one screen, La Copa's). A run of ten different microgames of 3 to 5 seconds, faster every
 * three; each gives 0 to 3 stars. The stage and the 29 microgames are stage.js (moved from the page it had
 * out of the lab); the run's rules, engine.js. Its exports are named in English (D-316): La Copa's interface
 * (`portada`, `titulo`, `montar`, `resultado`, `desglose`) is mapped to them in cup/games/index.js.
 *
 * What the cup page provides stays out: the cover's card, its countdown, the comment form, the best, the
 * rankings, sharing and the usage signal. A run cannot be resumed halfway in a cup: the marks are saved
 * after each microgame with `ctx.guardar`, and a page reloaded mid-run ends the run with what it had
 * (no retry by reloading), as Aletazo. The state is `{ fin, marks, orden, ms }`.
 */
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import { confetti } from '../../../assets/js/ui.js';
import { SFX } from '../../../assets/js/sound.js';
import { score, points, runScore100, card, STREAK } from './engine.js';
import { STAGE, GESTURES, WAYS, ICONS, playRun, t, multTxt } from './stage.js';
import { labAccess } from '../../../assets/js/lab-access.js';
import TEXTOS from './texts.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
/** [none, one, many] */
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* outside the browser */ } return (TEXTOS[l] || TEXTOS.es).ui; };
const h = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...kids.flat().filter(x => x != null)); return n; };

/** The cover: the three ways to play, each with its finger doing the gesture (as the game's intro cards). */
export function cover() {
  const U = UI();
  const cap = x => x[0].toUpperCase() + x.slice(1);
  const box = h('div', { class: 'mg-portada' });
  box.innerHTML = `<div class="kinds">${WAYS.map(([k, label, col]) => `<div class="kind" style="--kc:${col}"><div class="gstage g-${k}" aria-hidden="true">${GESTURES[k]}</div><div><b>${t(label)}</b><p>${cap(U.mgKinds[k])}</p></div></div>`).join('')}</div>`;
  return box;
}

/** The name in the waiting room, with the ⚡ that jolts, its line and the credit to WarioWare right under it. */
export function title({ el, J }) {
  const U = UI();
  const [antes, despues] = String(U.mgCredit).split('{juego}');
  return el('div', { class: 'mg-cabeza' },
    el('h2', { class: 'mg-titulo' },
      el('span', { class: 'tbolt', 'aria-hidden': 'true' }, '⚡'),
      el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'mg-lema' }, U.mgLema),
    el('p', { class: 'mg-credito', id: 'mg-credito' }, antes, el('a', { href: U.mgWiki, target: '_blank', rel: 'noopener', id: 'link-warioware' }, 'WarioWare'), despues || ''));
}

let partidas = 0;   // the run on screen; a new one stops the old one

export function mount(raiz, ctx) {
  const { p = {}, T, el } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const orden = Array.isArray(p.orden) && p.orden.length ? p.orden : [];
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Array.isArray(ctx.jugadas.marks) ? ctx.jugadas : null;
  const vez = ++partidas;
  const S = { marks: previa ? previa.marks.slice() : [], fin: false, inicio: performance.now(), ms: 0, run: null };
  const juego = el('div', { class: 'mg-juego' });
  juego.innerHTML = STAGE;
  const fin = el('div', { class: 'mg-fin', id: 'mg-fin' });
  juego.append(fin);
  raiz.append(juego);

  const estado = () => ({ fin: S.fin, marks: S.marks.slice(), orden: orden.slice(),
    ms: S.fin ? S.ms : Math.round(performance.now() - S.inicio) + (previa?.ms || 0) });

  /** The run's end, in the stage: the verdict, the points, each game's stars and the button to the cup's result. */
  function acabar({ recien = true } = {}) {
    if (S.fin) return;
    S.ms = Math.round(performance.now() - S.inicio) + (previa?.ms || 0);
    S.fin = true;
    S.run?.stop();
    const e = estado();
    ctx.guardar?.(e);
    ctx.pararReloj?.(e);
    const sc = score(S.marks), stars = S.marks.reduce((a, m) => a + m, 0), k = stars / (orden.length * 3 || 1);
    const verdict = T.mgVerdicts[k >= 0.75 ? 2 : k >= 0.45 ? 1 : 0];
    const screen = juego.querySelector('#screen');
    juego.querySelector('#hud').hidden = true; juego.querySelector('#runbar').hidden = true;
    screen.classList.remove('full');
    screen.innerHTML = `<div class="cmd">${verdict}</div><div class="stars total"><span class="num" id="mg-pts">${sc.points}</span> ${t('pts')}</div>
      <div class="sub best">${stars} / ${orden.length * 3} ★${p.tope ? '' : ` · ${runScore100(e)}/100`}</div>
      <div class="runsum" data-tablero>${orden.map((id, i) => `<span><b>${ICONS[id] || ''}</b><span class="shiny sm">${[0, 1, 2].map(s => `<b class="st${s < (S.marks[i] || 0) ? ' on' : ''}">★</b>`).join('')}</span><em class="num">${i < S.marks.length ? sc.games[i].points : '–'}${sc.games[i]?.streak ? '🔥' : ''}</em></span>`).join('')}</div>`;
    if (recien && k >= 0.45) { SFX.win?.(); if (!QUIETO()) confetti(); }
    fin.replaceChildren(el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => ctx.terminar(estado()) }, ctx.textoFin || T.mgContinue));
    if (recien) requestAnimationFrame(() => fin.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  // A run already played on this phone: finished, it shows finished; halfway, it ends where it was
  if (previa) { acabar({ recien: false }); return; }
  // Saved from the start, so a reload before the first game ends also ends the run
  ctx.guardar?.(estado());
  S.run = playRun({ order: orden, seed: p.semilla, done: [],
    onGame: marks => { if (vez !== partidas) return; S.marks = marks; ctx.guardar?.(estado()); },
    onEnd: marks => { if (vez !== partidas) return; S.marks = marks; acabar(); } });
  // For the end-to-end script: the run as the cup gets it
  window.__alToque = { S, estado, acabar };
  // Testers only (lab: #seccion-tester-ribbon), in the T tab (never on the cover, which stays as players see it): play any one game on its own.
  // It is a try-out: nothing is saved or sent to the cup, and the run it replaces is dropped
  labAccess().then(ok => {
    if (!ok || !juego.isConnected) return;
    return import('../../../assets/js/tester-ribbon.js').then(({ setTesterContext, foldTesterRibbon }) => {
      const kinds = S.run.kinds, kindOf = S.run.kind;
      const go = id => { foldTesterRibbon(); S.run?.stop(); partidas++; S.run = playRun({ order: [id], seed: String(Date.now()) }); };
      const grid = el('div', { class: 'tr-mg-grid', id: 'tr-mg' }, ...Object.keys(kinds).flatMap(k => S.run.meta.filter(m => kindOf[m.id] === k).map(m =>
        el('button', { type: 'button', class: 'tr-mg-b', style: `--kc:${kinds[k][2]}`, title: m.n, 'aria-label': m.n, 'data-id': m.id, onClick: () => go(m.id) }, ...(m.i.startsWith('<') ? [Object.assign(el('span'), { innerHTML: m.i })] : [m.i])))));
      setTesterContext(el('div', { class: 'tr-sim tr-mg-box' }, el('small', {}, '⚡ Jugar un microjuego (sin guardar)'), grid));
    });
  }).catch(() => {});
}

/** What goes to the cup and to the result: the points (no cap), its card, the run's 0–100 for Uno al día and the final (`d100`), and the time. */
export function result(e) {
  const s = points(e);
  return { s, d100: runScore100(e), t: card(e), resumen: String(s), ms: Number.isFinite(e?.ms) ? Math.round(e.ms) : undefined };
}

/** How the points were reached (D-106): the stars × 10, what the speed added, the streaks, and a run cut short. */
export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e || !Array.isArray(e.marks)) return [];
  const sc = score(e.marks), stars = e.marks.reduce((a, m) => a + (m | 0), 0), base = stars * 10;
  const streaks = sc.games.filter(g => g.streak).length, speed = sc.points - base - streaks * STREAK;
  const n = e.marks.length, m = Array.isArray(e.orden) ? e.orden.length : n;
  return [
    fmt(T.mgBdStars[forma(stars)], { n: stars }),
    speed > 0 ? fmt(T.mgBdSpeed, { n: speed, x: multTxt(1.3) }) : null,
    streaks ? fmt(T.mgBdStreaks[forma(streaks)], { n: streaks, p: streaks * STREAK }) : null,
    n < m ? fmt(T.mgBdCut, { n, m }) : null,
  ].filter(Boolean);
}
