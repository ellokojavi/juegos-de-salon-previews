/**
 * Croc!: screens, touch/keyboard input, audio synth, session resume (C-6), sharing (C-7),
 * and result exits (C-19). Simulation is in engine.js; rendering is in scene.js.
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound, isMuted } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { cuentaRegresiva } from '../../assets/js/cuenta-regresiva.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { bloqueTabla, avisoPartida } from '../../assets/js/ranking.js';
import { rankingsVisibles } from '../../assets/js/jugador.js';
import { GAME_ID, FINISH_ROW, DEFAULT_CONFIG, LOCALES } from './rules.js';
import * as E from './engine.js';
import { createScene } from './scene.js';
import manifest from '../../assets/js/manifests/labs/croc.js';

trackVisit();

// C-20 / D-535 one-time localStorage migration from the old id sapiondo
try {
  for (const suffix of ['best', 'diff', 'session']) {
    const oldK = `juegos-de-salon:sapiondo:${suffix}`;
    const newK = `juegos-de-salon:${GAME_ID}:${suffix}`;
    const v = localStorage.getItem(oldK);
    if (v !== null && localStorage.getItem(newK) === null) localStorage.setItem(newK, v);
    if (v !== null) localStorage.removeItem(oldK);
  }
} catch (_) { /* ignore */ }

const BEST_KEY = `juegos-de-salon:${GAME_ID}:best`;
const DIFF_KEY = `juegos-de-salon:${GAME_ID}:diff`;
const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

// Support ?seed=1234 in URL for repeatable Cup-style trials
const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
let currentSeed = urlSeed > 0 ? Math.floor(urlSeed) : E.randomSeed();
let difficulty = 'normal';

let g = null;
let paused = false;
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) { /* ignore */ }

/* ---------------- WebAudio arcade tones ---------------- */
let ac = null;
let master = null;
function unlockAudio() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.connect(ac.destination);
    }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* silent fallback */ }
}
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
  hit: () => { tone(240, 110, 0.18, 'sawtooth', 0.1); },
  crash: () => { tone(200, 65, 0.3, 'sawtooth', 0.12); },
  win: () => {
    tone(523, 523, 0.1, 'triangle', 0.1, 0);
    tone(659, 659, 0.1, 'triangle', 0.1, 0.09);
    tone(784, 784, 0.1, 'triangle', 0.1, 0.18);
    tone(1046, 1046, 0.24, 'triangle', 0.12, 0.27);
  },
};

/* ---------------- Screen & HUD ---------------- */
const scene = createScene($('#canvas'));
new ResizeObserver(() => scene.measure()).observe($('#stage'));

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (id === 'screen-play') scene.measure();
}

const save = () => {
  if (!g || g.mode === 'demo') return;
  store.save({
    mode: 'solo',
    state: E.serialize(g),
    done: g.mode === 'win' || g.mode === 'crash',
  });
};

function updateHud() {
  if (!g) return;
  const row = g.frog.row;
  const sec = E.sectorOf(row);
  $('#hud-dist').textContent = fmt(T.hudDist, { row, total: g.finishRow });
  $('#hud-sector').textContent = sec === 1 ? T.sector1 : sec === 2 ? T.sector2 : T.sector3;
  $('#hud-score').textContent = String(g.score);
  $('#hud-time').textContent = `${g.elapsed.toFixed(1)}s`;
  const maxL = g.maxLives || E.LIVES;
  $('#hud-lives').textContent = '❤️'.repeat(Math.max(0, g.lives | 0)) + '🖤'.repeat(Math.max(0, maxL - (g.lives | 0)));
  $('#hud-dashes').textContent = g.dashes > 0 ? '⚡'.repeat(g.dashes) : '⚡ 0';
}

/* ---------------- Intro ---------------- */
/**
 * The cover's demo is the real game: the engine plays a run on its own (mode 'demo', its autopilot)
 * and the game's own scene draws it, so the cover shows the frog, the cars, the canal and the boats
 * as they are. It follows the lever's traffic; the finger over it shows each swipe (drawGesture).
 */
let demoG = null;
let demoScene = null;
let demoRun = 0;
function newDemo() {
  // With reduced motion the demo is one still frame: of a fixed track, so it is the same every time
  demoG = E.newGame({ ...DEFAULT_CONFIG, seed: QUIET() ? 4821 : E.randomSeed(), difficulty, mode: 'demo' });
  demoScene?.clear();
}
/**
 * The finger over the demo: each hop of the frog is a short swipe in its direction (up, left or right),
 * each Dash a long swipe up with a golden trail, so the cover shows the gestures and not only the game.
 */
function drawGesture(c, gs, now) {
  if (!gs) return;
  const t = (now - gs.t0) / 1000;
  const move = gs.dash ? 0.75 : 0.5, hold = 0.45;
  if (t > move + hold) return;
  const ctx = c.getContext('2d');
  const dpr = c.width / (c.clientWidth || 1);
  const w = c.clientWidth, h = c.clientHeight;
  const p = Math.min(1, t / move), ease = 1 - Math.pow(1 - p, 3);
  const alpha = t < move ? 1 : 1 - (t - move) / hold;
  const len = gs.dash ? h * 0.55 : gs.dir === 'up' ? h * 0.24 : w * 0.2;
  const ax = w * 0.74, ay = h * 0.8;
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

function startDashDemo() {
  const c = $('#dash-demo');
  if (!c) return;
  if (!demoScene) {
    demoScene = createScene(c);
    new ResizeObserver(() => demoScene.measure()).observe(c);
  }
  newDemo();
  demoScene.measure();
  const run = ++demoRun;
  let last = performance.now();
  let acc = 0;
  let gesture = null;
  const frame = now => {
    if (run !== demoRun) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if ($('#screen-intro').classList.contains('active')) {
      // Slower than the real game (55 %), so the cover has time to show each swipe
      if (QUIET()) acc = 0; else acc += dt * 0.55;
      while (acc >= E.STEP) {
        E.step(demoG, E.STEP);
        demoScene.tick(E.STEP, demoG);
        acc -= E.STEP;
        for (const ev of demoG.events.splice(0)) {
          if (ev.type === 'hop' || ev.type === 'dash') gesture = { dir: ev.type === 'dash' ? 'up' : ev.dir, dash: ev.type === 'dash', t0: now };
          demoScene.fx(ev, demoG, { closeCall: T.closeCall });
        }
        if (demoG.mode === 'win' || demoG.mode === 'crash') { newDemo(); break; }
      }
      demoScene.draw(demoG, null);
      drawGesture(c, gesture, now);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.state) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', {
        class: 'btn btn--cyan btn--sm',
        onClick: () => {
          unlockAudio();
          g = E.hydrate(saved.state);
          if (!g) return startRun(currentSeed);
          paused = false;
          $('#pause-layer').hidden = true;
          scene.clear();
          showScreen('screen-play');
          updateHud();
        },
      }, T.resume),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        onClick: () => { store.clear(); renderResumeSlot(); },
      }, T.delete),
    ),
  ));
}

const QUIET = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function setDiffTheme(on) {
  document.body.classList.toggle('sp-hard', on);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', on ? '#1c020a' : '#0b0e18');
}

function triggerLightning() {
  if (QUIET()) return;
  const f = el('div', { class: 'sp-flash', 'aria-hidden': 'true' });
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 600);
}

function wave(lever, hard) {
  const w = el('span', { class: 'sp-wave' + (hard ? ' hard' : ''), 'aria-hidden': 'true' });
  lever.querySelector('.sp-plate').append(w);
  setTimeout(() => w.remove(), 900);
  lever.classList.remove('zap'); void lever.offsetWidth; lever.classList.add('zap');
}

/* The traffic lever: the standard lever (Pintaminas', Sudoku's). Down and green is normal, up and red is heavy;
   on, the rectangle flickers at random like a bad contact (--glow from 0 to 1) */
let flicker = 0;
function startFlicker(lever) {
  const n = ++flicker;
  if (QUIET()) return;
  const step = () => {
    if (n !== flicker || !lever.isConnected || difficulty !== 'hard') { lever.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    lever.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(step, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  step();
}

function trafficLever() {
  const hard = difficulty === 'hard';
  setDiffTheme(hard);
  const title = el('b', {}, T.diffSwitch[+hard].title);
  const sub = el('span', { class: 'muted' }, T.diffSwitch[+hard].sub);
  const lever = el('button', {
    type: 'button', class: 'sp-lever' + (hard ? ' on' : ''), id: 'btn-level', role: 'switch',
    'aria-checked': String(hard), 'aria-label': T.diffSwitch[1].title,
    onClick: () => {
      difficulty = difficulty === 'hard' ? 'normal' : 'hard';
      const on = difficulty === 'hard';
      try { localStorage.setItem(DIFF_KEY, difficulty); } catch (_) { /* ignore */ }
      if (on) { triggerLightning(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      lever.classList.toggle('on', on);
      lever.setAttribute('aria-checked', String(on));
      title.textContent = T.diffSwitch[+on].title;
      sub.textContent = T.diffSwitch[+on].sub;
      if (!QUIET()) wave(lever, on);
      if (on) startFlicker(lever); else flicker++;
      setDiffTheme(on);
      newDemo();
    },
  },
  el('span', { class: 'sp-plate', 'aria-hidden': 'true' },
    el('span', { class: 'sp-track', html: '<svg viewBox="0 0 70 60"><path class="sp-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'sp-bolt b1' }, '⚡'), el('span', { class: 'sp-bolt b2' }, '⚡'), el('span', { class: 'sp-bolt b3' }, '⚡'),
    el('span', { class: 'sp-arm' }, el('span', { class: 'sp-knob' })), el('span', { class: 'sp-axle' })),
  el('span', { class: 'sp-label' }, title, sub));
  if (hard) startFlicker(lever);
  return lever;
}

function renderIntro() {
  $('#modes').replaceChildren(
    trafficLever(),
    el('button', {
      class: 'btn btn--yellow',
      id: 'btn-play',
      'data-mode': 'solo',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(currentSeed); },
    }, T.modeSolo),
  );
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));

  const bestEl = $('#best-cover');
  if (best > 0) {
    bestEl.hidden = false;
    bestEl.replaceChildren(fmt(T.bestCover, { n: '' }), el('b', {}, String(best)));
  } else {
    bestEl.hidden = true;
  }

  $('#cover-ranking').replaceChildren(bloqueTabla({ tabla: GAME_ID, titulo: String((C.rk?.titleOf || '{game}')).replace('{game}', T.title), alTocar: () => SFX.tap() }));
  renderResumeSlot();
  startDashDemo();
  footerInto($('#pie'), { screen: 'croc-cover', lang });
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
}

/* ---------------- Play & Result ---------------- */
function startRun(seed) {
  // A second tap while the 3, 2, 1 runs counts once (C-14, D-576)
  if (counting) return;
  currentSeed = seed;
  paused = false;
  $('#pause-layer').hidden = true;
  g = E.newGame({ ...DEFAULT_CONFIG, seed: currentSeed, difficulty, mode: 'ready' });
  scene.clear();
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1, difficulty });
  showScreen('screen-play');
  updateHud();
  $('#stage').focus({ preventScroll: true });
  // The traditional 3, 2, 1 (D-105): the road already moves below, the frog waits until «¡A jugar!»
  counting = true;
  cuentaRegresiva({ titulo: `🐸 ${T.title}`, ya: T.go }).then(() => { counting = false; });
}

function finishRun() {
  save();
  const isWin = g.mode === 'win';
  const isBest = g.score > best;
  if (isBest) {
    best = g.score;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) { /* ignore */ }
  }
  trackFinish({
    detalle: `${g.score} pts · ${g.maxRow}/${g.finishRow} lanes · ${g.elapsed.toFixed(1)}s · ${g.fruitsTaken} fruits · ${g.closeCalls} close · seed ${g.seed}`,
  });

  // The emoji apart from the words, with a gap, so the big display letters do not touch it
  const [icon, ...words] = (isBest ? T.resultBest : isWin ? T.resultWin : T.resultCrash).split(' ');
  $('#result-title').replaceChildren(el('span', { class: 'result-icon', 'aria-hidden': 'true' }, icon), words.join(' '));
  $('#lbl-stat-dist').textContent = T.statDistance;
  $('#lbl-stat-bonus').textContent = T.statBonus;
  $('#lbl-stat-lives').textContent = T.statLives;
  $('#lbl-stat-time').textContent = T.statTime;
  $('#lbl-stat-total').textContent = T.statTotal;

  $('#val-dist').textContent = `+${g.distanceScore}`;
  $('#val-bonus').textContent = `+${g.bonusScore}`;
  $('#val-lives').textContent = g.lifePenalty ? `-${g.lifePenalty}` : '0';
  $('#val-time').textContent = `${g.elapsed.toFixed(1)}s`;
  $('#val-total').textContent = String(g.score);
  $('#val-meta').textContent = fmt(T.statMeta, {
    lanes: g.maxRow,
    total: g.finishRow,
    time: g.elapsed.toFixed(1),
    fruits: g.fruitsTaken,
    close: g.closeCalls,
  });

  const shareSummary = fmt(isWin ? T.shareLineWin : T.shareLineCrash, {
    total: FINISH_ROW,
    lanes: g.maxRow,
    time: g.elapsed.toFixed(1),
    score: g.score,
    seed: g.seed,
  });

  $('#result-actions').replaceChildren(
    el('button', {
      class: 'btn btn--yellow',
      id: 'btn-replay-same',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(g.seed); },
    }, fmt(T.againSame, { seed: g.seed })),
    el('button', {
      class: 'btn btn--cyan',
      id: 'btn-replay-new',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(E.randomSeed()); },
    }, T.againNew),
    botonCompartir({
      rotulo: T.shareRotulo,
      id: 'btn-share',
      alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title,
        url: `${location.origin}${location.pathname}?seed=${g.seed}`,
        texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: fmt(T.shareContext, { seed: g.seed }) }), shareSummary].join('\n\n'),
      }),
    }),
  );
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  const rkEl = $('#ranking');
  const rkTitle = String((C.rk?.titleOf || '{game}')).replace('{game}', T.title);
  const tablaFin = bloqueTabla({ tabla: GAME_ID, titulo: rkTitle, entrar: false });
  const ms = Math.round(g.elapsed * 1000);
  rkEl.replaceChildren(...(rankingsVisibles() ? [avisoPartida({ juego: GAME_ID, s: g.score, ms, alAnotar: () => tablaFin.recargar() })] : []), tablaFin);
  if (isWin || isBest) confetti();
  showScreen('screen-result');
}

/* ---------------- Controls (board swipes + keyboard) ---------------- */
let counting = false;
function triggerAction(action) {
  if (counting) return;
  if (!g || g.mode === 'demo' || g.mode === 'win' || g.mode === 'crash') return;
  if (paused) {
    paused = false;
    $('#pause-layer').hidden = true;
    return;
  }
  const ok = E.act(g, action);
  if (ok) {
    save();
    updateHud();
  }
}

const SWIPE_EDGE_PAD = 18;
const HOP_DIST = 24;
const tileDashDist = rect => Math.max(84, Math.round(Math.min(rect.width / E.COLS, rect.height / 11.5) * 2.4));
const swipe = {
  active: false,
  committed: false,
  pointerId: null,
  x0: 0,
  y0: 0,
  x1: 0,
  y1: 0,
  dashDist: 120,
  hopDist: HOP_DIST,
  forwardProgress: 0,
  dashReady: true,
  notifiedDash: false,
  dir: null,
  fade: 0,
};

const stageEl = $('#stage');
const blockScroll = e => { if (!e.target.closest?.('button')) e.preventDefault(); };
stageEl.addEventListener('touchstart', blockScroll, { passive: false });
stageEl.addEventListener('touchmove', blockScroll, { passive: false });

stageEl.addEventListener('pointerdown', e => {
  if (e.target.closest?.('button') || paused || !g || g.mode === 'win' || g.mode === 'crash') return;
  const rect = stageEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < SWIPE_EDGE_PAD || x > rect.width - SWIPE_EDGE_PAD || y < SWIPE_EDGE_PAD || y > rect.height - SWIPE_EDGE_PAD) return;
  e.preventDefault();
  unlockAudio();
  swipe.active = true;
  swipe.committed = false;
  swipe.pointerId = e.pointerId;
  swipe.dashDist = tileDashDist(rect);
  swipe.x0 = x;
  swipe.y0 = y;
  swipe.x1 = x;
  swipe.y1 = y;
  swipe.forwardProgress = 0;
  swipe.dashReady = g.dashes > 0;
  swipe.notifiedDash = false;
  swipe.dir = null;
  swipe.fade = 0;
  try { stageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
});

stageEl.addEventListener('pointermove', e => {
  if (!swipe.active || swipe.committed || e.pointerId !== swipe.pointerId) return;
  e.preventDefault();
  const rect = stageEl.getBoundingClientRect();
  swipe.x1 = e.clientX - rect.left;
  swipe.y1 = e.clientY - rect.top;
  const dx = swipe.x1 - swipe.x0;
  const dy = swipe.y1 - swipe.y0;
  swipe.dashReady = !!g && g.dashes > 0;
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
    triggerAction(swipe.dir);
  } else {
    swipe.forwardProgress = 0;
    swipe.dir = null;
  }
});

function endSwipe(e, commit) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return;
  const alreadyCommitted = swipe.committed;
  swipe.active = false;
  swipe.committed = false;
  swipe.pointerId = null;
  if (commit && !alreadyCommitted) {
    const dx = swipe.x1 - swipe.x0;
    const dy = swipe.y1 - swipe.y0;
    let action = null;
    if (-dy >= swipe.dashDist && -dy >= Math.abs(dx)) action = g && g.dashes > 0 ? 'dash' : 'up';
    else if (-dy >= HOP_DIST && -dy >= Math.abs(dx)) action = 'up';
    if (action) triggerAction(action);
    swipe.fade = swipe.forwardProgress > 0 || swipe.dir ? 0.18 : 0;
  } else {
    swipe.fade = 0;
  }
}

stageEl.addEventListener('pointerup', e => endSwipe(e, true));
stageEl.addEventListener('pointercancel', e => endSwipe(e, false));

$('#btn-pause').addEventListener('click', () => {
  if (!g || g.mode !== 'play') return;
  paused = !paused;
  $('#pause-layer').hidden = !paused;
});
$('#pause-layer').addEventListener('pointerdown', () => {
  paused = false;
  $('#pause-layer').hidden = true;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && g?.mode === 'play') {
    paused = true;
    $('#pause-layer').hidden = false;
    save();
  }
});

addEventListener('keydown', e => {
  if (!$('#screen-play').classList.contains('active')) return;
  if (e.target.closest?.('input, textarea')) return;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); triggerAction('up'); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); triggerAction('left'); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); triggerAction('right'); }
  else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); triggerAction('dash'); }
  else if (e.code === 'KeyP') {
    if (g?.mode === 'play') { paused = !paused; $('#pause-layer').hidden = !paused; }
  }
});

/* ---------------- Fixed-timestep game loop ---------------- */
let lastFrame = performance.now();
let acc = 0;
let resultTimeout = null;

function handleEvent(ev) {
  if (ev.type === 'hop') SND.hop();
  else if (ev.type === 'dash') { SND.dash(); vibrate(12); }
  else if (ev.type === 'fruit') { SND.fruit(); vibrate(10); }
  else if (ev.type === 'closeCall') { SND.closeCall(); vibrate(18); }
  else if (ev.type === 'hit') { SND.hit(); vibrate(40); save(); }
  else if (ev.type === 'crash') {
    SND.crash();
    vibrate(80);
    clearTimeout(resultTimeout);
    resultTimeout = setTimeout(finishRun, 550);
  } else if (ev.type === 'win') {
    SND.win();
    vibrate([20, 30, 30]);
    clearTimeout(resultTimeout);
    resultTimeout = setTimeout(finishRun, 650);
  }
  scene.fx(ev, g, { closeCall: T.closeCall });
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (g && !paused && $('#screen-play').classList.contains('active')) {
    acc += dt;
    while (acc >= E.STEP) {
      E.step(g, E.STEP);
      scene.tick(E.STEP, g);
      acc -= E.STEP;
      if (g.events.length) {
        const evs = g.events.splice(0);
        evs.forEach(handleEvent);
      }
    }
    if (swipe.fade > 0) swipe.fade = Math.max(0, swipe.fade - dt);
    updateHud();
    scene.draw(g, swipe);
  }
  requestAnimationFrame(loop);
}

/* ---------------- Init ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#pause-title').textContent = T.pauseTitle;
  $('#pause-hint').textContent = T.pauseHint;
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  renderIntro();
  requestAnimationFrame(loop);
}

// Hook for end-to-end tests (C-14)
window.__croc = {
  state: () => g,
  act: action => triggerAction(action),
  start: seed => startRun(seed || currentSeed),
};

init();
