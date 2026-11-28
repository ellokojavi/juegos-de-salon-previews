/**
 * 🐸 Croc! (id `croc`): its screen in La Copa, Uno al día and on its standalone page /croc/, out of the lab
 * like Sudoku (D-517's way): the cover, the traffic lever, the crossing and the result's breakdown. The engine
 * is engine.js and the drawing scene.js, both moved here from the lab prototype (/labs/croc/ is now a bridge).
 *
 * The traffic levels are La Copa's variants (D-331): `selector` is the lab's standard lever (Pintaminas',
 * Sudoku's), down and green for normal, up and red for heavy; `cover` the lab's demo, the real game playing
 * itself with a finger showing each swipe, in the variant's traffic. Heavy traffic turns the page red-violet
 * (`body.sp-hard`) while it is on screen: see `fondo`.
 *
 * What the cup page provides stays out: the countdown, the best score, the ranking, sharing, the dialogs and
 * the usage signal.
 */
import { newGame, step, act, score, card, sectorOf, randomSeed, COLS, FINISH_ROW, STEP, LIVES, LEVELS } from './engine.js';
import { createScene, DANCE_S } from './scene.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import { isMuted } from '../../../assets/js/sound.js';
import TEXTOS from './texts.js';

// Its own stylesheet, loaded with its code and before its first screen (D-468)
await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* node */ } return (TEXTOS[l] || TEXTOS.es).ui; };
const espera = ms => new Promise(r => setTimeout(r, ms));
async function enLaPagina(n) {
  for (let k = 0; k < 40 && !n.isConnected; k++) await espera(25);
  return n.isConnected;
}
const nivel = v => (LEVELS.includes(v) ? v : LEVELS[0]);

/** `cover` gets neither `el` nor `T`: a small `el` of its own. */
function h(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const x of kids.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}

/* ---------------- Sound ---------------- */
let ac = null;
let master = null;
function unlockAudio() {
  try {
    if (!ac) { ac = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* silent */ }
}
globalThis.document?.addEventListener('click', ev => { if (ev.target?.closest?.('#btn-empezar, #btn-continuar, .btn')) unlockAudio(); }, true);
function tone(f0, f1, dur, type = 'sine', vol = 0.1, delay = 0) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const o = ac.createOscillator();
    const gn = ac.createGain();
    const t0 = ac.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (_) { /* ignore */ }
}
const SND = {
  hop: () => tone(320, 540, 0.07, 'triangle', 0.08),
  dash: () => { tone(440, 980, 0.11, 'sine', 0.1); tone(660, 1120, 0.09, 'triangle', 0.06, 0.03); },
  fruit: () => { tone(740, 1080, 0.08, 'sine', 0.1); tone(1080, 1440, 0.1, 'sine', 0.09, 0.06); },
  closeCall: () => { tone(880, 1320, 0.07, 'square', 0.045); tone(1320, 1760, 0.1, 'triangle', 0.07, 0.05); },
  hit: () => tone(240, 110, 0.18, 'sawtooth', 0.1),
  crash: () => tone(200, 65, 0.3, 'sawtooth', 0.12),
  win: () => { tone(523, 523, 0.1, 'triangle', 0.1, 0); tone(659, 659, 0.1, 'triangle', 0.1, 0.09); tone(784, 784, 0.1, 'triangle', 0.1, 0.18); tone(1046, 1046, 0.24, 'triangle', 0.12, 0.27); },
};

/* ------------------------------------------------------------------ */
/* Heavy traffic's page                                                */
/* ------------------------------------------------------------------ */

/**
 * The page turns red-violet while heavy traffic is on screen, as in the lab: every piece drawn in hard carries
 * `.sp-dificil`, and the background follows the active screen (on the result, the last game's). One observer
 * watches the screens, so nothing has to remember to clear it (Sudoku's way).
 */
let ultimaDificil = false;
function fondo() {
  const activa = document.querySelector('.screen.active');
  if (activa?.id === 'screen-resultado') { document.body.classList.toggle('sp-hard', ultimaDificil); return; }
  if (activa?.id === 'screen-jugar' && !activa.querySelector('#jugar-body')?.children.length) return;
  const dificil = !!activa?.querySelector('.sp-dificil');
  if (activa?.id === 'screen-jugar') ultimaDificil = dificil;
  document.body.classList.toggle('sp-hard', dificil);
}
let vigia = null;
function vigilarFondo() {
  if (typeof document === 'undefined') return;
  if (!vigia && typeof MutationObserver !== 'undefined') {
    vigia = new MutationObserver(fondo);
    vigia.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
}

/* ------------------------------------------------------------------ */
/* Waiting room                                                        */
/* ------------------------------------------------------------------ */

/**
 * The finger over the demo: each hop of the frog is a short swipe in its direction (up, left or right), each
 * Dash a double tap with golden rings, so the cover shows the gestures and not only the game.
 */
function drawGesture(c, gs, now) {
  if (!gs) return;
  const t = (now - gs.t0) / 1000;
  const move = gs.dash ? 0.5 : 0.5, hold = 0.45;
  if (t > move + hold) return;
  const ctx = c.getContext('2d');
  const dpr = c.width / (c.clientWidth || 1);
  const w = c.clientWidth, hh = c.clientHeight;
  if (gs.dash) {
    // Double tap: two golden rings, the second 0.25 s after the first, under a 👆
    const cx = w * 0.74, cy = hh * 0.8;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 6;
    [0, 0.25].forEach(d => {
      const q = (t - d) / 0.35;
      if (q < 0 || q > 1) return;
      ctx.globalAlpha = 1 - q;
      ctx.strokeStyle = 'rgba(255, 217, 74, 0.95)';
      ctx.beginPath(); ctx.arc(cx, cy, 14 + q * 34, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = t < move ? 1 : 1 - (t - move) / hold;
    ctx.font = '50px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('👆', cx, cy - 4);
    ctx.restore();
    return;
  }
  const p = Math.min(1, t / move), ease = 1 - Math.pow(1 - p, 3);
  const alpha = t < move ? 1 : 1 - (t - move) / hold;
  const len = gs.dash ? hh * 0.55 : gs.dir === 'up' ? hh * 0.24 : w * 0.2;
  const ax = w * 0.74, ay = hh * 0.8;
  const [dx, dy] = gs.dir === 'left' ? [-1, 0] : gs.dir === 'right' ? [1, 0] : [0, -1];
  const ox = gs.dir === 'right' ? ax - len : ax, oy = ay;
  const tx = ox + dx * len * ease, ty = oy + dy * len * ease;
  // The trail stops short of the finger, so the finger reads on its own
  const gap = 30, run = Math.max(0, len * ease - gap), ex = ox + dx * run, ey = oy + dy * run;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  const grad = ctx.createLinearGradient(ox, oy, ex + 0.01, ey + 0.01);
  grad.addColorStop(0, gs.dash ? 'rgba(255, 159, 28, 0)' : 'rgba(255, 255, 255, 0)');
  grad.addColorStop(1, gs.dash ? 'rgba(255, 217, 74, 0.95)' : 'rgba(255, 255, 255, 0.85)');
  ctx.strokeStyle = gs.dash ? 'rgba(255, 217, 74, 0.35)' : 'rgba(10, 14, 28, 0.45)';
  ctx.lineWidth = gs.dash ? 26 : 20;
  if (run > 0) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke(); }
  ctx.strokeStyle = grad;
  ctx.lineWidth = gs.dash ? 10 : 7;
  if (run > 0) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(10, 14, 28, 0.55)';
  ctx.beginPath(); ctx.arc(tx, ty + 24, 30, 0, Math.PI * 2); ctx.fill();
  ctx.font = `${gs.dash ? 50 : 46}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('👆', tx, ty - 4);
  ctx.restore();
}

/**
 * The cover's demo is the real game: the engine plays a run on its own (mode 'demo', its autopilot) and the
 * game's own scene draws it, in the variant's traffic, slower than the real game (55 %) so there is time to see
 * each swipe. With reduced motion it is one still frame of a fixed track. It sleeps off screen (onScreen).
 */
let demoId = 0;
export function cover({ variante } = {}) {
  vigilarFondo();
  const difficulty = nivel(variante);
  const canvas = h('canvas', { class: 'sp-demo', id: 'sp-demo', 'aria-hidden': 'true' });
  const root = h('div', { class: `sp-portada${difficulty === 'hard' ? ' sp-dificil' : ''}`, 'aria-hidden': 'true' }, canvas);
  const id = ++demoId;
  const sc = createScene(canvas);
  const nuevo = () => { g = newGame({ seed: QUIETO() ? 4821 : randomSeed(), difficulty, mode: 'demo' }); sc.clear(); };
  let g = null;
  let last = 0;
  let acc = 0;
  let seen = false;
  let gesture = null;
  const startAt = performance.now();

  const tickDemo = now => {
    if (canvas.isConnected) seen = true;
    if (id !== demoId || (!canvas.isConnected && (seen || now - startAt > 5000))) return;
    if (canvas.isConnected && !g) { sc.measure(); nuevo(); last = now; }
    if (g) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (QUIETO()) acc = 0; else acc += dt * 0.55;
      while (acc >= STEP) {
        step(g, STEP);
        sc.tick(STEP, g);
        acc -= STEP;
        for (const ev of g.events.splice(0)) {
          if (ev.type === 'hop' || ev.type === 'dash') gesture = { dir: ev.type === 'dash' ? 'up' : ev.dir, dash: ev.type === 'dash', t0: now };
          sc.fx(ev, g, { closeCall: UI().spCloseCall });
        }
        if (g.mode === 'win' || g.mode === 'crash') { nuevo(); break; }
      }
      sc.draw(g, null);
      if (!QUIETO()) drawGesture(canvas, gesture, now);
    }
    next();
  };
  const next = onScreen(canvas, tickDemo);
  next();
  return root;
}

export function title({ el, J }) {
  const U = UI();
  return el('div', { class: 'sp-cabeza' },
    el('h2', { class: 'sp-titulo' },
      el('span', { class: 'sp-logo', 'aria-hidden': 'true' }, '🐸'),
      el('span', { class: 'display display--lg rainbow sp-nombre' }, J.nombre)),
    el('p', { class: 'sp-lema' }, U.spLema));
}

/**
 * The traffic lever (the lab's, the standard one: Pintaminas', Sudoku's): down with a green knob is normal,
 * up with a red knob is heavy. Flipping it calls `cambiar`, which redraws the waiting room: the new lever
 * starts where the old one was and swings over, with a ring of electricity, a flash and sparks.
 */
let desde = null;
let parpadeoVez = 0;
export function selector({ el, T, SFX, vibrate, variante, cambiar }) {
  vigilarFondo();
  const dificil = nivel(variante) === 'hard';
  const animar = desde !== null && desde !== dificil && !QUIETO();
  desde = null;
  const titulo = el('b', {}), sub = el('span', { class: 'muted' });
  const plate = el('span', { class: 'sp-plate', 'aria-hidden': 'true' },
    el('span', { class: 'sp-track', html: '<svg viewBox="0 0 70 60"><path class="sp-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'sp-bolt b1' }, '⚡'), el('span', { class: 'sp-bolt b2' }, '⚡'), el('span', { class: 'sp-bolt b3' }, '⚡'),
    el('span', { class: 'sp-arm' }, el('span', { class: 'sp-knob' })), el('span', { class: 'sp-axle' }));
  const caja = el('button', {
    type: 'button', class: 'sp-lever', id: 'btn-level', role: 'switch', 'aria-label': T.spModo[1].titulo,
    onClick: () => {
      desde = dificil;
      if (!dificil) { relampago(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      cambiar(dificil ? 'normal' : 'hard');
    },
  }, plate, el('span', { class: 'sp-label' }, titulo, sub));
  const poner = on => {
    caja.classList.toggle('on', on); caja.classList.toggle('sp-dificil', on);
    caja.setAttribute('aria-checked', String(on));
    titulo.textContent = T.spModo[+on].titulo; sub.textContent = T.spModo[+on].sub;
  };
  poner(dificil);
  if (animar) {
    caja.classList.toggle('on', !dificil);
    (async () => {
      if (!await enLaPagina(caja)) return;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      caja.classList.toggle('on', dificil);
      const w = el('span', { class: 'sp-wave' + (dificil ? ' hard' : ''), 'aria-hidden': 'true' });
      plate.append(w);
      setTimeout(() => w.remove(), 900);
      caja.classList.remove('zap'); void caja.offsetWidth; caja.classList.add('zap');
    })();
  }
  if (dificil) parpadear(caja);
  return caja;
}

/** The flash over the whole view when switching to heavy traffic. */
function relampago() {
  if (QUIETO()) return;
  const x = document.createElement('div');
  x.className = 'sp-flash';
  x.setAttribute('aria-hidden', 'true');
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}

/** While heavy traffic is on, the lever's glow flickers like a bad contact; still with reduced motion. */
function parpadear(caja) {
  const vez = ++parpadeoVez;
  if (QUIETO()) return;
  const paso = () => {
    if (vez !== parpadeoVez || !caja.isConnected) { caja.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    caja.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(paso, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  enLaPagina(caja).then(si => si && paso());
}

/* ---------------- Play ---------------- */
let activeRun = 0;

export function mount(raiz, ctx) {
  vigilarFondo();
  const { p = {}, T, el, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const prev = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isFinite(ctx.jugadas.score) ? ctx.jugadas : null;
  const runId = ++activeRun;
  unlockAudio();

  const difficulty = nivel(p.difficulty);
  const canvas = el('canvas', { class: 'sp-lienzo', 'aria-hidden': 'true' });
  const distEl = el('span', {}, '0/33');
  const sectorEl = el('small', {}, T.spSector1);
  const livesEl = el('div', { class: 'sp-lives' }, '❤️❤️❤️');
  const dashesEl = el('div', { class: 'sp-lives' }, '⚡⚡⚡');
  const scoreEl = el('div', { class: 'sp-score', 'aria-live': 'polite' }, '0');
  const pauseEl = el('div', { class: 'sp-pausa', hidden: true },
    el('span', { class: 'display display--lg' }, T.spPaused),
    el('span', {}, T.spResume));

  const stage = el('div', { class: 'sp-escenario', tabindex: 0 },
    canvas,
    el('div', { class: 'sp-hud' },
      el('div', { class: 'sp-pill' }, distEl, sectorEl, livesEl, dashesEl),
      el('div', { class: 'sp-center' }, scoreEl)),
    pauseEl);
  const finEl = el('div', { class: 'sp-fin' });
  const wrap = el('div', { class: `sp-juego${difficulty === 'hard' ? ' sp-dificil' : ''}` }, stage, finEl);
  raiz.append(wrap);

  const sc = createScene(canvas);
  sc.measure();
  const finishRow = p.finishRow || FINISH_ROW;
  const g = newGame({ seed: p.semilla ?? 4821, finishRow, difficulty, mode: 'ready' });
  new ResizeObserver(() => { if (runId === activeRun && canvas.isConnected) sc.measure(); }).observe(stage);

  const S = { fin: false, paused: false, pauseAt: 0, pausedMs: 0, startedAt: 0, ms: 0, last: performance.now(), acc: 0 };

  const paintHud = () => {
    const row = g.frog.row;
    const sec = sectorOf(row);
    distEl.textContent = fmt(T.spDist, { row, total: g.finishRow });
    sectorEl.textContent = sec === 1 ? T.spSector1 : sec === 2 ? T.spSector2 : T.spSector3;
    const maxL = g.maxLives || LIVES;
    livesEl.textContent = '❤️'.repeat(Math.max(0, g.lives | 0)) + '🖤'.repeat(Math.max(0, maxL - (g.lives | 0)));
    dashesEl.textContent = g.dashes > 0 ? '⚡'.repeat(g.dashes) : '⚡ 0';
    scoreEl.textContent = String(g.score);
  };
  paintHud();

  const estado = () => ({
    fin: S.fin,
    won: g.mode === 'win',
    score: g.score,
    maxRow: g.maxRow,
    finishRow: g.finishRow,
    difficulty: g.difficulty,
    fruitsTaken: g.fruitsTaken,
    lives: g.lives,
    lifePenalty: g.lifePenalty,
    closeCalls: g.closeCalls,
    timeBonus: g.timeBonus,
    ms: S.fin ? S.ms : (S.startedAt ? Math.round(performance.now() - S.startedAt - S.pausedMs) : 0),
  });

  const acCtrl = new AbortController();
  const pause = () => {
    if (!canvas.isConnected) { acCtrl.abort(); return; }
    if (S.fin || S.paused || runId !== activeRun || g.mode !== 'play') return;
    S.paused = true;
    S.pauseAt = performance.now();
    pauseEl.hidden = false;
  };
  const resume = () => {
    S.pausedMs += performance.now() - S.pauseAt;
    S.paused = false;
    pauseEl.hidden = true;
    S.last = performance.now();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: acCtrl.signal });
  addEventListener('pagehide', pause, { signal: acCtrl.signal });
  pauseEl.addEventListener('pointerdown', e => { e.preventDefault(); resume(); }, { signal: acCtrl.signal });

  function finish(reason, { fresh = true } = {}) {
    if (S.fin) return;
    S.ms = S.startedAt ? Math.round(performance.now() - S.startedAt - S.pausedMs) : (prev?.ms || 0);
    S.fin = true;
    S.paused = false;
    pauseEl.hidden = true;
    acCtrl.abort();
    const st = estado();
    ctx.guardar?.(st);
    ctx.pararReloj?.(st);
    finEl.replaceChildren(
      el('p', { class: 'sp-veredicto' }, reason === 'win' ? T.spWin : T.spCrash),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => ctx.terminar(estado()) }, ctx.textoFin || T.spContinue));
    if (fresh) requestAnimationFrame(() => finEl.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  function trigger(action) {
    if (S.fin || runId !== activeRun) return;
    if (S.paused) { resume(); return; }
    if (g.mode === 'ready') { S.startedAt = performance.now(); unlockAudio(); }
    if (act(g, action)) {
      ctx.guardar?.(estado());
      paintHud();
    }
  }

  const SWIPE_EDGE_PAD = 18;
  const HOP_DIST = 24;
  const tileDashDist = rect => Math.max(84, Math.round(Math.min(rect.width / COLS, rect.height / 11.5) * 2.4));
  const TAP_MAX_MS = 250, DOUBLE_TAP_MS = 320;
  let lastTap = 0;
  const swipe = {
    t0: 0, active: false, committed: false, pointerId: null, x0: 0, y0: 0, x1: 0, y1: 0,
    dashDist: 120, hopDist: HOP_DIST, forwardProgress: 0,
    dashReady: true, notifiedDash: false, dir: null, fade: 0,
  };
  const blockScroll = e => { if (!e.target.closest?.('button')) e.preventDefault(); };
  stage.addEventListener('touchstart', blockScroll, { passive: false, signal: acCtrl.signal });
  stage.addEventListener('touchmove', blockScroll, { passive: false, signal: acCtrl.signal });
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest?.('button') || S.fin || S.paused || runId !== activeRun) return;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < SWIPE_EDGE_PAD || x > rect.width - SWIPE_EDGE_PAD || y < SWIPE_EDGE_PAD || y > rect.height - SWIPE_EDGE_PAD) return;
    e.preventDefault();
    unlockAudio();
    swipe.active = true;
    swipe.t0 = performance.now();
    swipe.committed = false;
    swipe.pointerId = e.pointerId;
    swipe.dashDist = tileDashDist(rect);
    swipe.x0 = x; swipe.y0 = y; swipe.x1 = x; swipe.y1 = y;
    swipe.forwardProgress = 0;
    swipe.dashReady = g.dashes > 0;
    swipe.notifiedDash = false;
    swipe.dir = null;
    swipe.fade = 0;
    try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  }, { signal: acCtrl.signal });
  stage.addEventListener('pointermove', e => {
    if (!swipe.active || swipe.committed || e.pointerId !== swipe.pointerId) return;
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    swipe.x1 = e.clientX - rect.left;
    swipe.y1 = e.clientY - rect.top;
    const dx = swipe.x1 - swipe.x0;
    const dy = swipe.y1 - swipe.y0;
    swipe.dashReady = g.dashes > 0;
    if (Math.abs(dy) >= HOP_DIST && Math.abs(dy) > Math.abs(dx)) {
      swipe.committed = true;
      swipe.dir = dy < 0 ? 'up' : 'down';
      trigger(swipe.dir);
    } else if (Math.abs(dx) >= HOP_DIST && Math.abs(dx) > Math.abs(dy)) {
      swipe.committed = true;
      swipe.forwardProgress = 0;
      swipe.dir = dx < 0 ? 'left' : 'right';
      trigger(swipe.dir);
    } else {
      swipe.forwardProgress = 0;
      swipe.dir = null;
    }
  }, { signal: acCtrl.signal });
  const endSwipe = (e, commit) => {
    if (!swipe.active || e.pointerId !== swipe.pointerId) return;
    const alreadyCommitted = swipe.committed;
    swipe.active = false;
    swipe.committed = false;
    swipe.pointerId = null;
    if (commit && !alreadyCommitted) {
      // A short, still touch is a tap; two quick taps are the Dash
      const moved = Math.hypot(swipe.x1 - swipe.x0, swipe.y1 - swipe.y0);
      const now = performance.now();
      if (moved < HOP_DIST && now - swipe.t0 < TAP_MAX_MS) {
        if (now - lastTap < DOUBLE_TAP_MS) { lastTap = 0; trigger('dash'); } else lastTap = now;
      }
      swipe.fade = 0;
    } else {
      swipe.fade = 0;
    }
  };
  stage.addEventListener('pointerup', e => endSwipe(e, true), { signal: acCtrl.signal });
  stage.addEventListener('pointercancel', e => endSwipe(e, false), { signal: acCtrl.signal });

  addEventListener('keydown', e => {
    if (S.fin || runId !== activeRun || e.target.closest?.('input, textarea')) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); trigger('up'); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); trigger('down'); }
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); trigger('left'); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); trigger('right'); }
    else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); trigger('dash'); }
  }, { signal: acCtrl.signal });

  const onEvent = ev => {
    if (ev.type === 'hop') SND.hop();
    else if (ev.type === 'dash') { SND.dash(); vibrate(12); }
    else if (ev.type === 'fruit') { SND.fruit(); vibrate(10); }
    else if (ev.type === 'closeCall') { SND.closeCall(); vibrate(18); }
    else if (ev.type === 'hit') { SND.hit(); vibrate(40); ctx.guardar?.(estado()); }
    else if (ev.type === 'crash') { SND.crash(); vibrate(80); finish('crash'); }
    else if (ev.type === 'win') { SND.win(); vibrate([20, 30, 30]); finish('win'); }
    sc.fx(ev, g, { closeCall: T.spCloseCall });
  };

  const frame = now => {
    if (runId !== activeRun || !canvas.isConnected) { acCtrl.abort(); return; }
    if (!S.paused) {
      S.acc += Math.min(0.05, (now - S.last) / 1000);
      while (S.acc >= STEP) {
        step(g, STEP);
        sc.tick(STEP, g);
        S.acc -= STEP;
        if (g.events.length) {
          g.events.splice(0).forEach(onEvent);
          paintHud();
        }
      }
    }
    const dtFrame = Math.min(0.05, (now - S.last) / 1000);
    if (swipe.fade > 0) swipe.fade = Math.max(0, swipe.fade - dtFrame);
    S.last = now;
    sc.draw(g, swipe);
    if (S.fin && (S.sleepAt ||= now + (g.mode === 'win' ? DANCE_S * 1000 + 300 : 900)) < now) return;
    requestAnimationFrame(frame);
  };

  if (prev) {
    g.score = prev.score | 0;
    g.maxRow = prev.maxRow | 0;
    g.fruitsTaken = prev.fruitsTaken | 0;
    g.closeCalls = prev.closeCalls | 0;
    g.timeBonus = prev.timeBonus | 0;
    g.mode = prev.won ? 'win' : 'crash';
    g.frog.row = g.maxRow;
    g.frog.y = g.maxRow;
    paintHud();
    finish(prev.won ? 'win' : 'crash', { fresh: false });
    S.ms = prev.ms || 0;
  } else {
    stage.focus({ preventScroll: true });
  }
  requestAnimationFrame(frame);

  // Hook for end-to-end tests (C-14)
  window.__croc = { get g() { return g; }, state: () => g, act: a => trigger(a), estado };
}

export function result(e) {
  const s = score(e);
  const ms = Number.isFinite(e?.ms) ? Math.round(e.ms) : 0;
  const maxRow = Math.max(0, e?.maxRow | 0);
  return {
    s,
    t: card(e),
    resumen: String(s),
    ms: Number.isFinite(e?.ms) ? ms : undefined,
    d: e?.won ? 1_000_000_000 - ms : maxRow,
  };
}

export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return [];
  const rows = Math.max(0, e.maxRow | 0);
  const total = Math.max(1, e.finishRow | 0);
  const fruits = Math.max(0, e.fruitsTaken | 0);
  const lifePenalty = Math.max(0, e.lifePenalty | 0);
  return [
    fmt(T.spBdDist, { n: rows, total }),
    fruits ? fmt(T.spBdBonus[forma(fruits)], { n: fruits }) : null,
    lifePenalty ? fmt(T.spBdLives, { n: lifePenalty }) : null,
  ].filter(Boolean);
}
