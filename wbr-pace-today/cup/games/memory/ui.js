/**
 * 👀 Memorice (id `memory`) — its screen in La Copa, Uno al día and on its standalone page /memorice/,
 * moved from the lab (labs/memory/game.js) as Aletazo was (D-517's way): each round some pixel-art
 * pictures show on a covered board, some repeated, and hide again; the player taps every copy of the one
 * picture asked for before the time runs out. The board grows up to 6×6 and every round is faster, until
 * the 3 lives run out (the trial: 1 life and 3 rounds). The engine is engine.js, the pictures sprites.js.
 * Its exports are named in English (D-316): La Copa's interface is mapped to them in cup/games/index.js.
 *
 * What the lab had in play comes along: the intro rounds, «⏩ Tapar ya», the bars for the time to look and to
 * answer, the yellow ring on the copies not found, a life back every 5 in a row. Its clock stops while the
 * page is hidden (U-20). What the cup page provides stays out: the lab's cover card, its comment form, the
 * local best, the usage signal and the share button; the cup's game.js does the result, rankings, sharing
 * and telemetry. The day's boards come from the cup's seed, the same on every phone.
 *
 * A timed game cannot be resumed: after each round the state is saved with `ctx.guardar`, and a page
 * reloaded mid-game ends that game with the rounds it had. A finished game in `ctx.jugadas` shows finished.
 * The state is `{ fin, score, level, found, misses, rounds, ms }`, `rounds` one boolean per round played.
 */
import { LIVES, newGame, currentRound, newPlay, tap, endRound, makeRound, score, card, verdictOf } from './engine.js';
import { spriteSvg } from './sprites.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { SFX } from '../../../assets/js/sound.js';
import { getLang } from '../../../assets/js/i18n.js';
import TEXTOS from './texts.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
/** [none, one, many] */
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
// `?test` runs every wait four times faster, for the end-to-end script (as the lab did)
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* outside the browser */ } return (TEXTOS[l] || TEXTOS.es).ui; };
const SPEED =(() => { try { return new URLSearchParams(location.search).has('test') ? 0.25 : 1; } catch (_) { return 1; } })();

/** `portada` gets no `el`: a small one of its own. */
function h(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const x of hijos.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}

/* ------------------------------------------------------------------ */
/* The board                                                           */
/* ------------------------------------------------------------------ */

/** A covered board of `size`×`size` tiles; each tile has a cover and, on its back, a picture. */
function board(size, { mini = false, T = {} } = {}) {
  const b = h('div', { class: `mm-board${mini ? ' mini' : ''}`, style: `--n:${size}`, ...(mini ? {} : { id: 'mm-board', 'data-tablero': 'memory' }) });
  for (let i = 0; i < size * size; i++) {
    b.append(h(mini ? 'span' : 'button', {
      class: 'mm-tile', 'data-i': i, ...(mini ? {} : { type: 'button', 'aria-label': T.mmCovered, disabled: true }),
    }, h('span', { class: 'mm-inner' }, h('span', { class: 'mm-face mm-cover' }), h('span', { class: 'mm-face mm-pic' }))));
  }
  return b;
}
const tileAt = (b, i) => b.children[i];
function setPic(tile, name) {
  tile.querySelector('.mm-pic').innerHTML = name ? spriteSvg(name) : '';
  tile.classList.toggle('empty', !name);
}
function openTile(tile, name, label = '') {
  setPic(tile, name);
  tile.classList.add('open');
  if (label && tile.tagName === 'BUTTON') tile.setAttribute('aria-label', label);
}
function closeAll(b, covered = '') {
  for (const t of b.children) { t.classList.remove('open', 'ok', 'bad', 'answer'); if (t.tagName === 'BUTTON') t.setAttribute('aria-label', covered); }
}
const clearPics = b => { for (const t of b.children) setPic(t, null); };

/* ------------------------------------------------------------------ */
/* Waiting room                                                        */
/* ------------------------------------------------------------------ */

/**
 * The cover (the lab's demo): a small 3×3 board plays by itself, the pictures show, cover, and the one asked
 * opens with a green ring. Still, with reduced motion. It sleeps off screen (onScreen).
 */
let demoVez = 0;
export function cover() {
  const mini = board(3, { mini: true });
  const raiz = h('div', { class: 'mm-portada', 'aria-hidden': 'true' }, mini);
  const vez = ++demoVez;
  const r0 = makeRound('cover', 2);
  r0.board.forEach((s, i) => s && openTile(tileAt(mini, i), s));
  if (QUIETO()) return raiz;
  // A step of the demo every few hundred ms, driven by onScreen so it sleeps off screen
  const pasos = [];
  for (let k = 0; k < 6; k++) {
    const r = makeRound(`cover-${k}`, 1 + (k % 2));
    pasos.push([450, () => { closeAll(mini); }], [10, () => clearPics(mini)],
      [1500, () => r.board.forEach((s, i) => s && openTile(tileAt(mini, i), s))],
      [900, () => closeAll(mini)], [10, () => clearPics(mini)],
      ...r.ask.cells.map(c => [350, () => { openTile(tileAt(mini, c), r.ask.sprite); tileAt(mini, c).classList.add('ok'); }]),
      [1300, () => {}]);
  }
  let i = 0, desde = performance.now(), visto = false;
  const paso = now => {
    if (mini.isConnected) visto = true;
    if (vez !== demoVez || (!mini.isConnected && (visto || now - desde > 5000))) return;
    if (mini.isConnected && now - desde >= pasos[i][0]) { pasos[i][1](); i = (i + 1) % pasos.length; desde = now; }
    otro();
  };
  const otro = onScreen(mini, paso);
  otro();
  return raiz;
}

/** The name in the waiting room, with the 👀 that blinks and its line. */
export function title({ el, J }) {
  return el('div', { class: 'mm-cabeza' },
    el('h2', { class: 'mm-titulo' },
      el('span', { class: 'mm-logo', 'aria-hidden': 'true' }, '👀'),
      el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'mm-lema' }, UI().mmLema));
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

let partidas = 0;   // the game on screen; a new one stops the old one's loop

export function mount(raiz, ctx) {
  const { p = {}, T, el, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const previa = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isFinite(ctx.jugadas.score) ? ctx.jugadas : null;
  const vez = ++partidas;
  const vivo = () => vez === partidas && slot.isConnected;

  /* The game's clock (U-20): it runs only with the page in view */
  const timers = new Set();
  let jugado = 0, tickAt = performance.now(), parado = false, congelado = false;   // `congelado`: the e2e script stops the clock to take its shots
  const bar = el('div', { class: 'mm-bar', 'aria-hidden': 'true' }, el('span'));
  const tick = () => {
    const now = performance.now(), dt = Math.min(now - tickAt, 200);
    tickAt = now;
    if (!vivo()) { clearInterval(reloj); return; }
    const stop = document.hidden || congelado;
    if (stop !== parado) {
      parado = stop;
      cartel.hidden = !document.hidden;
      bar.firstElementChild.getAnimations().forEach(a => { if (stop && a.playState === 'running') a.pause(); else if (!stop && a.playState === 'paused') a.play(); });
    }
    if (stop) return;
    jugado += dt;
    for (const t of [...timers]) if (t.at <= jugado) { timers.delete(t); t.fn(); }
  };
  const reloj = setInterval(tick, 50);
  const after = (ms, fn) => { const t = { at: jugado + ms * SPEED, fn }; timers.add(t); return () => timers.delete(t); };
  const wait = ms => new Promise(r => { after(ms, r); });
  const anim = ms => (QUIETO() ? 1 : ms * SPEED);

  const vidas = el('span', { class: 'mm-vidas', id: 'mm-vidas', role: 'img' });
  const ronda = el('span', { class: 'mm-ronda', id: 'mm-ronda' });
  const aviso = el('div', { class: 'mm-aviso', id: 'mm-aviso', 'aria-live': 'polite' });
  const slot = el('div', { class: 'mm-slot' });
  const cartel = el('div', { class: 'mm-pausa', id: 'mm-pausa', hidden: true },
    el('span', { class: 'display display--lg' }, T.mmPaused), el('span', {}, T.mmResume));
  const fin = el('div', { class: 'mm-fin', id: 'mm-fin' });
  const juego = el('div', { class: 'mm-juego' }, el('div', { class: 'mm-hud' }, vidas, ronda), slot, bar, aviso, cartel, fin);
  raiz.append(juego);

  const S = { g: newGame(p.semilla ?? 'memory'), play: null, answer: null, fin: false, rounds: [], inicio: 0, ms: 0 };
  S.g.lives = p.vidas || LIVES;
  const totalVidas = S.g.lives;

  const pintarVidas = (perdida = false) => {
    const { lives } = S.g;
    vidas.setAttribute('aria-label', fmt(T.mmLives, { n: lives }));
    vidas.replaceChildren(...Array.from({ length: totalVidas }, (_, k) => el('span', { class: k < lives ? '' : `lost${perdida && k === lives ? ' now' : ''}` }, '❤️')));
  };
  const decir = (contenido, cls = '') => { aviso.className = `mm-aviso ${cls}`; aviso.replaceChildren(...[].concat(contenido)); };
  const barra = (ms, tipo) => {
    const f = bar.firstElementChild;
    bar.className = `mm-bar on ${tipo}`;
    f.getAnimations().forEach(x => x.cancel());
    f.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms * SPEED, easing: 'linear', fill: 'forwards' });
  };
  const pararBarra = () => { bar.className = 'mm-bar'; bar.firstElementChild.getAnimations().forEach(x => x.cancel()); };

  /** The game as it is saved and handed to the cup. */
  const estado = () => ({
    fin: S.fin, score: S.g.score, level: S.g.level, found: S.g.found, misses: S.g.misses, rounds: S.rounds.slice(),
    ms: S.fin ? S.ms : Math.round(jugado),
  });

  /** Asks for the picture: resolves true once every copy is found, false on a wrong tile or when time is up. */
  function preguntar(b, round) {
    for (const t of b.children) t.disabled = false;
    const { sprite, cells } = round.ask;
    decir([el('span', {}, T.mmAsk[cells.length - 1]), el('span', { class: 'mm-pic-icon', html: spriteSvg(sprite), 'aria-hidden': 'true' })], 'ask');
    barra(round.answerMs, 'answer');
    return new Promise(resolve => {
      const fallar = (tile, texto) => {
        S.answer = null; cancelar(); pararBarra();
        for (const x of b.children) x.disabled = true;
        tile?.classList.add('bad');
        SFX.error?.(); vibrate([40, 30, 40]);
        decir(texto, 'bad');
        // Where they were: the copies not found open with a yellow ring
        setTimeout(() => cells.forEach(c => { if (!S.play.found.includes(c)) { openTile(tileAt(b, c), sprite, sprite); tileAt(b, c).classList.add('answer'); } }), anim(350));
        wait(1500).then(() => resolve(false));
      };
      const cancelar = after(round.answerMs, () => { if (vivo() && S.answer) fallar(null, T.mmTimeUp); });
      S.answer = i => {
        if (!vivo()) { S.answer = null; cancelar(); return; }
        const t = tileAt(b, i);
        const res = tap(S.play, i);
        if (res === 'again') return;
        openTile(t, round.board[i], round.board[i] || T.mmEmpty);
        if (res === 'miss') return fallar(t, T.mmMiss);
        t.classList.add('ok'); t.disabled = true;
        SFX.tap(); vibrate(10);
        if (res === 'clear') { S.answer = null; cancelar(); pararBarra(); for (const x of b.children) x.disabled = true; wait(250).then(() => resolve(true)); }
      };
    });
  }

  async function bucle() {
    S.inicio = performance.now();
    while (vivo() && !S.fin) {
      const round = currentRound(S.g);
      S.play = newPlay(round);
      ronda.textContent = fmt(T.mmRound, { n: S.g.level });
      ronda.classList.remove('bump'); void ronda.offsetWidth; ronda.classList.add('bump');
      const b = board(round.size, { T });
      slot.replaceChildren(b);
      b.addEventListener('click', ev => {
        const t = ev.target.closest('.mm-tile');
        if (t && !t.disabled && S.answer) S.answer(+t.dataset.i);
      });
      // 1. The first pairs round says so first
      if (round.intro && round.ask.cells.length === 2 && S.g.level === 2) { decir(T.mmPairs, 'big'); await wait(900); if (!vivo()) return; }
      // 2. The pictures show; a good player can cover them early
      const tapar = el('button', { type: 'button', class: 'mm-skip', id: 'btn-tapar' }, T.mmSkip);
      decir([el('span', {}, T.mmLook), tapar]);
      SFX.flip();
      const abriendo = round.board.map((s, i) => s && setTimeout(() => openTile(tileAt(b, i), s), anim(i * 12)));
      barra(round.showMs, 'look');
      await new Promise(listo => {
        const cancelar = after(round.showMs, listo);
        tapar.addEventListener('click', () => { cancelar(); pararBarra(); SFX.tap(); listo(); });
      });
      abriendo.forEach(clearTimeout);
      if (!vivo()) return;
      // 3. They hide
      decir(T.mmHide);
      closeAll(b, T.mmCovered);
      await wait(380); if (!vivo()) return;
      clearPics(b);
      // 4. The player finds them
      const ok = await preguntar(b, round);
      if (!vivo()) return;
      S.g.found += S.play.found.length;
      S.rounds.push(ok);
      if (ok) { decir(T.mmWell[Math.floor(Math.random() * T.mmWell.length)], 'well'); SFX.reveal(); vibrate(20); b.classList.add('cleared'); }
      const { life, over } = endRound(S.g, ok);
      pintarVidas(!ok);
      // Saved after each round: a reload ends the game here, it does not start it over
      ctx.guardar?.(estado());
      if (life) { await wait(500); decir(T.mmLifeBack, 'well'); pintarVidas(); }
      if (over) { await wait(900); return acabar('fin'); }
      if (p.tope && S.rounds.length >= p.tope) { await wait(900); return acabar('tope'); }
      if (!ok) { await wait(400); decir(fmt(T.mmLivesLeft[forma(S.g.lives)], { n: S.g.lives }), 'bad'); }
      await wait(ok ? (life ? 1800 : 1500) : 1300);
    }
  }

  /**
   * The end: the last life lost, the trial's rounds done, or a game left halfway (`recien` false: a reload,
   * or one already finished). The cup's clock stops right here (D-130) and the result goes out now (D-150).
   */
  function acabar(motivo, { recien = true } = {}) {
    if (S.fin) return;
    S.ms = previa && !recien ? (previa.ms || 0) : Math.round(jugado);
    S.fin = true; S.answer = null;
    clearInterval(reloj); cartel.hidden = true; pararBarra();
    const e = estado();
    ctx.guardar?.(e);
    ctx.pararReloj?.(e);
    decir(motivo === 'tope' ? T.mmTrialDone : T.mmOver, 'big');
    juego.classList.add('terminado');
    fin.replaceChildren(...[
      el('p', { class: 'mm-veredicto', id: 'mm-veredicto' }, T.mmVerdicts[verdictOf(e.score)]),
      // One a Day goes straight to the result, with no button
      ctx.directo ? null : el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => ctx.terminar(estado()) }, ctx.textoFin || T.mmContinue)].filter(Boolean));
    if (ctx.directo) { setTimeout(() => ctx.terminar(estado()), recien ? 1800 : 0); return; }
    if (recien) requestAnimationFrame(() => fin.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  pintarVidas();
  // A game already played on this phone: finished, it shows finished; halfway, it ends where it was
  if (previa) {
    Object.assign(S.g, { score: previa.score | 0, level: previa.level || 1, found: previa.found | 0, misses: previa.misses | 0, lives: 0 });
    S.rounds = Array.isArray(previa.rounds) ? previa.rounds.slice() : [];
    ronda.textContent = fmt(T.mmRound, { n: S.g.level });
    pintarVidas();
    slot.replaceChildren(board(currentRound(S.g).size, { T }));
    acabar(previa.fin && p.tope && S.rounds.length >= p.tope ? 'tope' : 'fin', { recien: false });
  } else bucle();

  // For the end-to-end script: the game in play, the round on the board and the state as the cup gets it
  window.__memory = { S, estado, get round() { return S.play?.round; }, tocar: i => S.answer?.(i), congelar: on => { congelado = !!on; } };
}

/** What goes to the cup and to the result: the rounds (no cap), its card, the time and the pictures found as the tiebreak `d`. */
export function result(e) {
  const s = score(e);
  return { s, t: card(e), resumen: String(s), ms: Number.isFinite(e?.ms) ? Math.round(e.ms) : undefined, d: Math.max(0, e?.found | 0) };
}

/** How the score was reached (D-106): the rounds cleared and the pictures found. */
export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return [];
  const s = score(e), found = Math.max(0, e.found | 0);
  return [fmt(T.mmBdRounds[forma(s)], { n: s }), found ? fmt(T.mmBdFound[forma(found)], { n: found }) : null].filter(Boolean);
}
