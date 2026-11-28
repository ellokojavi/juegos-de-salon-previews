/**
 * Cryptic: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * Three clues a day (the owner, 2026-11-20), the same for everyone on that date (the player's own
 * midnight): an easy one, a medium one and a hard one, in that order, worth 20, 30 and 50 points. The player
 * types each answer as many times as needed; three hints serve the whole day (the kind of wordplay, the
 * definition, the first letter, up to three on one clue), and each costs more on a harder clue. Giving up
 * shows the answer and scores none. Any clue of the bank can be played alone as practice, which counts for
 * nothing.
 */

/** The day the game started: its clue is number 1. */
export const LAUNCH = '2026-11-19';
/** Hints per clue (its three kinds), and hints for the whole day, shared by its clues. */
export const MAX_HINTS = 3;
export const POOL = 3;
/** The levels in the order a day plays them, what each clue is worth and what a hint costs on it. */
export const LEVELS = ['e', 'm', 'h'];
export const POINTS = { e: 20, m: 30, h: 50 };
export const HINT_COST = { e: 5, m: 8, h: 15 };

const two = n => String(n).padStart(2, '0');
/** The player's date today, in their time zone: `2026-11-19`. */
export function localDate(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}
const utc = f => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
/** Days from `a` to `b`. */
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
/** `date` plus `n` days. */
export const addDays = (date, n) => new Date(utc(date) + n * 86400000).toISOString().slice(0, 10);
/** The clue's number, the one that is shared: the launch day is #1 (and so is a day before it, west of the launch). */
export const numberOf = date => Math.max(1, daysBetween(LAUNCH, date) + 1);

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** A step that visits every clue once before any repeats, and does not walk the bank in its written order. */
const strideFor = n => [7, 11, 13, 17, 19, 23].find(p => gcd(p, n) === 1) || 1;
/** Which clue of a bank of `size` a date gets. */
export function indexOf(date, size) {
  const n = ((daysBetween(LAUNCH, date)) % size + size) % size;
  return (n * strideFor(size)) % size;
}

/** Capitals without accents, Ñ kept, and only letters: «Jamón » → «JAMON». */
export const normalize = s => String(s || '').toUpperCase()
  .replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ')
  .replace(/[^A-ZÑ]/g, '');

/** The length as the clue shows it: «(4)», or «(3,4)» for two words. */
export const enumeration = answer => '(' + String(answer).split(/[\s-]+/).map(w => normalize(w).length).join(',') + ')';

/** One clue's round: its guesses and hints, and how it ended. */
export const newRound = index => ({ index, guesses: [], hints: 0, solved: false, gaveUp: false });

export const isOver = round => round.solved || round.gaveUp;

/**
 * The day's three clues, one per level: each level's clues are walked with `indexOf`, so every one comes out
 * before any repeats. A clue the player wrote (`jid`) is not theirs to play: they get the next one of its
 * level, and `mine` says so (the day «Hoy salió tu críptico», the owner, 2026-11-19).
 */
export function dayPicks(bank, date, jid = null) {
  return LEVELS.map(l => {
    const list = bank.map((c, i) => (c.l === l ? i : -1)).filter(i => i >= 0);
    const at = indexOf(date, list.length);
    const mine = isAuthor(bank[list[at]], jid) && list.length > 1;
    return { index: list[mine ? (at + 1) % list.length : at], mine };
  });
}

/** A game: the day's three clues (`picks` from dayPicks), or one clue of practice, which counts for nothing. */
export const newDay = (date, picks) =>
  ({ date, practice: false, step: 0, clues: picks.map(p => newRound(p.index)), mine: picks.some(p => p.mine) });
export const newPractice = index => ({ date: null, practice: true, step: 0, clues: [newRound(index)], mine: false });

/** The clue being played, and whether the whole game is over. */
export const current = game => game.clues[game.step];
export const gameOver = game => game.clues.every(isOver);
/** On to the next clue once this one is over (the player taps «Siguiente»). */
export const next = game => (isOver(current(game)) && game.step < game.clues.length - 1 ? { ...game, step: game.step + 1 } : game);
/** The day's hints still to spend. */
export const hintsLeft = game => POOL - game.clues.reduce((n, r) => n + r.hints, 0);
const setCurrent = (game, round) => ({ ...game, clues: game.clues.map((r, i) => (i === game.step ? round : r)) });

/**
 * The verdict of a guess: `{ state, verdict }`, with verdict `right`, `wrong`, `length` (not the
 * answer's length: it is not counted) or `empty`. Nothing moves once the round is over.
 */
export function guess(game, text, clue) {
  const round = current(game);
  const g = normalize(text);
  if (isOver(round)) return { state: game, verdict: 'over' };
  if (!g) return { state: game, verdict: 'empty' };
  const want = normalize(clue.a);
  if (g.length !== want.length) return { state: game, verdict: 'length' };
  const right = g === want;
  return { state: setCurrent(game, { ...round, guesses: [...round.guesses, g], solved: right }), verdict: right ? 'right' : 'wrong' };
}

/** Can the player ask for a hint on this clue? While it is open, it has a kind left and the day a hint left. */
export const canHint = game => !isOver(current(game)) && current(game).hints < MAX_HINTS && hintsLeft(game) > 0;
/** One more hint on the clue being played. */
export const hint = game => (canHint(game) ? setCurrent(game, { ...current(game), hints: current(game).hints + 1 }) : game);

/** Shows the answer: the clue ends with no points. */
export const giveUp = game => (isOver(current(game)) ? game : setCurrent(game, { ...current(game), gaveUp: true }));

/** A clue's points: its worth minus its hints, none if given up or still open. */
export const pointsOf = (round, level) => (round.solved ? POINTS[level] - HINT_COST[level] * round.hints : 0);
/** The game's points: out of 100 for a day. */
export const score = (game, bank) => game.clues.reduce((n, r) => n + pointsOf(r, bank[r.index].l), 0);

/**
 * The streak: days in a row with the day's game finished, its three clues played to the end, up to today
 * (or up to yesterday, while today's is not finished yet). `days` is { 'YYYY-MM-DD': { solved } }, where
 * `solved` means the day was finished (and, before the three clues, that its one clue was solved).
 */
export function streak(days, today) {
  let d = days[today]?.solved ? today : addDays(today, -1);
  let n = 0;
  while (days[d]?.solved) { n++; d = addDays(d, -1); }
  return n;
}

/** Is `jid` the player who wrote `clue`? Clues a player proposed carry `by: { n, j }` (the owner, 2026-11-19). */
export const isAuthor = (clue, jid) => !!jid && clue?.by?.j === jid;

/** The clues practice may draw: all but today's (`skip`, one index or the day's three) and the player's own. */
export const practicePool = (bank, skip, jid) => bank.map((_, i) => i).filter(i => ![].concat(skip).includes(i) && !isAuthor(bank[i], jid));
