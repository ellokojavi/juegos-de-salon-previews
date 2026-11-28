/**
 * The player's cups for their profile (lab flag `profile`): each cup's name, dates, the player's place
 * and who won. Like the home page's recap (D-423), this runs in /cup/history/, a page of La Copa's with
 * no screen that the profile opens in a hidden frame, so the cup's engine stays out of the profile
 * (D-377). It reads each cup over REST (`torneos/<code>` is public to read), or from La Copa's test
 * store with `?test`, ranks it with the cup's own table and posts the lines back.
 */
import { conCierre, terminada, tabla } from './engine.js';

const DB = 'https://juegos-de-salon-default-rtdb.firebaseio.com';
const TEST_KEY = 'juegos-de-salon:copa:prueba';

/**
 * One cup for `pid`, or null if `pid` is not in it: `{ name, alias, start, end, over, place, of, champions }`.
 * `place` is the player's place in the table as it stands (final once `over`); `champions`, the names in
 * first place once it ended.
 */
export function cupLine(Lraw, pid, now = Date.now()) {
  if (!Lraw?.meta || !Lraw.players?.[pid]) return null;
  const L = conCierre(Lraw);
  const { meta } = L;
  const over = terminada(meta, now);
  let rows = [];
  try { rows = tabla(L, pid, over ? meta.end : now); } catch (_) { rows = []; }
  const me = rows.find(r => r.pid === pid);
  const played = rows.filter(r => !r.fuera);
  return {
    name: meta.name || '', alias: meta.alias || null,
    start: Number(meta.win?.[1]?.a) || Number(meta.createdAt) || 0, end: Number(meta.end) || 0, over,
    place: me && rows.some(r => r.total > 0) ? me.lugar : null, of: played.length || rows.length,
    champions: over && rows.some(r => r.total > 0) ? rows.filter(r => r.lugar === 1).map(r => r.name) : [],
  };
}

/** The lines of `cups` (`[{ code, p }]`), by code. A cup that cannot be read is left out. */
export async function loadHistory(cups, { test = false, now = Date.now(), fetchFn = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  let local = {};
  if (test) { try { local = JSON.parse(storage?.getItem(TEST_KEY) || '{}') || {}; } catch (_) { local = {}; } }
  const read = async code => {
    if (test) return local[code] || null;
    try { const r = await fetchFn(`${DB}/torneos/${code}.json`); return r.ok ? await r.json() : null; } catch (_) { return null; }
  };
  const out = {};
  await Promise.all(cups.slice(0, 60).map(async ({ code, p }) => {
    if (!/^[A-Z0-9]{4,8}$/.test(code || '') || !p) return;
    const line = cupLine(await read(code), p, now);
    if (line) out[code] = line;
  }));
  return out;
}

/** The cups a frame's address asks for: `#c=CODE.pid,CODE.pid`. */
export function cupsOfHash(hash = '') {
  const m = /[#&]c=([^&]*)/.exec(hash);
  return m ? m[1].split(',').map(x => x.split('.')).filter(([code, p]) => code && p).map(([code, p]) => ({ code, p })) : [];
}
