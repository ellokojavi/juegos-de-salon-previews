/**
 * Screen bands (viewport size): which screens play, to decide what to design and test for.
 * Each visit counts once, on its first page, as `pant/w<width>-h<height>-<v|h>` in
 * `stats/<env>/days/<day>`. Only the band is kept, never the exact size: it costs little and
 * identifies nobody. Sizes are CSS pixels of the browser window (innerWidth × innerHeight), so the
 * browser's own bars are already taken off the height.
 *
 * Pure and without DOM, so node tests it (`screen-bands.test.mjs`); the panel reads the same lists.
 */

/** Width bands, from the narrowest. `min` is the first width in the band; `eg` are real examples. */
export const WIDTH_BANDS = [
  { id: 'w320', min: 0, label: '≤ 340 px', eg: 'iPhone 5 / SE (1st gen), old small Androids (320)' },
  { id: 'w360', min: 341, label: '341–374 px', eg: 'Samsung Galaxy A and S, Motorola Moto G, many Androids (360); Galaxy Z Fold closed (344)' },
  { id: 'w375', min: 375, label: '375–399 px', eg: 'iPhone SE 2/3, 6–8, 12/13 mini (375); iPhone 12–16 (390–393); Xiaomi Redmi Note (393)' },
  { id: 'w400', min: 400, label: '400–429 px', eg: 'iPhone 6–8 Plus, XR, 11 (414); Google Pixel, Galaxy S Ultra and A5x (412)' },
  { id: 'w430', min: 430, label: '430–599 px', eg: 'iPhone 14 Pro Max, 15/16 Plus and Pro Max (430–440)' },
  { id: 'w600', min: 600, label: '600–899 px', eg: 'iPad mini and iPad upright (744–820), Android tablets, any phone turned sideways (667–932)' },
  { id: 'w900', min: 900, label: '900–1199 px', eg: 'iPad Pro upright (1024), iPad sideways (1080–1180), small laptops' },
  { id: 'w1200', min: 1200, label: '≥ 1200 px', eg: 'Laptops and desktops (1280, 1366, 1440, 1920)' },
];

/** Height bands, from the shortest: what is left for the page once the browser's bars are out. */
export const HEIGHT_BANDS = [
  { id: 'h0', min: 0, label: '< 640 px', eg: 'iPhone SE and 8 in Safari (≈550–630), any phone sideways, laptops with a short screen' },
  { id: 'h640', min: 640, label: '640–799 px', eg: 'Most phones in the browser: iPhone 12–16 (≈660–750), Galaxy and Pixel (≈650–780)' },
  { id: 'h800', min: 800, label: '≥ 800 px', eg: 'Big phones installed on the home screen, tablets, most desktops' },
];

const bandOf = (bands, x) => bands.reduce((hit, b) => (x >= b.min ? b : hit), bands[0]).id;

/** `{ w: 390, h: 664 }` → `'w375-h640-v'`; '' when the size is unknown. */
export function screenBand({ w, h } = {}) {
  const W = Number(w), H = Number(h);
  if (!(W > 0) || !(H > 0)) return '';
  return `${bandOf(WIDTH_BANDS, W)}-${bandOf(HEIGHT_BANDS, H)}-${W > H ? 'h' : 'v'}`;
}

/** `'w375-h640-v'` → `{ w: 'w375', h: 'h640', o: 'v' }`; null when it is not one of ours. */
export function parseBand(key) {
  const m = /^(w\d+)-(h\d+)-([vh])$/.exec(String(key));
  if (!m || !WIDTH_BANDS.some(b => b.id === m[1]) || !HEIGHT_BANDS.some(b => b.id === m[2])) return null;
  return { w: m[1], h: m[2], o: m[3] };
}

/** The same check as the Firebase rule on `pant/$pant` (kept equal by the test). */
export const BAND_RULE = /^w(320|360|375|400|430|600|900|1200)-h(0|640|800)-[vh]$/;
