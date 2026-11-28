/**
 * 🎮 Games, the panel's report by game (`#/game-report`): every public game ranked by its games finished
 * in the closed week, and each game's key usage metrics week by week. It counts as the WBR does
 * (D-560, D-561, D-590): games finished are one phone's endings, rooms that ended and La Copa's plays;
 * games started are one phone's starts, rooms with a rival and La Copa's plays; a game's modes and
 * versions read as one (`baseGame`); lab plays are out. Pure, no DOM: `node public/panel/game-report.test.mjs`.
 */
import { partidasDominio, finales, embudoSalas, variacion } from './dominios.js';
import { resumenCopas } from './copas.js';
import { publicGameCheck } from './public-games.js';
import { pacificDay, pacificEndMs, baseGame, gameName, weekRange } from './wbr.js';

/** How many closed weeks the report shows, the latest one first. */
export const REPORT_WEEKS = 8;

/** The first day the report of week `w` reads: the Sunday of its oldest week. */
export const reportStart = (w, semanas = REPORT_WEEKS) => w.from - 7 * (semanas - 1);

/** The metrics each game's card shows, in order: [key, name, kind]. `pct` is a percent, `dec` one decimal. */
export const GAME_METRICS = [
  ['terminadas', 'Games finished'],
  ['empezadas', 'Games started'],
  ['completan', 'Finished of started', 'pct'],
  ['jugadores', 'Browsers that finished it'],
  ['empiezan', 'Browsers that started it'],
  ['porJugador', 'Games finished per browser', 'dec'],
  ['otras', '“Play again” taps'],
  ['solo', 'Finished · solo'],
  ['grupo', 'Finished · one phone, group'],
  ['salas', 'Finished · online rooms'],
  ['copa', 'Finished · La Copa'],
  ['salasCreadas', 'Rooms created'],
  ['salasRival', 'Rooms a rival joined', 'pct'],
];

/** A row of numbers as a one-line sparkline (▁ to █), oldest first; a missing value is a space. */
export function sparkline(valores) {
  const xs = valores.filter(v => Number.isFinite(v));
  const max = Math.max(0, ...xs);
  return valores.map(v => (!Number.isFinite(v) ? ' ' : !max ? '▁' : '▁▂▃▄▅▆▇█'[Math.min(7, Math.round((v / max) * 7))])).join('');
}

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const dec = (a, b) => (b ? Math.round((a / b) * 10) / 10 : null);

/**
 * The report for the closed week `w` and the `semanas - 1` before it; with `actual` (the week in
 * progress) a partial column goes first, never compared. `{ columnas, cerrada, ranking, juegos, total }`:
 * `columnas` titles each week; `cerrada` is the closed week's index; `ranking` lists every game with
 * play in the window, by games finished in the closed week (then in progress, then the whole window);
 * `juegos[id]` holds each metric of GAME_METRICS as a list of values by column (null: not measured, or
 * the game was not out yet). Browsers by game are real (distinct ids in `jugadores/`, D-590) only in a
 * week that counter covers whole; before, null.
 */
export function gameReport({ days = {}, torneos = {}, flags = {} } = {}, w, { actual = null, semanas = REPORT_WEEKS } = {}) {
  const k = actual ? 1 : 0;
  const cols = [...(actual ? [{ ...actual, parcial: true }] : []), ...Array.from({ length: semanas }, (_, i) => ({ from: w.from - 7 * i, to: w.to - 7 * i }))];
  const inicio = Math.min(...cols.map(c => c.from)), fin = Math.max(...cols.map(c => c.to));
  const esPublico = publicGameCheck(flags);
  const copasPorDia = resumenCopas(torneos, { from: inicio, to: fin }, pacificEndMs(fin), { dayFn: pacificDay }).porDiaJuego;
  const dias = Object.keys(days).map(Number).filter(d => days[d]?.jugadores && Object.keys(days[d].jugadores).length);
  const desdeReal = dias.length ? Math.min(...dias) : Infinity;

  // Each column's counts by base game
  const vacio = () => ({ terminadas: 0, empezadas: 0, otras: 0, solo: 0, grupo: 0, salas: 0, copa: 0, salasCreadas: 0, conRival: 0, jugadores: new Set(), empiezan: new Set() });
  const porCol = cols.map(() => ({}));
  const desde = {};
  for (let d = inicio; d <= fin; d++) {
    const dia = { from: d, to: d }, pd = partidasDominio(days, dia), f = finales(days, dia), salas = embudoSalas(days, dia), copa = copasPorDia[d] || {};
    const hoy = {};
    const sumar = (id, campo, n) => { if (!n || !esPublico(id, d)) return; const b = baseGame(id); (hoy[b] ||= vacio())[campo] += n; desde[b] = Math.min(desde[b] ?? Infinity, d); };
    for (const [id, n] of [...Object.entries(pd.grupo.byGame), ...Object.entries(pd.individual.byGame), ...Object.entries(copa)]) sumar(id, 'empezadas', n);
    for (const [id, g] of Object.entries(f.porJuego)) { sumar(id, 'terminadas', g.terminadas); sumar(id, 'solo', g.finIndividual); sumar(id, 'grupo', g.finGrupo); sumar(id, 'otras', g.otras); }
    for (const [id, g] of Object.entries(salas)) { sumar(id, 'terminadas', g.terminadas); sumar(id, 'salas', g.terminadas); sumar(id, 'salasCreadas', g.creadas); sumar(id, 'conRival', g.conRival); }
    for (const [id, n] of Object.entries(copa)) { sumar(id, 'terminadas', n); sumar(id, 'copa', n); }
    for (const [g, ids] of Object.entries(days[d]?.jugadores || {})) {
      if (!esPublico(g, d)) continue;
      const c = (hoy[baseGame(g)] ||= vacio());
      for (const [id, v] of Object.entries(ids || {})) { if (Number(v) >= 1) c.empiezan.add(id); if (Number(v) >= 2) c.jugadores.add(id); }
    }
    cols.forEach((c, i) => {
      if (d < c.from || d > c.to) return;
      for (const [b, x] of Object.entries(hoy)) {
        const t = (porCol[i][b] ||= vacio());
        for (const [campo, v] of Object.entries(x)) if (v instanceof Set) v.forEach(id => t[campo].add(id)); else t[campo] += v;
      }
    });
  }

  // A game is out from the day it went public (its flag to all, D-560); one with no flag always was
  const salioEl = b => { for (let d = inicio; d <= fin; d++) if (esPublico(b, d)) return d === inicio ? -Infinity : d; return desde[b] ?? Infinity; };
  const juegos = {};
  const ids = [...new Set(porCol.flatMap(p => Object.keys(p)))].filter(b => porCol.some(p => p[b]?.terminadas || p[b]?.empezadas));
  for (const b of ids) {
    const salio = salioEl(b);
    const enCol = (i, fn) => (salio > cols[i].to ? null : fn(porCol[i][b] || vacio(), cols[i]));
    const real = c => desdeReal <= c.from;
    const valores = {
      terminadas: i => enCol(i, x => x.terminadas),
      empezadas: i => enCol(i, x => x.empezadas),
      // More finished than started means a start went uncounted: n/a rather than a 100% that hides it
      completan: i => enCol(i, x => (x.terminadas > x.empezadas ? null : pct(x.terminadas, x.empezadas))),
      jugadores: i => enCol(i, (x, c) => (real(c) ? x.jugadores.size : null)),
      empiezan: i => enCol(i, (x, c) => (real(c) ? x.empiezan.size : null)),
      porJugador: i => enCol(i, (x, c) => (real(c) ? dec(x.terminadas, x.jugadores.size) : null)),
      otras: i => enCol(i, x => x.otras),
      solo: i => enCol(i, x => x.solo),
      grupo: i => enCol(i, x => x.grupo),
      salas: i => enCol(i, x => x.salas),
      copa: i => enCol(i, x => x.copa),
      salasCreadas: i => enCol(i, x => x.salasCreadas),
      salasRival: i => enCol(i, x => pct(x.conRival, x.salasCreadas)),
    };
    const filas = {};
    for (const [m] of GAME_METRICS) filas[m] = cols.map((_, i) => valores[m](i));
    // A metric that is zero (or not measured) in every week says nothing about this game: left out of its card
    const metricas = GAME_METRICS.filter(([m]) => filas[m].some(v => v));
    juegos[b] = { id: b, nombre: gameName(b), filas, metricas: metricas.map(([m]) => m) };
  }

  const total = cols.map((_, i) => Object.values(porCol[i]).reduce((a, x) => a + x.terminadas, 0));
  const ranking = ids.map(b => {
    const t = juegos[b].filas.terminadas, cerrada = t[k] || 0;
    // Oldest first for the sparkline: the partial week left out, it would always read as a drop
    const semanasT = t.slice(k).reverse();
    return {
      id: b, nombre: juegos[b].nombre, terminadas: cerrada,
      cambio: t[k + 1] === null || t[k + 1] === undefined ? null : variacion(cerrada, t[k + 1]),
      parcial: k ? t[0] : null,
      share: pct(cerrada, total[k]),
      jugadores: juegos[b].filas.jugadores[k],
      completan: juegos[b].filas.completan[k],
      tendencia: sparkline(semanasT),
      suma: semanasT.reduce((a, v) => a + (v || 0), 0),
    };
  }).sort((a, b) => b.terminadas - a.terminadas || (b.parcial || 0) - (a.parcial || 0) || b.suma - a.suma || a.nombre.localeCompare(b.nombre))
    .map((g, i) => ({ ...g, puesto: i + 1 }));

  return { columnas: cols.map(c => `${weekRange(c)}${c.parcial ? '*' : ''}`), cerrada: k, ranking, juegos, total };
}
