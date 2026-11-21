/**
 * A game's cover animation alone in a page (cup/cover/, see its index.html): `?game=<id>` mounts the
 * game's `portada` (the demo that plays itself on its waiting room) or, without one, its `ejemplo` (the
 * "how to play" drawing), and tells the framing page its height: `{ type: 'cover-demo', game, height }`,
 * with height 0 when the game brings neither (the frame is then put away). That height is the drawing's own; when
 * the frame is made taller than it, the drawing grows to fill the frame, centred.
 */
import { el } from '../../assets/js/ui.js';
import { getLang } from '../../assets/js/i18n.js';
import { param } from '../../assets/js/parametros.js';
import { LOCALES } from '../rules.js';
import { loadGame } from '../games/index.js';

const game = param('game') || '';
/** The tallest an example drawing shows in the frame, in px. */
export const MAX_EXAMPLE = 260;
const ZOOMS = [1, 0.9, 0.8];
/** How many times its own size a drawing may grow to fill a taller frame. */
export const MAX_GROW = 3;
/** …and how small it may get when the frame is shorter than it. */
export const MIN_FIT = 0.5;
const tell = height => { if (parent !== window) parent.postMessage({ type: 'cover-demo', game, height }, location.origin); };

/** What a game draws to show itself: its animated cover first, else its example. Pure but for the game's own nodes. */
export const demoOf = (J, { T, variante = null } = {}) => (J?.portada ? { kind: 'cover', node: J.portada({ variante }) }
  : J?.ejemplo ? { kind: 'example', node: J.ejemplo({ el, T, variante }) } : null);

if (typeof document !== 'undefined') {
  const lang = getLang();
  document.documentElement.lang = lang;
  const box = document.getElementById('demo');
  loadGame(game).then(J => {
    const demo = demoOf(J, { T: LOCALES[lang] || LOCALES.es });
    if (!demo?.node) return tell(0);
    box.dataset.kind = demo.kind;
    // The cover's demo sits where the waiting room puts it, so its own styles apply
    box.append(demo.kind === 'cover' ? el('div', { class: 'intro-hero' }, demo.node) : demo.node);
    // The drawing's height, now and whenever it changes (a stylesheet arriving, a caption wrapping). An example
    // drawn for a whole panel (Tango's, Zip's) is shrunk towards MAX_EXAMPLE px, so the sheet keeps room for its text
    let last = -1;
    const height = () => box.getBoundingClientRect().height;
    const zoom = z => { box.style.zoom = Math.abs(z - 1) < 0.01 ? '' : String(z); };
    const measure = () => {
      // Its own size first: an example at the largest step that fits (its figures may go side by side as it
      // shrinks), never under the last step, so its captions stay readable; a cover demo as its game draws it
      let base = 1;
      if (demo.kind === 'example') for (const z of ZOOMS) { base = z; zoom(z); if (height() <= MAX_EXAMPLE) break; }
      else zoom(1);
      const h = Math.ceil(height());
      if (h !== last) { last = h; tell(h); }
      // Then it grows into the room the frame gives (the sheet keeps one height for its two tabs, and the frame
      // takes what the details leave): up to MAX_GROW times, and never wider or taller than the frame
      // …and on a short screen, where the frame gets less than the drawing's size, it shrinks to fit, down to MIN_FIT
      const room = innerHeight;
      if (h <= 0 || room <= 0 || Math.abs(room - h) < h * 0.03) return;
      let z = Math.max(MIN_FIT, Math.min(MAX_GROW, room / h));
      for (let i = 0; i < 3; i++) {
        zoom(base * z);
        const right = Math.max(0, ...[box, ...box.querySelectorAll('*')].map(n => n.getBoundingClientRect().right));
        const over = Math.max(height() / room, right / innerWidth);
        if (over <= 1.01) break;
        z = Math.max(MIN_FIT, z / over);
      }
    };
    addEventListener('resize', measure);
    new ResizeObserver(measure).observe(box);
    measure();
  }).catch(() => tell(0));
}
