/**
 * The animated previews at the bottom of each microgame's intro card (the owner, 2026-11-18): a small drawing of what
 * the finger does in that game (tap, tap, tap on the balloon; pick one of the options; drag to reorder…), looping,
 * pinned where the thumbs rest. One inline SVG each, with its own SMIL animation, so it stays sharp at any size and
 * weighs nothing; with reduced motion the drawing is still. stage.js adds them to each game's `command()`.
 * The drag and swipe games' own previews (¡Atrapa!, ¡Equilibra!, the five purple ones) live in stage.js.
 */
const REDS = '#ff4d5e', BLUE = '#4d8bff', GREEN = '#3ddc84', YEL = '#ffd23f';

export function makeIntros(reduce, MOLE) {
  // One looping attribute animation / transform animation, none with reduced motion
  const A = (attr, values, keyTimes, dur) => reduce ? '' : `<animate attributeName="${attr}" values="${values}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite"/>`;
  const AT = (values, keyTimes, dur, type = 'translate') => reduce ? '' : `<animateTransform attributeName="transform" type="${type}" values="${values}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite"/>`;
  const box = (kind, inner) => `<div class="dg-intro swipe dgk-${kind}" aria-hidden="true"><svg viewBox="0 0 200 64" preserveAspectRatio="xMidYMid meet">${inner}</svg></div>`;
  const f2 = n => (Math.round(n * 1000) / 1000).toString();
  const THUMB = '<g transform="translate(-4 -3)"><text x="0" y="22" font-size="22" text-anchor="middle">👆</text></g>';

  /** A thumb that visits `pts` in turn, waiting a moment on each; `taps` lists the points where it taps (a ring spreads). */
  const finger = (pts, dur, taps = pts.map((_, i) => i)) => {
    const n = pts.length, seg = 1 / n, kt = [0], vs = [pts[0]];
    pts.forEach((p, k) => { kt.push(k * seg + seg * 0.1, k * seg + seg * 0.6); vs.push(p, p); });
    kt.push(1); vs.push(pts[0]);
    const rings = taps.map(k => { const a = k * seg + seg * 0.1, [x, y] = pts[k], b = Math.min(0.999, a + seg * 0.45), kts = `0;${f2(a)};${f2(b)};1`;
      return `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#fff" stroke-width="1.5" opacity="0">${A('opacity', '0;0.9;0;0', kts, dur)}${A('r', '2;2;13;13', kts, dur)}</circle>`; }).join('');
    return `${rings}<g transform="translate(${pts[0].join(' ')})">${THUMB}${AT(vs.map(p => p.join(' ')).join(';'), kt.map(f2).join(';'), dur)}</g>`;
  };
  // The moment (0–1 of the loop) the thumb reaches its k-th point
  const at = (k, n) => k / n + 0.1 / n;
  // A glow that switches on when the thumb taps point k of n
  const glow = (shape, k, n, dur) => `<g opacity="0">${shape}${A('opacity', '0;0;1;1;0', `0;${f2(at(k, n))};${f2(at(k, n) + 0.03)};0.96;1`, dur)}</g>`;
  const btn = (x, y, w, h, inner, extra = '') => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#fff" fill-opacity="0.12" stroke="#fff" stroke-opacity="0.3" ${extra}/>${inner}</g>`;
  const label = (x, y, txt, size = 16, fill = '#fff') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" font-weight="900" font-family="inherit">${txt}</text>`;

  /** "Pick one": a head (what you are asked), a row of big options and a thumb that goes to one and taps it. */
  const choices = ({ kind, head = '', n, w, draw, pick, y = 26, h = 34, dur = 3.2 }) => {
    const gap = 8, x0 = 100 - (n * w + (n - 1) * gap) / 2, cx = i => x0 + i * (w + gap) + w / 2;
    const row = Array.from({ length: n }, (_, i) => btn(x0 + i * (w + gap), y, w, h, draw(cx(i), y + h / 2, i))).join('');
    const hit = glow(`<rect x="${x0 + pick * (w + gap)}" y="${y}" width="${w}" height="${h}" rx="9" fill="${YEL}" fill-opacity="0.3" stroke="${YEL}" stroke-width="2.5"/>`, 1, 2, dur);
    return box(kind, `${head}${row}${hit}${finger([[185, 60], [cx(pick) - 2, y + h / 2 - 4]], dur, [1])}`);
  };
  const num = (txt, size = 17) => (cx, cy) => label(cx, cy + size / 3, txt, size);

  const I = {};
  // ---- Tap ----
  I.toca = () => { const n = 4, dur = 3.2, ts = [0], pump = ['0 0'], grow = ['6'], growY = ['7'];
    for (let k = 0; k < n; k++) { const a = at(k, n); ts.push(a, a + 0.07, a + 0.1); pump.push('0 0', '0 5', '0 0'); grow.push(`${6 + k * 3}`, `${6 + k * 3}`, `${9 + k * 3}`); growY.push(`${7 + k * 3.2}`, `${7 + k * 3.2}`, `${10.2 + k * 3.2}`); }
    ts.push(1); pump.push('0 0'); grow.push('6'); growY.push('7');
    const tk = ts.map(f2).join(';');
    return box('toca', `<rect x="20" y="54" width="34" height="4" rx="2" fill="#fff" fill-opacity="0.2"/>
      <g transform="translate(37 40)"><ellipse rx="6" ry="7" fill="${REDS}" stroke="#fff" stroke-opacity="0.5" stroke-width="1">${A('rx', grow.join(';'), tk, dur)}${A('ry', growY.join(';'), tk, dur)}</ellipse></g>
      <g transform="translate(150 34)"><g><rect x="-4" y="-12" width="8" height="12" rx="2" fill="#aaa"/><rect x="-13" y="0" width="26" height="10" rx="4" fill="${YEL}"/>${AT(pump.join(';'), tk, dur)}</g></g>
      ${finger([[150, 22], [150, 22], [150, 22], [150, 22]], dur, [0, 1, 2, 3])}`); };
  I.espera = () => box('espera', `<circle cx="100" cy="26" r="16" fill="${REDS}">${A('fill', `${REDS};${REDS};${GREEN};${GREEN};${REDS}`, '0;0.45;0.5;0.95;1', 3.2)}</circle>
    ${finger([[100, 44], [100, 44]], 3.2, [1])}${label(100, 62, '…', 10)}`);
  I.quecolor = () => choices({ kind: 'quecolor', head: label(100, 17, 'ROJO', 15, BLUE), n: 4, w: 36, y: 28, h: 32, pick: 1,
    draw: (cx, cy, i) => `<circle cx="${cx}" cy="${cy}" r="11" fill="${[REDS, BLUE, GREEN, YEL][i]}" stroke="#fff" stroke-width="2"/>` });
  I.cuenta = () => choices({ kind: 'cuenta', head: label(100, 18, '🍎🍎🍎🍎', 14), n: 3, w: 46, y: 26, h: 34, pick: 1, draw: (cx, cy, i) => num(['3', '4', '5'][i])(cx, cy) });
  I.calcula = () => choices({ kind: 'calcula', head: label(100, 18, '7 + 5', 15), n: 3, w: 46, y: 26, h: 34, pick: 1, draw: (cx, cy, i) => num(['11', '12', '13'][i])(cx, cy) });
  I.completa = () => choices({ kind: 'completa', head: label(100, 18, '2 · 4 · 6 · ?', 14), n: 3, w: 46, y: 26, h: 34, pick: 1, draw: (cx, cy, i) => num(['7', '8', '9'][i])(cx, cy) });
  I.quehora = () => choices({ kind: 'quehora', head: `<circle cx="100" cy="14" r="10" fill="none" stroke="#fff" stroke-width="2"/><path d="M100 14 V8 M100 14 H106" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, n: 3, w: 54, y: 28, h: 32, pick: 1, draw: (cx, cy, i) => num(['2:00', '3:00', '4:00'][i], 13)(cx, cy) });
  I.sombra = () => choices({ kind: 'sombra', head: label(100, 18, '🐘', 15), n: 3, w: 46, y: 26, h: 34, pick: 1,
    draw: (cx, cy, i) => `<text x="${cx}" y="${cy + 6}" font-size="18" text-anchor="middle" style="filter:brightness(0)" opacity="0.85">${['🐴', '🐘', '🦒'][i]}</text>` });
  I.mas = () => { const dots = (cx, cy, k) => Array.from({ length: k }, (_, i) => `<circle cx="${cx - 16 + (i % 3) * 16}" cy="${cy - 7 + Math.floor(i / 3) * 14}" r="5" fill="${YEL}"/>`).join('');
    return choices({ kind: 'mas', n: 2, w: 78, y: 12, h: 42, pick: 1, draw: (cx, cy, i) => dots(cx, cy, [3, 5][i]) }); };
  I.diferente = () => { const board = (x, odd) => Array.from({ length: 9 }, (_, i) => `<circle cx="${x + (i % 3) * 16}" cy="${14 + Math.floor(i / 3) * 16}" r="5.5" fill="${odd === i ? '#ff7ac8' : BLUE}"/>`).join('');
    const ox = 118 + 16, oy = 14 + 16 * 1;
    return box('diferente', `${board(36, -1)}${board(118, 5)}<line x1="100" y1="4" x2="100" y2="60" stroke="#fff" stroke-opacity="0.35" stroke-dasharray="3 3"/>
      ${glow(`<circle cx="${118 + 32}" cy="${14 + 16}" r="10" fill="none" stroke="${YEL}" stroke-width="2.5"/>`, 1, 2, 3)}${finger([[170, 62], [118 + 32 - 2, 14 + 16 - 2]], 3, [1])}`); };
  I.cualfalta = () => { const em = ['🍎', '🍌', '🍇', '🍓'];
    return box('cualfalta', `${em.map((e, i) => label(56 + i * 30, 24, e, 20)).join('').replace(/<text x="86"[^>]*>🍌<\/text>/, m => m.replace('<text', '<text opacity="1"').replace('</text>', `${A('opacity', '1;1;0;0;1', '0;0.12;0.2;0.9;1', 3.6)}</text>`))}
      <rect x="71" y="6" width="30" height="26" rx="8" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-dasharray="3 3"/>
      ${[['🍇', 70], ['🍌', 100], ['🍓', 130]].map(([e, x]) => label(x, 56, e, 18)).join('')}
      <g>${label(0, 0, '🍌', 20)}${AT('100 54;100 54;86 24;86 24;100 54', '0;0.48;0.7;0.95;1', 3.6)}${A('opacity', '0;0;1;1;0', '0;0.45;0.5;0.95;1', 3.6)}</g>
      ${finger([[160, 60], [96, 52]], 3.6, [1])}`); };
  I.dondequedo = () => { const cup = (x, extra = '') => `<g transform="translate(${x} 34)"><path d="M-14 -22 H14 L11 14 H-11 Z" fill="${REDS}" stroke="#fff" stroke-opacity="0.6" stroke-width="1.5"/>${extra}</g>`;
    return box('dondequedo', `<circle cx="100" cy="46" r="6" fill="#fff"/>
      <g>${cup(100)}${AT('0 0;0 -16;0 0;0 0;0 0;0 0', '0;0.08;0.18;0.5;0.62;1', 3.6)}</g>
      <g>${cup(60)}${AT('0 0;0 0;40 0;40 0;0 0;0 0', '0;0.22;0.34;0.9;0.98;1', 3.6)}</g>
      <g>${cup(140)}${AT('0 0;0 0;-40 0;-40 0;0 0;0 0', '0;0.22;0.34;0.9;0.98;1', 3.6)}</g>
      ${finger([[170, 60], [100, 40]], 3.6, [1])}`); };
  I.repite = () => { const pads = [[REDS, 62, 6], [BLUE, 104, 6], [GREEN, 62, 36], [YEL, 104, 36]], seq = [0, 3, 1], dur = 5.2, t1 = k => 0.06 + k * 0.1, t2 = k => 0.55 + k * 0.1;
    // Each pad lights in the sequence in the first half; then the thumb taps the same order in the second half
    const track = i => { const ts = [0], vs = ['0.35'];
      [t1, t2].forEach(fn => seq.forEach((v, k) => { if (v !== i) return; ts.push(fn(k) - 0.002, fn(k), fn(k) + 0.05, fn(k) + 0.052); vs.push('0.35', '1', '1', '0.35'); }));
      ts.push(1); vs.push('0.35'); return A('opacity', vs.join(';'), ts.map(f2).join(';'), dur); };
    const padsSvg = pads.map(([c, x, y], i) => `<rect x="${x}" y="${y}" width="34" height="26" rx="8" fill="${c}" opacity="0.35">${track(i)}</rect>`).join('');
    const centre = i => [pads[i][1] + 17, pads[i][2] + 13], start = [170, 60];
    const kt = [0, 0.5], vs = [start, start];
    seq.forEach((v, k) => { kt.push(t2(k), t2(k) + 0.06); vs.push(centre(v), centre(v)); });
    kt.push(1); vs.push(start);
    const rings = seq.map((v, k) => { const [x, y] = centre(v), a = t2(k), kts = `0;${f2(a)};${f2(a + 0.06)};1`;
      return `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#fff" stroke-width="1.5" opacity="0">${A('opacity', '0;0.9;0;0', kts, dur)}${A('r', '2;2;13;13', kts, dur)}</circle>`; }).join('');
    return box('repite', `${padsSvg}${rings}<g transform="translate(${start.join(' ')})">${THUMB}${AT(vs.map(p => p.join(' ')).join(';'), kt.map(f2).join(';'), dur)}</g>`); };
  I.aplasta = () => box('aplasta', `${[[40, 20, 0], [90, 46, 0.2], [150, 24, 0.4]].map(([x, y, d], i) => `<g transform="translate(${x} ${y})"><g><text font-size="16" text-anchor="middle">🪰</text>${AT(`0 0;8 -5;-6 4;0 0`, '0;0.3;0.7;1', 1.4 + d)}${i === 1 ? A('opacity', '1;1;0;0;1', '0;0.4;0.45;0.9;1', 1.4 + d) : ''}</g></g>`).join('')}
    ${glow(`<text x="90" y="52" font-size="18" text-anchor="middle">💥</text>`, 1, 2, 2.8)}${finger([[170, 58], [90, 40]], 2.8, [1])}`);
  I.revienta = () => box('revienta', `${[[50, '#9aa7ff', 3.2, 0], [100, BLUE, 3.2, 0], [150, '#8a5cff', 3.2, 0.3]].map(([x, c, d], i) => `<circle cx="${x}" cy="70" r="${i === 1 ? 10 : 8}" fill="${c}" fill-opacity="0.8" stroke="#fff" stroke-opacity="0.6">${A('cy', '72;72;-8', '0;0.0;1', d + 1.2 * i)}${i === 1 ? A('opacity', '1;1;0;0', '0;0.56;0.6;1', d) : ''}</circle>`).join('')}
    ${finger([[170, 60], [100, 26]], 3.2, [1])}`);
  I.ordena = () => { const colors = [['#ff4d5e', 62], ['#4d8bff', 40], ['#3ddc84', 24]], slot = [6, 24, 42], start = [1, 2, 0];   // big, medium, small; they begin in the wrong order
    const bar = ([c, w], i) => `<g><rect x="${100 - w / 2}" y="0" width="${w}" height="14" rx="5" fill="${c}" stroke="#fff" stroke-opacity="0.5"/>${AT(`0 ${slot[start[i]]};0 ${slot[start[i]]};0 ${slot[i]};0 ${slot[i]};0 ${slot[start[i]]}`, '0;0.18;0.5;0.95;1', 3.4)}</g>`;
    const grab = `100 ${slot[1] + 7}`, drop = `100 ${slot[0] + 7}`;
    return box('ordena', `${colors.map(bar).join('')}<g transform="translate(${grab})">${THUMB}${AT(`${grab};${grab};${drop};${drop};${grab}`, '0;0.18;0.5;0.95;1', 3.4)}</g>`); };
  I.conecta = () => { const cell = (c, r) => [60 + c * 20, 12 + r * 18];
    const holes = Array.from({ length: 12 }, (_, i) => { const c = i % 4, r = Math.floor(i / 4), [x, y] = cell(c, r), filled = r === 2 && c < 3; return `<circle cx="${x + 20}" cy="${y + 4}" r="7" fill="${filled ? YEL : '#fff'}" fill-opacity="${filled ? 1 : 0.1}" stroke="#fff" stroke-opacity="0.3"/>`; }).join('');
    const top = [cell(3, 0)[0] + 20, 2], bottom = [cell(3, 2)[0] + 20, cell(3, 2)[1] + 4];
    return box('conecta', `${holes}<g><circle r="7" fill="${YEL}"/>${AT(`${top.join(' ')};${top.join(' ')};${bottom.join(' ')};${bottom.join(' ')};${top.join(' ')}`, '0;0.2;0.6;0.95;1', 3.4)}</g>
      <g transform="translate(${top[0]} ${top[1] + 4})">${THUMB}${AT(`${top[0]} ${top[1] + 4};${top[0]} ${top[1] + 4};${bottom[0]} ${bottom[1] + 4};${bottom[0]} ${bottom[1] + 4};${top[0]} ${top[1] + 4}`, '0;0.2;0.6;0.95;1', 3.4)}</g>`); };
  I.para = () => box('para', `<path d="M40 56 A60 60 0 0 1 160 56" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="2"/><path d="M85 56 A28 28 0 0 1 115 56" fill="none" stroke="${GREEN}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.7"/>
    <g transform="translate(100 56)"><g><line x1="0" y1="0" x2="0" y2="-52" stroke="${YEL}" stroke-width="3" stroke-linecap="round"/>${AT('-70;-70;0;0;-70', '0;0.1;0.55;0.95;1', 3.2, 'rotate')}</g></g>
    ${glow(`<circle cx="100" cy="30" r="16" fill="none" stroke="${GREEN}" stroke-width="3"/>`, 1, 2, 3.2)}${finger([[170, 60], [118, 58]], 3.2, [1])}`);
  I.rebota = () => box('rebota', `${[60, 100, 140].map((x, i) => `<text x="${x}" y="16" font-size="14" text-anchor="middle">👾</text>`).join('')}
    <g><rect x="-16" y="44" width="32" height="5" rx="2.5" fill="${YEL}"/>${AT('60 0;140 0;60 0', '0;0.5;1', 3.2)}</g>
    <circle r="3.5" fill="#fff">${reduce ? '' : `<animateMotion path="M60 40 L100 22 L140 40 L100 24 L60 40" dur="3.2s" repeatCount="indefinite"/>`}</circle>
    <g transform="translate(60 54)">${THUMB}${AT('60 54;140 54;60 54', '0;0.5;1', 3.2)}</g>`);
  I.hands = () => box('hands', `${label(46, 38, '3:00', 20)}<circle cx="136" cy="32" r="26" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>
    <line x1="136" y1="32" x2="136" y2="10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <g transform="translate(136 32)"><g><line x1="0" y1="0" x2="0" y2="-14" stroke="${YEL}" stroke-width="4" stroke-linecap="round"/>${AT('0;0;90;90;0', '0;0.15;0.6;0.95;1', 3.4, 'rotate')}</g></g>
    <g>${THUMB}${reduce ? '' : `<animateMotion path="M136 18 A14 14 0 0 1 150 32" dur="3.4s" repeatCount="indefinite" keyPoints="0;0;1;1;0" keyTimes="0;0.15;0.6;0.95;1" calcMode="linear"/>`}</g>`);
  I.notoques = () => { const hole = x => `<ellipse cx="${x}" cy="50" rx="19" ry="7" fill="#2a1608"/>`;
    const pop = (x, body, times) => `<g transform="translate(${x} 50)"><g>${body}${AT('0 14;0 14;0 -8;0 -8;0 14;0 14', times, 4)}</g></g>`;
    const moleSvg = `<svg x="-13" y="-26" width="26" height="28" viewBox="0 0 100 100">${MOLE.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
    const bomb = '<text y="0" font-size="20" text-anchor="middle">💣</text>';
    return box('notoques', `${hole(40)}${hole(100)}${hole(160)}
      ${pop(40, moleSvg, '0;0.05;0.12;0.3;0.38;1')}${pop(100, bomb, '0;0.36;0.42;0.6;0.68;1')}${pop(160, moleSvg, '0;0.64;0.7;0.88;0.94;1')}
      ${finger([[170, 62], [44, 30], [100, 62], [164, 30]], 4, [1, 3])}`); };
  return I;
}
