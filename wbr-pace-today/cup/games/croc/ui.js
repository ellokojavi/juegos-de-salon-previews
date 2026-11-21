/**
 * Croc! in La Copa: cover, title, mount, result, and breakdown.
 */
import { newGame, step, act, score, card, sectorOf, COLS, FINISH_ROW, STEP, LIVES } from './engine.js';
import { createScene } from './scene.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import { isMuted } from '../../../assets/js/sound.js';
import TEXTOS from './texts.js';

await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* node */ } return (TEXTOS[l] || TEXTOS.es).ui; };

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

/* ---------------- Waiting room ---------------- */
let demoId = 0;
export function cover() {
  const canvas = h('canvas', { class: 'sp-demo', 'aria-hidden': 'true' });
  const root = h('div', { class: 'sp-portada', 'aria-hidden': 'true' }, canvas);
  const id = ++demoId;
  const sc = createScene(canvas);
  let g = null;
  let last = 0;
  let acc = 0;
  let seen = false;
  const startAt = performance.now();

  const tickDemo = now => {
    if (canvas.isConnected) seen = true;
    if (id !== demoId || (!canvas.isConnected && (seen || now - startAt > 5000))) return;
    if (canvas.isConnected && !g) { sc.measure(); g = newGame({ seed: 4821, mode: 'demo' }); sc.clear(); last = now; }
    if (g) {
      if (QUIETO()) { sc.draw(g); return; }
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (acc >= STEP) { step(g, STEP); sc.tick(STEP, g); g.events.length = 0; acc -= STEP; }
      sc.draw(g);
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
      el('span', { 'aria-hidden': 'true' }, '🐸'),
      el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'sp-lema' }, U.spLema));
}

/* ---------------- Play ---------------- */
let activeRun = 0;

export function mount(raiz, ctx) {
  const { p = {}, T, el, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const prev = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isFinite(ctx.jugadas.score) ? ctx.jugadas : null;
  const runId = ++activeRun;
  unlockAudio();

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
  const wrap = el('div', { class: 'sp-juego' }, stage, finEl);
  raiz.append(wrap);

  const sc = createScene(canvas);
  sc.measure();
  const finishRow = p.finishRow || FINISH_ROW;
  const g = newGame({ seed: p.semilla ?? 4821, finishRow, mode: 'ready' });
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
  const swipe = {
    active: false, committed: false, pointerId: null, x0: 0, y0: 0, x1: 0, y1: 0,
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
    if (-dy > 10 && -dy >= Math.abs(dx)) {
      swipe.forwardProgress = -dy / swipe.dashDist;
      swipe.dir = swipe.forwardProgress >= 1 && swipe.dashReady ? 'dash' : 'up';
      if (swipe.forwardProgress >= 1 && swipe.dashReady && !swipe.notifiedDash) {
        swipe.notifiedDash = true;
        vibrate(8);
      }
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
      const dx = swipe.x1 - swipe.x0;
      const dy = swipe.y1 - swipe.y0;
      let action = null;
      if (-dy >= swipe.dashDist && -dy >= Math.abs(dx)) action = g.dashes > 0 ? 'dash' : 'up';
      else if (-dy >= HOP_DIST && -dy >= Math.abs(dx)) action = 'up';
      if (action) trigger(action);
      swipe.fade = swipe.forwardProgress > 0 || swipe.dir ? 0.18 : 0;
    } else {
      swipe.fade = 0;
    }
  };
  stage.addEventListener('pointerup', e => endSwipe(e, true), { signal: acCtrl.signal });
  stage.addEventListener('pointercancel', e => endSwipe(e, false), { signal: acCtrl.signal });

  addEventListener('keydown', e => {
    if (S.fin || runId !== activeRun || e.target.closest?.('input, textarea')) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); trigger('up'); }
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
    if (S.fin && (S.sleepAt ||= now + 900) < now) return;
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

  window.__crocCopa = { get g() { return g; }, act: a => trigger(a), estado };
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
