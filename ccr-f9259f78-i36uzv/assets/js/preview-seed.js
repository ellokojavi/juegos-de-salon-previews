/**
 * A PR's preview (D-429) plays on the test store, which starts empty in each browser: nobody else is
 * there to challenge, no ranking has rows and no duel is recent. This fills it once with a few
 * made-up players, their scores this week and some duels between them (the owner, 2026-11-23: test
 * data in the preview), so duels can be tried there. Only on a preview's host, never on localhost
 * (the end-to-end scripts expect an empty store) and never on the real site (it uses Firebase).
 */
import { claveOrden, semana, SIEMPRE, TODOTERRENO } from './records.js';

const DB = 'juegos-de-salon:prueba:records-db';
const MARCA = 'juegos-de-salon:prueba:seeded';
const PREVIEWS = '/juegos-de-salon-previews/';

export const isPreview = (loc = globalThis.location) =>
  !!loc && String(loc.hostname).endsWith('.github.io') && String(loc.pathname).startsWith(PREVIEWS);

const JUGADORES = [
  ['pv000001', 'Ana', 'CL'], ['pv000002', 'Beto', 'CL'], ['pv000003', 'Caro', 'AR'],
  ['pv000004', 'Diego', 'MX'], ['pv000005', 'Fran', 'CL'], ['pv000006', 'Gabi', 'BR'],
];
const JUEGOS = ['desenredo', 'reinas', 'tango', 'zip'];

/** The made-up data, as the store keeps it, for time `t`. Pure, for the tests. */
export function testData(t) {
  const db = { jugadores: {}, jugadorNombres: {}, records: {}, duelos: {}, duelosRecientes: {}, jugadorDuelos: {} };
  const sem = semana(t);
  const fila = (jid, n, co, s, ms) => ({ s, ms, k: claveOrden(s, ms), at: t - 3600000, n, co });
  JUGADORES.forEach(([jid, n, co], i) => {
    db.jugadores[jid] = { n, co, at: t - 30 * 86400000 };
    (db.jugadorNombres[n.toLowerCase()] ||= {})[jid] = true;
    let total = 0;
    JUEGOS.forEach((g, k) => {
      const s = 100 - ((i * 7 + k * 13) % 45), ms = 40000 + ((i * 11 + k * 5) % 9) * 7000;
      total += s;
      for (const p of [sem, SIEMPRE]) ((db.records[g] ||= {})[p] ||= {})[jid] = fila(jid, n, co, s, ms);
    });
    for (const p of [sem, SIEMPRE]) ((db.records[TODOTERRENO] ||= {})[p] ||= {})[jid] = fila(jid, n, co, total, 0);
  });
  const r = (s, ms, h) => ({ s, ms, at: t - h * 3600000 });
  const duelo = (id, a, b, f, g, h, ra = {}, rb = {}) => {
    const [ja, na] = JUGADORES[a], [jb, nb] = JUGADORES[b];
    const n = f === 'bo5' ? 5 : 3;
    const e = {};
    for (const [jid, rs] of [[ja, ra], [jb, rb]]) for (const i of Object.keys(rs)) ((e[jid] ||= {})[i] = rs[i].at - 60000);
    db.duelos[id] = { a: ja, b: jb, an: na, bn: nb, f, g, sd: Array.from({ length: n }, (_, i) => 'ABCDEFGHJK'.slice(i, i + 5).padEnd(5, 'X')), at: t - h * 3600000, r: { [ja]: ra, [jb]: rb }, e };
    db.duelosRecientes[id] = t - h * 3600000;
    (db.jugadorDuelos[ja] ||= {})[id] = t - h * 3600000;
    (db.jugadorDuelos[jb] ||= {})[id] = t - h * 3600000;
  };
  duelo('pvduelo001', 0, 1, 'bo3', 'desenredo', 2, { 0: r(90, 50000, 1.5), 1: r(80, 60000, 1) }, { 0: r(70, 55000, 1.8), 1: r(60, 70000, 1.2) });
  duelo('pvduelo002', 2, 3, 'bo5', 'reinas', 5, { 0: r(100, 40000, 4) }, { 0: r(100, 38000, 4.5), 1: r(90, 45000, 3) });
  duelo('pvduelo003', 4, 5, 'pts', 'tango', 30, { 0: r(80, 50000, 29), 1: r(70, 50000, 28), 2: r(90, 50000, 27) }, { 0: r(60, 50000, 29), 1: r(90, 50000, 28), 2: r(70, 50000, 27) });
  duelo('pvduelo004', 1, 2, 'bo3', 'zip', 8, { 0: r(50, 90000, 7) }, {});
  return db;
}

/** Fills this browser's test store once, on a preview only. Leaves alone a store that already has players. */
export function seedPreview({ storage = globalThis.localStorage, loc = globalThis.location, now = Date.now() } = {}) {
  if (!isPreview(loc)) return false;
  try {
    if (storage.getItem(MARCA)) return false;
    const actual = JSON.parse(storage.getItem(DB) || '{}') || {};
    const datos = testData(now);
    for (const [rama, v] of Object.entries(datos)) actual[rama] = mezclar(actual[rama], v);
    storage.setItem(DB, JSON.stringify(actual));
    storage.setItem(MARCA, '1');
    return true;
  } catch (_) { return false; }
}

/** Deep merge, the store's own data winning (a player made before the seed keeps theirs). */
function mezclar(a, b) {
  if (!a || typeof a !== 'object') return b;
  const out = { ...b };
  for (const [k, v] of Object.entries(a)) out[k] = v && typeof v === 'object' && b?.[k] && typeof b[k] === 'object' ? mezclar(v, b[k]) : v;
  return out;
}
