// ¡Al toque!'s pure rules (C-2): which games a run plays, and how a run scores. No DOM.
// docs/games/microgames.md, "Scoring" and "Shared runs".
import { rng } from '../../../assets/js/rng.js';

// A text's 32-bit hash (FNV-1a with a final mix), the same La Copa's seeds use: a lab game does not
// import La Copa's modules (docs/ARCHITECTURE.md), so it lives here too
const hash32 = text => { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
/** A run's code: 5 letters without I or O, like a cup's, so it reads out loud and fits a link. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode = (r = Math.random) => Array.from({ length: 5 }, () => LETTERS[Math.floor(r() * LETTERS.length)]).join('');

export const RUN = 10;
/** Every three games the run speeds up by 10 %. */
export const speedAt = i => +(1 + 0.1 * Math.floor(i / 3)).toFixed(2);
/** Points for one game: 10 per star, times the speed it was played at (a ★★★ at ×1.3 is 39). */
export const gamePoints = (stars, i) => Math.round(stars * 10 * speedAt(i));
/** A streak: every game with ★★ or more right after another one adds 5 more. */
export const STREAK = 5;

/**
 * A run's points, game by game: `marks` are the stars of each game in order (0 to 3).
 * Returns `{ games: [{ stars, points, streak }], points, max }`; `max` is a perfect run.
 */
export function score(marks) {
  let run = 0, points = 0, max = 0;
  const games = marks.map((stars, i) => {
    run = stars >= 2 ? run + 1 : 0;
    const streak = run >= 2 ? STREAK : 0, p = gamePoints(stars, i) + streak;
    points += p; max += gamePoints(3, i) + (i ? STREAK : 0);
    return { stars, points: p, streak };
  });
  return { games, points, max };
}

/**
 * The 0–100 score Uno al día and La Copa compare (the platform's scale, D-412): the stars weighed by the
 * speed of each game, with no streak, so a missed game costs the same wherever it falls.
 */
export function score100(marks) {
  if (!marks.length) return 0;
  const got = marks.reduce((s, m, i) => s + m * speedAt(i), 0), all = marks.reduce((s, _, i) => s + 3 * speedAt(i), 0);
  return Math.round(got / all * 100);
}

/** A random stream: seeded (the same on every phone) when there is a seed, `Math.random` when not. */
export const stream = (seed, what) => (seed ? rng(hash32(`microgames:${seed}:${what}`)) : Math.random);

/** The run: `n` different games out of `ids`, shuffled by the seed's stream (or at random without one).
 *  `apart` lists groups of games too alike to share a run (the two clock games): at most one of each group. */
export function runOrder(ids, seed, n = RUN, apart = []) {
  const r = stream(seed, 'order'), a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const out = [];
  for (const id of a) { if (out.length >= n) break; const g = apart.find(x => x.includes(id)); if (g && out.some(o => g.includes(o))) continue; out.push(id); }
  return out;
}

/* ------------------------------------------------------------------ */
/* La Copa, Uno al día and the page /in-a-flash/ (D-331's interface)   */
/* ------------------------------------------------------------------ */

/** The 29 microgames, in the stage's order (stage.js `META`; engine.test.mjs keeps them equal). */
export const IDS = ['cruza', 'espera', 'toca', 'quecolor', 'cuenta', 'atrapa', 'corta', 'ordena', 'calcula', 'conecta', 'limpia', 'para', 'aplasta', 'revienta', 'pinball',
  'rebota', 'equilibra', 'dibuja', 'sigue', 'repite', 'dondequedo', 'diferente', 'cualfalta', 'mas', 'quehora', 'hands', 'sombra', 'completa', 'notoques'];
/** The two clock games never share a run. */
export const APART = [['quehora', 'hands']];
/** The trial (D-103): a short run of three, at the run's first speed. */
export const TRIAL = 3;

/**
 * The day's run (La Copa's `generarDia`, named in English, D-316: cup/games/index.js maps it): its seed is
 * `código:día` (and `:sal`, the trial's), so every phone plays the same ten games, each dealt the same.
 */
export function generateDay(code, day, { sal = '', ensayo = false } = {}) {
  const semilla = `${code}:${day}${sal ? `:${sal}` : ''}`;
  return { semilla, orden: runOrder(IDS, semilla, ensayo ? TRIAL : RUN, APART) };
}

/** A run's state, as saved and handed to the cup: `{ fin, marks, orden, ms }`. Its points: the game's own (no cap). */
export const points = e => score(Array.isArray(e?.marks) ? e.marks.map(m => Math.max(0, Math.min(3, m | 0))) : []).points;

/** Over the whole run, even one left halfway: a game not played counts as 0 stars. */
export const runScore100 = e => {
  const n = Math.max(Array.isArray(e?.orden) ? e.orden.length : RUN, e?.marks?.length || 0);
  const marks = Array.from({ length: n }, (_, i) => Math.max(0, Math.min(3, e?.marks?.[i] | 0)));
  return score100(marks);
};

/** The share card's line: each game's stars as 🟩 ★★★, 🟨 ★★, 🟧 ★, ⬛ none, five to a line. */
export function card(e) {
  const k = (Array.isArray(e?.marks) ? e.marks : []).map(m => ['⬛', '🟧', '🟨', '🟩'][Math.max(0, Math.min(3, m | 0))]);
  const rows = [];
  for (let i = 0; i < k.length; i += 5) rows.push(k.slice(i, i + 5).join(''));
  return rows.join('\n');
}

/**
 * Uno al día's 0–100 (La Copa's `puntajeDia`): the run's own score100 (stars weighed by speed, no streak,
 * D-412), from the result's `d100`; a bare number of points maps over a perfect run's 381.
 */
export const dayScore = (s, r) => (Number.isFinite(r?.d100) ? r.d100 : Math.max(0, Math.min(100, Math.round(100 * (Number(s) || 0) / 381))));
