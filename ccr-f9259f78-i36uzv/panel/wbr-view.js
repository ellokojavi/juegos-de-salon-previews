/**
 * The WBR's page body, drawn from a trend (\`trend()\` in wbr.js): the highlights, the two charts and the
 * three tables. One drawing for the owner's panel (📋 WBR) and the public shared page (/wbr/?id=…),
 * which draws a frozen snapshot of the same trend. No state, and no wbr.js: the caller passes the highlights.
 */
import { el } from '../assets/js/ui.js';

const LOCALE = 'en-US';
const n = v => Number(v || 0).toLocaleString(LOCALE);

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

/** WBR chart A: games finished, the weeks on one scale and the months on theirs; a partial one dashed. */
function weeksChart(t) {
  const fin = t.metricas[0], k = t.cerrada;
  const grupo = (clase, titulo, idx) => {
    const max = Math.max(1, ...idx.map(i => fin.valores[i] || 0));
    return el('div', { class: `wbr-barras ${clase}` },
      el('p', { class: 'wbr-eje' }, titulo),
      el('div', { class: 'wbr-barras-fila' }, ...idx.map(i => {
        const v = fin.valores[i], parcial = t.columnas[i].endsWith('*');
        return el('div', { class: ['wbr-barra', parcial ? 'wbr-barra--parcial' : '', i === k ? 'wbr-barra--cerrada' : ''].filter(Boolean).join(' ') },
          el('span', { class: 'wbr-barra-cifra' }, v === null ? 'n/a' : n(v)),
          el('span', { class: 'wbr-barra-col', style: `--h:${v ? Math.max(0.02, v / max) : 0}` }),
          // --h: its share of the tallest; the room above the bars is kept for the figures, so heights stay proportional
          // On a phone a week is named by its Sunday ("Nov 15*"): its range wraps into three lines
          el('span', { class: 'wbr-barra-rotulo' }, el('span', { class: 'wbr-rotulo-largo' }, t.columnas[i]), el('span', { class: 'wbr-rotulo-corto' }, t.columnas[i].replace(/–.*?(\*?)$/, '$1'))));
      })));
  };
  const semanas = t.columnas.map((_, i) => i).filter(i => t.semanas[i]).reverse();
  const meses = t.columnas.map((_, i) => i).filter(i => !t.semanas[i]).reverse();
  return el('div', { class: 'wbr-grafico' },
    el('h3', {}, 'Games finished: weeks and months'),
    el('div', { class: 'wbr-barras-par' }, grupo('wbr-barras--semanas', 'Weeks', semanas), grupo('wbr-barras--meses', 'Months, their own scale', meses)),
    el('p', { class: 'muted small' }, 'Dashed: partial, so far. Bright: the closed week, bold in the table.'));
}

/** WBR chart B: the newest week's games finished added up from Sunday, against the week before and the four-week average. */
function paceChart(t) {
  const r = t.ritmo, hoy = r.esta.length - 1;
  // The Y axis: about four steps of 1, 2 or 5 × 10ⁿ games, the top one above every line
  const alto = Math.max(1, ...r.esta, ...r.pasada, ...r.promedio);
  const crudo = alto / 4, mag = 10 ** Math.floor(Math.log10(crudo)), paso = Math.max(1, [1, 2, 5, 10].map(m => m * mag).find(x => x >= crudo));
  const max = Math.ceil(alto / paso) * paso, marcas = Array.from({ length: max / paso + 1 }, (_, i) => i * paso);
  const svg = svgEl('svg', { class: 'wbr-ritmo-svg', viewBox: '0 0 6 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  for (const m of marcas.slice(1)) svg.append(svgEl('line', { class: 'wbr-ritmo-guia', x1: 0, x2: 6, y1: 100 - (m / max) * 100, y2: 100 - (m / max) * 100, 'vector-effect': 'non-scaling-stroke' }));
  // The week in progress: today is not over, so its stretch is dashed and the % compares the full days only
  // (a Saturday at 7 am read flat, and against a whole Saturday)
  const parcial = r.parcial, c = parcial ? hoy - 1 : hoy;
  const linea = (xs, clase, desde = 0) => svgEl('polyline', { class: clase, 'vector-effect': 'non-scaling-stroke', points: xs.map((v, i) => `${i + desde},${100 - (v / max) * 100}`).join(' ') });
  svg.append(linea(r.promedio, 'wbr-ritmo-prom'), linea(r.pasada, 'wbr-ritmo-pasada'));
  if (c >= 1) svg.append(linea(r.esta.slice(0, c + 1), 'wbr-ritmo-esta'));
  if (parcial && hoy >= 1) svg.append(linea(r.esta.slice(c), 'wbr-ritmo-esta wbr-ritmo-hoy', c));
  const mismoDia = c >= 0 ? r.pasada[c] : 0, cambio = mismoDia ? Math.round((r.esta[c] / mismoDia - 1) * 100) : null;
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][c];
  const vs = cambio === null ? '' : `${cambio > 0 ? '+' : cambio < 0 ? '−' : '±'}${Math.abs(cambio)}% vs. ${n(mismoDia)} by ${dia} of ${r.anterior.replace('–', '–\u2060')}`;
  return el('div', { class: 'wbr-grafico' },
    el('h3', {}, 'Pace: games finished from Sunday'),
    el('ul', { class: 'wbr-leyenda' },
      el('li', { class: 'wbr-leyenda--esta' }, el('b', {}, `${r.semana}: ${n(r.esta[hoy])}`), parcial ? ` so far${vs ? `; by ${dia}, ${n(r.esta[c])}, ${vs}` : ''}` : vs ? `, ${vs}` : ''),
      el('li', { class: 'wbr-leyenda--pasada' }, `${r.anterior}: ${n(r.pasada[6])}`),
      el('li', { class: 'wbr-leyenda--prom' }, `Average of the four weeks before: ${n(Math.round(r.promedio[6]))}`)),
    el('div', { class: 'wbr-ritmo' },
      el('div', { class: 'wbr-ritmo-eje' }, ...marcas.map(m => el('span', { style: `--y:${100 - (m / max) * 100}%` }, n(m)))),
      el('div', { class: 'wbr-ritmo-area' }, svg, el('span', { class: 'wbr-ritmo-punto', style: `--x:${(hoy / 6) * 100}%;--y:${100 - (r.esta[hoy] / max) * 100}%` })),
      el('span', {}),
      el('div', { class: 'wbr-ritmo-dias' }, ...['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => el('span', {}, d)))),
    el('p', { class: 'muted small' }, `Games finished, added up day by day (Pacific dates): the newest week against the same days of the week before.${parcial ? ' Today is dashed: it is not over, so the % compares the full days.' : ''}`));
}

/** WBR chart D: a game's weeks, oldest to newest, in a line the width of a cell; the partial week dashed. */
export function wbrTendencia(t, valores) {
  const idx = t.columnas.map((_, i) => i).filter(i => t.semanas[i]).reverse();
  const xs = idx.map(i => valores[i]), max = Math.max(1, ...xs.filter(v => v !== null));
  const W = 72, H = 22, x = j => 2 + ((W - 4) * j) / (xs.length - 1), y = v => H - 3 - ((H - 6) * v) / max;
  const svg = svgEl('svg', { class: 'wbr-tendencia', width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
  const tramos = [[], []]; // closed weeks, then the partial one
  xs.forEach((v, j) => { if (v === null) return; const parcial = t.columnas[idx[j]].endsWith('*'); if (parcial && tramos[0].length) tramos[1].push(tramos[0].at(-1)); tramos[parcial ? 1 : 0].push(`${x(j)},${y(v)}`); });
  if (tramos[0].length) svg.append(svgEl('polyline', { points: tramos[0].join(' ') }));
  if (tramos[1].length > 1) svg.append(svgEl('polyline', { class: 'wbr-tendencia-parcial', points: tramos[1].join(' ') }));
  const j = idx.indexOf(t.cerrada);
  if (xs[j] !== null && xs[j] !== undefined) svg.append(svgEl('circle', { cx: x(j), cy: y(xs[j]), r: 2.5 }));
  return svg;
}

/** Everything under the WBR's title and navigation, from its trend \`t\`. */
export function wbrBody(t, destacados = []) {
  const k = t.cerrada;
  const fmt = (v, dec) => (v === null ? 'n/a' : dec === 'auto' ? (Number.isInteger(v) ? n(v) : v.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })) : dec === '%' ? `${v.toLocaleString(LOCALE, { maximumFractionDigits: 1 })}%` : dec ? v.toFixed(1) : n(v));
  const cambioTxt = c => (c === null || c === undefined ? '' : ` (${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c)}%)`);
  const tabla = (filas, cabezaCol, tendencia = false) => el('div', { class: 'wbr-scroll' }, el('table', { class: 'wbr' },
    el('thead', {}, el('tr', {}, el('th', {}, cabezaCol), tendencia ? el('th', {}, 'Trend') : null, ...t.columnas.map((c, i) => el('th', { class: i === 5 + k ? 'wbr-mes' : null }, c)))),
    el('tbody', {}, ...filas.map(([nombre, valores, cambio, dec, clase, est]) => el('tr', { class: clase || null }, el('th', {}, nombre),
      tendencia ? el('td', { class: 'wbr-tendencia-celda' }, dec === '%' ? '' : wbrTendencia(t, valores)) : null,
      ...valores.map((v, i) => { const x = `${est?.[i] && v !== null ? '~' : ''}${fmt(v, dec)}`; return el('td', { class: [i === k ? 'wbr-ahora' : '', i === 5 + k ? 'wbr-mes' : '', v === null ? 'wbr-na' : ''].filter(Boolean).join(' ') || null },
        i === k && v !== null ? [el('b', {}, x), cambioTxt(cambio)] : x); }))))));
  const u = t.usuariosJuego;
  const desdeConteo = u.desdeReal ? `the count by game began (${u.desdeReal.replace(/, \d{4}$/, '')}, D-590)` : 'the count by game began (D-590)';
  return [
    el('ul', { class: 'wbr-destacados' }, ...destacados.map(x => el('li', {}, x))),
    weeksChart(t),
    paceChart(t),
    el('h3', {}, 'Headline'),
    tabla(t.metricas.map(m => [m.nombre, m.valores, m.cambio, m.decimales]), ''),
    el('p', { class: 'muted small' }, t.leyenda),
    el('h3', {}, 'Games'),
    el('p', { class: 'muted small' }, 'Every game finished at least once in the trend\'s weeks, ranked by the closed week. Games finished, as in the headline; every mode and version, La Copa included. Trend: its weeks, oldest to newest. n/a: not measured yet, or the game was not out yet. Under the total, the share of games finished the top 3, 5, 10 and 20 take, each column ranking its own games.'),
    tabla([...t.todos.map((g, i) => [`${i + 1}. ${g.juego}${g.nuevo ? ` (out ${g.nuevo.replace(/, \d{4}$/, '')})` : ''}`, g.valores, g.cambio]),
      ['Total games finished', t.totales.valores, t.totales.cambio, false, 'wbr-total'],
      ...[3, 5, 10, 20].map(nn => [`Top ${nn} share`, t.totales.cuota[nn], null, '%'])], 'Game', true),
    el('h3', {}, 'Weekly active users by game'),
    el('p', { class: 'muted small' }, `Browsers that finished each game at least once in the week; a month is the average of its full weeks (Sunday to Saturday) since the game came out. Sorted by the closed week, most first. ~ estimated: before ${desdeConteo}, the browsers that started a game that week split by each game's share of the games finished; it reads low, since one browser plays several games.`),
    u.filas.length ? tabla(u.filas.map(f => [f.juego, f.valores, f.cambio, 'auto', null, u.estimado]), 'Game') : el('p', { class: 'empty' }, 'No browsers measured in this week yet.'),
  ];
}
