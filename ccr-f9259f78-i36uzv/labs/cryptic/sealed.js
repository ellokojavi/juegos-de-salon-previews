/**
 * Críptico: the answers are sealed (the owner, 2026-11-20). The repo is public and the browser downloads
 * clues.js, so each clue's answer and explanation are kept there scrambled: a search on GitHub or a look at
 * the file does not give today's answer away. It is a veil, not a lock: the game has no server, the browser
 * has to know the answer to check a guess, and someone set on it can always decode it.
 * The clues are sealed and listed with tools/generators/cryptic-clues.mjs (docs/games/cryptic.md).
 */

const KEY = [...'juegos-de-salon/criptico'].map(ch => ch.charCodeAt(0));
const xor = bytes => bytes.map((b, i) => b ^ KEY[i % KEY.length]);

/** { a, x } → the string clues.js keeps in `s`. */
export function seal(secret) {
  const bytes = xor([...new TextEncoder().encode(JSON.stringify(secret))]);
  return btoa(String.fromCharCode(...bytes));
}

/** The string in `s` → { a, x }. */
export function unseal(s) {
  const bytes = xor([...atob(s)].map(ch => ch.charCodeAt(0)));
  return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes)));
}

/** A clue as clues.js keeps it ({ c, k, d, s, by? }) → as the game plays it ({ c, a, k, d, x, by? }). */
export const open = ({ s, ...clue }) => ({ ...clue, ...unseal(s) });
