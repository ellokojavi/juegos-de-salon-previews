/**
 * Which plays are players' plays and which are the lab's (D-395): the panel and the weekly report
 * count only games that are out. A game is out when it is in `ALL_GAMES` and neither a lab game
 * (`labs`) nor in La Bodega (`bodega`), or is one of La Copa's games without a page (`linea`, `numero`), and, if a flag launched it, from the day its
 * `flags/<id>` went to *all*. Anything else (a lab game, a play before launch) is left out.
 * Pure: `node public/panel/public-games.test.mjs`.
 */
import { ALL_GAMES, SLUGS_SIN_PAGINA } from '../assets/js/games.js';

const DAY = 864e5;

/** The flag that launched a game: its gate (`lanza`, required), or a flag named after its lab card (`deLabs`) or its id, if there is one. */
const flagOf = (g, flags) => g.lanza || [g.deLabs, g.id].find(f => f && flags && Object.hasOwn(flags, f)) || null;

/**
 * `(id, day) → bool`: whether a play of game `id` on UTC day number `day` was a player's.
 * `id` may carry a mode or variant (`pintaminas:hard`). A flag not at *all* keeps the game in the lab.
 */
export function publicGameCheck(flags = {}) {
  const desde = new Map();
  for (const g of ALL_GAMES) {
    // La Copa is counted by its cups; a lab game, and one in La Bodega (behind the lab's door), never counts
    if (g.id === 'copa' || g.labs || g.bodega) continue;
    const f = flagOf(g, flags);
    if (!f) { desde.set(g.id, -Infinity); continue; }
    const s = flags?.[f];
    desde.set(g.id, s?.state === 'all' && Number.isFinite(s.at) ? Math.floor(s.at / DAY) : Infinity);
  }
  for (const id of Object.keys(SLUGS_SIN_PAGINA)) if (!desde.has(id)) desde.set(id, -Infinity);
  return (id, day) => { const d = desde.get(String(id).split(/:| · /)[0]); return d !== undefined && day >= d; };
}

/**
 * The same `days` with every lab play taken out: `local/<game>`, `fin/<game>`, `otra/<game>`, and the
 * rooms and live games of a game not out that day. Everything not about a game (visits, activos…)
 * stays as it is. Never changes what it is given.
 */
export function withoutLabGames(days = {}, isPublic) {
  const out = {};
  for (const [k, b] of Object.entries(days || {})) {
    const d = Number(k);
    if (!b || typeof b !== 'object' || !Number.isFinite(d)) { out[k] = b; continue; }
    const porJuego = m => m && Object.fromEntries(Object.entries(m).filter(([g]) => isPublic(g, d)));
    const porCampo = m => m && Object.fromEntries(Object.entries(m).filter(([, x]) => !x?.game || isPublic(x.game, d)));
    out[k] = { ...b, local: porJuego(b.local), fin: porJuego(b.fin), otra: porJuego(b.otra), jugadores: porJuego(b.jugadores), rooms: porCampo(b.rooms), live: porCampo(b.live) };
    for (const c of ['local', 'fin', 'otra', 'jugadores', 'rooms', 'live']) if (out[k][c] === undefined) delete out[k][c];
  }
  return out;
}

/** The cups without the lab's (`meta.lab`, the owner's and testers' cups): La Copa's counts read only players' cups. */
export function withoutLabCups(torneos = {}) {
  return Object.fromEntries(Object.entries(torneos || {}).filter(([, x]) => !x?.meta?.lab));
}
