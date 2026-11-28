/**
 * Críptico's cover (the owner, 2026-11-19): a split-flap board, as in an airport, that flips through
 * several words of the name's length, the name among them, in an endless loop (the owner asked for it always
 * moving). With reduced motion it shows the name, still.
 */

const FLIPS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
/** The words it passes through, per language; the last one is the game's name and has its length. */
export const BOARD_WORDS = {
  es: ['MISTERIO', 'ANAGRAMA', 'ADIVINAR', 'ACERTIJO', 'MENSAJES', 'PALABRAS', 'PREGUNTA', 'SECRETOS', 'SORPRESA', 'CRÍPTICO'],
  pt: ['MISTÉRIO', 'ANAGRAMA', 'ADIVINHA', 'PALAVRAS', 'MENSAGEM', 'SEGREDOS', 'PERGUNTA', 'SURPRESA', 'CRÍPTICO'],
  en: ['MYSTERY', 'ANAGRAM', 'PUZZLES', 'RIDDLES', 'CIPHERS', 'SECRETS', 'ENIGMAS', 'LETTERS', 'CRYPTIC'],
};

const wait = ms => new Promise(ok => setTimeout(ok, ms));

const WAVE = 110;      // ms between one tile and the next as the first word comes in
const SPINS = 3;       // random letters a tile runs through before landing on a new one
const SPIN = 60;       // ms per random letter
const READ = 1500;     // ms each word stays whole, the same for every word and the name (the owner: no start or end)
const MORPH = 2400;    // ms in which the next word's letters creep in, one tile at a time
const IDLE = 220;      // ms between two flaps in place, so the board never stops

/** Is the cover on screen? The board rests while it is not, and while the tab is hidden. */
const watching = into => !document.hidden && !!into.closest('.screen.active');

/**
 * Draws the board into `into` and plays it in a loop (the owner, 2026-11-19). The first word comes in as a
 * wave; then each word reads whole for a while, and the next one's letters creep in one tile at a time, in a
 * random order, so for a moment the two words mix, until the next one reads whole. The name is one more word
 * of the loop, held as long as the others. Tiles that do not change keep flapping in place, so something always
 * moves. With reduced motion (or ?test) it shows the name, still.
 */
export async function flapboard(into, lang = 'es', { random = Math.random } = {}) {
  const words = BOARD_WORDS[lang] || BOARD_WORDS.es;
  const name = words.at(-1);
  const tiles = [...name].map(() => {
    const t = document.createElement('span');
    t.className = 'flap';
    t.textContent = ' ';
    return t;
  });
  into.replaceChildren(...tiles);
  into.style.setProperty('--tiles', String(tiles.length));
  into.setAttribute('aria-label', name);
  into.setAttribute('role', 'img');
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || /[?&]test\b/.test(location.search);
  if (still) { tiles.forEach((t, i) => { t.textContent = name[i]; }); return; }

  const flip = (t, ch) => {
    t.textContent = ch;
    t.classList.remove('flap--tick');
    void t.offsetWidth;
    t.classList.add('flap--tick');
  };
  const pick = () => FLIPS[Math.floor(random() * FLIPS.length)];
  const busy = new Set();          // tiles spinning towards a new letter: the flaps in place leave them alone
  const shown = tiles.map(() => ' ');
  /** Tile i spins through a few letters and lands on `ch`. */
  const land = async (i, ch) => {
    busy.add(i);
    for (let k = 0; k < SPINS; k++) { flip(tiles[i], pick()); await wait(SPIN); }
    flip(tiles[i], ch);
    shown[i] = ch;
    busy.delete(i);
  };
  /** For `ms`, one still tile at a time flaps back onto its own letter. */
  const idle = async ms => {
    const until = Date.now() + ms;
    let last = -1;
    while (Date.now() < until) {
      const free = tiles.map((_, i) => i).filter(i => !busy.has(i) && i !== last);
      if (free.length) { last = free[Math.floor(random() * free.length)]; flip(tiles[last], shown[last]); }
      await wait(IDLE);
    }
  };
  /** The tiles whose letter changes from `from` to `to`, in a random order. */
  const order = (from, to) => {
    const list = [...to].map((_, i) => i).filter(i => from[i] !== to[i]);
    for (let k = list.length - 1; k > 0; k--) { const j = Math.floor(random() * (k + 1)); [list[k], list[j]] = [list[j], list[k]]; }
    return list;
  };

  while (!watching(into)) await wait(500);
  // The first word comes in as a wave, tile by tile
  await Promise.all(tiles.map(async (_, i) => { await wait(i * WAVE); await land(i, words[0][i] || ' '); }));
  for (let w = 0; ; w = (w + 1) % words.length) {
    into.classList.toggle('flapboard--done', words[w] === name);
    await idle(READ);
    while (!watching(into)) await wait(500);
    // The mix: the next word's letters creep in one at a time, spread evenly over MORPH, while the rest flap in place
    const next = words[(w + 1) % words.length];
    const changes = order(shown.join(''), next);
    const step = MORPH / Math.max(1, changes.length);
    into.classList.remove('flapboard--done');
    await Promise.all([
      idle(MORPH),
      ...changes.map(async (i, k) => { await wait(k * step); await land(i, next[i] || ' '); }),
    ]);
  }
}
