/**
 * Reactions and comments on each other's results, inside a cup (D-562, issue #1488), behind the lab
 * flag `cup-talk`. Pure: what can be said, by whom and how it adds up. The screen is in game.js.
 *
 * Firebase: cupTalk/<code>/<day>/<target>/<author> = { e?, c?, at }
 *   e  one reaction of REACTIONS (the screen no longer offers them, 2026-11-16: emojis go in the text)
 *   c  one comment of up to MAX_COMMENT characters, edited or deleted by its author
 * cupTalkHidden/<code>/<day>/<target>/<author> = true: the target hid that comment from their row
 * (apart, so the author cannot undo it). The store hands both over as { talk, hidden }.
 * Only on the cup's current day (the owner, 2026-11-16: past days are not talked about), after the
 * author played it, on a result that exists (their own included), while the cup is on. It lives outside `torneos/` so the nightly job deletes it once the cup ends.
 */
import { nombreOfensivo } from '../assets/js/name-guard.js';
import { terminada, diaActual } from './engine.js';

/** The reactions, stored by key (the rules accept only these keys). */
export const REACTIONS = { fire: '🔥', laugh: '😂', clap: '👏', wow: '😮', sad: '😢', crown: '👑' };
export const MAX_COMMENT = 120;

/** A comment as it is saved: one line, spaces collapsed, cut at MAX_COMMENT. */
export const cleanComment = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT);

/** Why a comment cannot go: 'empty', 'offensive', or null when it can. */
export function commentProblem(s) {
  const c = cleanComment(s);
  if (!c) return 'empty';
  if (nombreOfensivo(c)) return 'offensive';
  return null;
}

/** The cup's day that can be talked about: today, while the cup is on; else null. */
export const talkDay = (L, now) => {
  if (!L?.meta || terminada(L.meta, now)) return null;
  const d = diaActual(L.meta, now);
  return d >= 1 && d <= L.meta.days ? d : null;
};

/** Whether `author` can react or comment on `target`'s result of day `d`: today, both played it. */
export const canTalk = (L, d, author, target, now) => d === talkDay(L, now)
  && !!L.results?.[d]?.[author] && !!L.results?.[d]?.[target];

/**
 * What a target's row of day `d` shows: the reactions counted (in REACTIONS order, only the ones
 * used), the comments in the order they came (hidden ones out, except to the target, who sees them
 * marked), and what `me` said.
 */
export function rowTalk({ talk, hidden } = {}, d, target, me) {
  const byAuthor = talk?.[d]?.[target] || {};
  const hid = hidden?.[d]?.[target] || {};
  const counts = {};
  const comments = [];
  for (const [author, x] of Object.entries(byAuthor)) {
    if (x?.e in REACTIONS) counts[x.e] = (counts[x.e] || 0) + 1;
    if (typeof x?.c === 'string' && x.c && (!hid[author] || target === me)) comments.push({ author, c: x.c, h: !!hid[author], at: Number(x.at) || 0 });
  }
  comments.sort((a, b) => a.at - b.at || a.author.localeCompare(b.author));
  const reactions = Object.keys(REACTIONS).filter(k => counts[k]).map(k => ({ key: k, emoji: REACTIONS[k], n: counts[k] }));
  return { reactions, comments, mine: byAuthor[me] || null };
}

/** How many reactions and visible comments `pid` got in the whole cup, for the badge. */
export function received({ talk, hidden } = {}, pid) {
  let n = 0;
  for (const [d, day] of Object.entries(talk || {})) for (const [author, x] of Object.entries(day?.[pid] || {})) {
    if (x?.e in REACTIONS) n++;
    if (x?.c && !hidden?.[d]?.[pid]?.[author]) n++;
  }
  return n;
}
