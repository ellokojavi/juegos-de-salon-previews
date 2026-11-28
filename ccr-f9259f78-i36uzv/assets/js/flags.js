/**
 * The lab's runtime flags (D-498): what is tried on a page players visit asks `flag('<id>')`
 * instead of `labAccess()`, and the owner decides who gets it without a PR, on its card in /labs/
 * (🧪 / 🚀 / ⚪), the one place to switch it. Firebase `flags/`,
 * public to read, only the owner writes:
 *
 *   flags/<id>   { state: 'lab' | 'all' | 'off', at }
 *                lab: only lab key holders (D-395); all: every player; off: nobody, not even the lab.
 *
 * With nothing saved, or if Firebase does not answer, a flag is 'lab', as before flags existed.
 * Each id is a card of /labs/ (`seccion-<id>`), and is listed in FLAGS in flag-list.js (the panel's 🧪 Labs link counts them);
 * `public/labs/listed.test.mjs` checks both. Read once per page and kept on the device, so an
 * answer that does not come in time is the last one this phone saw.
 *
 * The tester tab's switches (D-567): every flag a page asks while it is 'lab' and the visitor holds
 * the key is listed in `labHere`, and the tester tab (T) shows a switch for each, to turn it off and
 * on on this phone only (`juegos-de-salon:flags-off`). A launched flag ('all') is not listed: what
 * left the lab needs no switch.
 */
import { labAccess, SAVED_KEY } from './lab-access.js';

export const STATES = ['lab', 'all', 'off'];

const KEY = 'juegos-de-salon:flags';
export const REMOTE = 'https://juegos-de-salon-default-rtdb.firebaseio.com/flags.json';

/** A flag's state in what Firebase answered: 'lab' unless it says otherwise. */
export const stateOf = (flags, id) => (STATES.includes(flags?.[id]?.state) ? flags[id].state : 'lab');

/** Whether a flag is on, given its state and whether this visitor holds a lab key. Pure, for node. */
export const flagOn = (state, lab) => state === 'all' || (state !== 'off' && !!lab);

/** The last `flags/` this device saw, or {}. */
export function cachedFlags(store = globalThis.localStorage) {
  try { const v = JSON.parse(store?.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

let pending = null;
/** `flags/` from Firebase, kept on the device; the cached one if it does not answer in time. */
export function loadFlags({ fetchFn = globalThis.fetch, store = globalThis.localStorage, timeout = 1500 } = {}) {
  pending ??= (async () => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeout);
      const r = await fetchFn(REMOTE, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!r.ok) return cachedFlags(store);
      const v = (await r.json()) || {};
      try { store?.setItem(KEY, JSON.stringify(v)); } catch (_) { /* nothing is remembered */ }
      return v;
    } catch (_) { return cachedFlags(store); }
  })();
  return pending;
}

const OFF = 'juegos-de-salon:flags-off';
/** The lab flags this phone's tester turned off in the tester tab: { <id>: true }. */
export function labOffList(store = globalThis.localStorage) {
  try { const v = JSON.parse(store?.getItem(OFF) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}
/** Turns a lab flag off (or back on) on this phone only. */
export function setLabOff(id, off, store = globalThis.localStorage) {
  const v = labOffList(store);
  if (off) v[id] = true; else delete v[id];
  try { store?.setItem(OFF, JSON.stringify(v)); } catch (_) { /* not remembered */ }
}
const PINNED = 'juegos-de-salon:flags-pinned';
/**
 * What this phone's tester pinned to the tab's first view, «Testing now» (D-592): { <id>: true }.
 * Pinning only shows or hides a row; it never turns anything on or off.
 */
export function labPinnedList(store = globalThis.localStorage) {
  try { const v = JSON.parse(store?.getItem(PINNED) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}
/** Pins a row to the first view (or unpins it), on this phone only. */
export function setLabPinned(id, pinned, store = globalThis.localStorage) {
  const v = labPinnedList(store);
  if (pinned) v[id] = true; else delete v[id];
  try { store?.setItem(PINNED, JSON.stringify(v)); } catch (_) { /* not remembered */ }
}

/** The lab flags this page asked, with the key held: the tester tab lists them. */
export const labHere = new Set();
const announce = id => {
  if (labHere.has(id)) return;
  labHere.add(id);
  globalThis.dispatchEvent?.(new CustomEvent('lab-flag', { detail: id }));
};

/** For the page: true when this visitor gets the feature behind flag `id`. The lab key is asked only for 'lab'. */
export async function flag(id, { load = loadFlags, lab = labAccess, store = globalThis.localStorage } = {}) {
  const state = stateOf(await load(), id);
  if (state !== 'lab') return flagOn(state, false);
  const key = await lab();
  if (key && load === loadFlags) announce(id);
  const on = flagOn(state, key) && !labOffList(store)[id];
  // what the lab uses is counted, to tell the owner when it is ready (D-528); not for the tests' own loaders
  if (on && id !== 'lab-ready' && load === loadFlags) import('./lab-usage.js').then(m => m.exposed(id)).catch(() => {});
  return on;
}

/**
 * `flag(id)`'s answer before the network's: what this phone saw last time (the saved `flags/` and whether
 * it holds a lab key), read with no wait. A page that changes its look for a flag draws it from the first
 * frame with this, so it does not show the old look and then jump; `flag()` stays the answer that decides.
 */
export function flagGuess(id, { store = globalThis.localStorage } = {}) {
  try {
    const state = stateOf(cachedFlags(store), id);
    if (state === 'lab' && !labOffList(store)[id]) return flagOn(state, !!store?.getItem(SAVED_KEY));
    return state === 'all';
  } catch (_) { return false; }
}
