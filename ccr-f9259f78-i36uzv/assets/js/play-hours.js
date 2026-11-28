/**
 * The hours this phone finishes games at, early and at night, for the profile's badges (lab flag
 * `profile`: 🌅 early bird, 🦉 night owl). On the phone only, never sent: `{ 'YYYY-MM-DD': { e, n } }`,
 * how many games ended between 04:00 and 06:59 (`e`) and between 00:00 and 03:59 (`n`) of each local
 * day, the last 60 days with any. `stats.js`' `trackFinish` notes every finished game (C-21).
 * It also keeps the run of one same game finished in a row (😬 Se llama obsesión): `{ g, n, best }`, the
 * game of the current run, its length and the longest run this phone ever made. On the phone only too.
 */
export const HOURS_KEY = 'juegos-de-salon:play-hours';
const KEEP = 60;

/** The log with one more game finished at `ms`, by the phone's clock. Pure. */
export function addHour(log = {}, ms = Date.now()) {
  const d = new Date(ms), h = d.getHours();
  const kind = h < 4 ? 'n' : h < 7 ? 'e' : null;
  if (!kind) return log;
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const out = { ...log, [day]: { ...(log[day] || {}), [kind]: (Number(log[day]?.[kind]) || 0) + 1 } };
  return Object.fromEntries(Object.keys(out).sort().slice(-KEEP).map(k => [k, out[k]]));
}

/** What this phone logged, or {}. */
export function readHours(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(HOURS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

/** Notes one finished game now. Never throws. */
export function noteHour(storage = globalThis.localStorage, ms = Date.now()) {
  try {
    const before = readHours(storage), after = addHour(before, ms);
    if (after !== before) storage?.setItem(HOURS_KEY, JSON.stringify(after));
  } catch (_) { /* no storage: nothing noted */ }
}

export const RUN_KEY = 'juegos-de-salon:play-run';

/** The run with one more game `g` finished: the same game adds one, another starts over at 1. Pure. */
export function addRun(run = {}, g) {
  if (typeof g !== 'string' || !g) return run;
  const n = run.g === g ? (Number(run.n) || 0) + 1 : 1;
  return { g, n, best: Math.max(Number(run.best) || 0, n) };
}

/** This phone's run, or {}. */
export function readRun(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(RUN_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

/** Notes one more finished game `g`. Never throws. */
export function noteRun(g, storage = globalThis.localStorage) {
  try {
    const before = readRun(storage), after = addRun(before, g);
    if (after !== before) storage?.setItem(RUN_KEY, JSON.stringify(after));
  } catch (_) { /* no storage: nothing noted */ }
}

/** A local date as 'YYYY-MM-DD'. */
export const localDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * What stays for good, for the profile's badges that cannot wait for a 60-day log (lab flag `profile`).
 * On the phone only, never sent: `{ first, days, wk, mon, sat, played }`: the day each game was first finished
 * here (`first: { <game>: 'YYYY-MM-DD' }`, 🎬 De estreno), the special days played (`days: { xmas, newyear,
 * fiestas, halloween }`), the Saturdays whose Sunday was played too (`wk`, 🛋️ Finde a tope) and the Mondays
 * with a game before 08:00 (`mon`, ☕ Odio los lunes), the last Saturday played (`sat`) and the days with a game (`played`, the last 400, 🏠 De la casa). `stats.js`' `trackFinish` notes every game.
 */
export const MARKS_KEY = 'juegos-de-salon:play-marks';
const SPECIAL = { '12-25': 'xmas', '01-01': 'newyear', '09-18': 'fiestas', '10-31': 'halloween' };
const KEEP_DAYS = 30;
const KEEP_PLAYED = 400;
const addDay = (list, day, keep = KEEP_DAYS) => (Array.isArray(list) && list.includes(day) ? list : [...(Array.isArray(list) ? list : []), day].slice(-keep));

/** The marks with one more game `g` finished at `ms`, by the phone's clock. Pure. */
export function addMark(marks = {}, g, ms = Date.now()) {
  const d = new Date(ms), day = localDay(d), wd = d.getDay();
  const out = { ...marks, first: { ...(marks.first || {}) }, days: { ...(marks.days || {}) } };
  if (typeof g === 'string' && g && !out.first[g]) out.first[g] = day;
  const special = SPECIAL[day.slice(5)];
  if (special) out.days[special] = true;
  out.played = addDay(marks.played, day, KEEP_PLAYED);
  if (wd === 6) out.sat = day;
  if (wd === 0) {
    const sat = localDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
    if (marks.sat === sat) out.wk = addDay(marks.wk, sat);
  }
  if (wd === 1 && d.getHours() < 8) out.mon = addDay(marks.mon, day);
  return out;
}

/** This phone's marks, or {}. */
export function readMarks(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(MARKS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

/** Notes one more finished game `g`. Never throws. */
export function noteMark(g, storage = globalThis.localStorage, ms = Date.now()) {
  try { storage?.setItem(MARKS_KEY, JSON.stringify(addMark(readMarks(storage), g, ms))); } catch (_) { /* no storage: nothing noted */ }
}
