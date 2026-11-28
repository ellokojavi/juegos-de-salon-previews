// The news strip (lab: #seccion-marquee): built inside the real home page by the lab demo. It reads the
// campaigns' own texts (CAMPAIGNS in splash.js, three languages), so a headline is the splash it opens.
// Pure where it can be (`headlines`), so node tests it without a DOM.

/**
 * The treatments, in the order the demo offers them. `kind`: a ticker runs (`cinta`), glides one headline at a
 * time and rests (`pasos`), or a rotator shows one at a time (`giro`); `burbujas` stands still. `family` is the
 * look it starts from (A, B or F); a calm one (`calm`) drops the band, the colour and the sliding title, and
 * `once` stops after one round, so the news is told and then leaves the page alone.
 */
export const TREATMENTS = [
  { id: 'a', family: 'a', kind: 'cinta', name: 'A · Cinta de vidrio', note: 'El vidrio de los filtros, de borde a borde. Las novedades corren sin parar; con el dedo encima se detienen.' },
  { id: 'a1', family: 'a', kind: 'cinta', calm: true, speed: 22, name: 'A1 · Cinta tenue', note: 'Sin franja: letras grises que corren a menos de la mitad de la velocidad. Se ve de reojo, no llama.' },
  { id: 'a2', family: 'a', kind: 'pasos', calm: true, step: 6000, name: 'A2 · Cinta a pasos', note: 'Quieta casi siempre: cada 6 s la cinta se desliza hasta la novedad siguiente y vuelve a quedarse quieta.' },
  { id: 'a3', family: 'a', kind: 'cinta', calm: true, once: true, name: 'A3 · Cinta de una vuelta', note: 'Corre una sola vez al abrir la portada y se detiene. Después se mueve solo con el dedo.' },
  { id: 'b', family: 'b', kind: 'giro', name: 'B · Titular que sube', note: 'Una novedad a la vez, con su etiqueta en amarillo. Sube la siguiente cada 4,5 s y una línea cian cuenta el tiempo.' },
  { id: 'b1', family: 'b', kind: 'giro', calm: true, step: 8000, name: 'B1 · Titular sereno', note: 'Sin franja ni línea que cuenta: la etiqueta en gris y una novedad que aparece suave cada 8 s.' },
  { id: 'b2', family: 'b', kind: 'giro', calm: true, once: true, step: 6000, name: 'B2 · Una vuelta y quieto', note: 'Como B1, pero pasa cada novedad una sola vez y se queda en la primera.' },
  { id: 'f', family: 'f', kind: 'giro', name: 'F · Historias', note: 'Como las historias de Instagram: un segmento por novedad, el emoji en un anillo arcoíris.' },
  { id: 'f1', family: 'f', kind: 'giro', calm: true, step: 8000, name: 'F1 · Historias suaves', note: 'Las historias sin color: segmentos tenues, anillo gris y una novedad que aparece suave cada 8 s.' },
  { id: 'f2', family: 'f', kind: 'burbujas', calm: true, name: 'F2 · Burbujas quietas', note: 'Nada se mueve: una burbuja por novedad, con anillo arcoíris hasta que la abres. Se desliza con el dedo.' },
];

/** The campaigns the strip announces, in order. Their emoji when the campaign has none of its own. */
export const NEWS = ['sudoku-ya', 'aletazo-ya', 'microgames-launch', 'shinobi-babel', 'dominorama-memorice', 'brindis-apoyo'];
const EMOJI = { 'shinobi-babel': '🥷' };

/** The step of a rotator, and the ticker's speed in px per second. */
export const STEP_MS = 4500;
export const SPEED = 50;

const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? o.es ?? '');

/** One headline per campaign that exists: its id, emoji, drawn icon, kicker and title (one line). */
export function headlines(campaigns, lang = 'es', ids = NEWS) {
  return ids.filter(id => campaigns[id]).map(id => {
    const c = campaigns[id];
    const l = !c.langs || c.langs.includes(lang) ? lang : 'en';
    return {
      id,
      emoji: c.emoji || EMOJI[id] || '🎉',
      icon: c.icon || '',
      kicker: pick(c.kicker, l),
      title: pick(c.title, l).replace(/\s*\n\s*/g, ' '),
    };
  });
}

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/**
 * Builds the strip as the first thing in `doc`'s body. `root` is the site's root URL (for a drawn icon),
 * `onPick(id)` opens a campaign. Returns { pause(on), destroy() }.
 */
export function mount(doc, { treatment = 'a', news, root, onPick }) {
  const t = TREATMENTS.find(x => x.id === treatment) || TREATMENTS[0];
  const step = t.step || STEP_MS;
  const strip = doc.createElement('div');
  strip.className = `mq mq--${t.family} mq--${t.id}${t.calm ? ' mq--calma' : ''}`;
  strip.setAttribute('role', 'region');
  strip.setAttribute('aria-label', 'Novedades');
  const emoji = n => `<span class="mq-emoji" aria-hidden="true">${n.icon ? `<img src="${esc(new URL(n.icon, root))}" alt="" width="18" height="18">` : esc(n.emoji)}</span>`;
  const titulo = n => `<span class="mq-titulo"><span class="mq-texto">${esc(n.title)}</span></span>`;
  const kicker = n => (n.kicker ? `<span class="mq-kicker">${esc(n.kicker)}</span>` : '');
  const ir = '<span class="mq-ir" aria-hidden="true">›</span>';
  const timers = [];
  let paused = false;
  let resume = () => {};

  if (t.kind === 'cinta' || t.kind === 'pasos') {
    const row = news.map(n => `<button type="button" class="mq-item" data-id="${n.id}">${emoji(n)}<span>${esc(n.title)}</span></button><span class="mq-sep" aria-hidden="true">✦</span>`).join('');
    strip.innerHTML = `<div class="mq-cinta"><div class="mq-pista">${row}${row.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ')}</div></div>`;
  } else if (t.kind === 'burbujas') {
    strip.innerHTML = `<div class="mq-burbujas">${news.map(n => `<button type="button" class="mq-item" data-id="${n.id}"><span class="mq-anillo">${emoji(n)}</span>${titulo(n)}</button>`).join('')}</div>`;
  } else {
    const inner = n => t.family === 'b' ? `${kicker(n)}${emoji(n)}${titulo(n)}${ir}` : `<span class="mq-anillo">${emoji(n)}</span>${kicker(n)}${titulo(n)}${ir}`;
    const segs = t.family === 'f' ? `<div class="mq-segmentos" aria-hidden="true">${news.map(() => '<span class="mq-seg"></span>').join('')}</div>` : '';
    strip.innerHTML = `<div class="mq-giro">${segs}${news.map(n => `<button type="button" class="mq-item" data-id="${n.id}">${inner(n)}</button>`).join('')}</div>`;
  }
  doc.body.prepend(strip);
  strip.style.setProperty('--mq-paso', `${step}ms`);

  // A finger on a moving row stops it, so the tap lands on the headline under it
  const holdOnTouch = () => {
    strip.addEventListener('pointerdown', () => strip.classList.add('pausa'));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) strip.addEventListener(ev, () => { if (!paused) strip.classList.remove('pausa'); });
  };

  if (t.kind === 'cinta') {
    // The duration from the row's real width, so every treatment of a speed runs at that speed
    const pista = strip.querySelector('.mq-pista');
    strip.style.setProperty('--mq-dur', `${Math.max(10, pista.scrollWidth / 2 / (t.speed || SPEED)).toFixed(1)}s`);
    holdOnTouch();
    if (t.once) {
      // One lap ends on the copy of the start, so dropping the motion shows the same frame; then it is the finger's
      pista.addEventListener('animationend', () => strip.classList.add('quieta'), { once: true });
    }
  } else if (t.kind === 'pasos') {
    // Still almost always: every step the row glides until the next headline stands at the left edge
    const pista = strip.querySelector('.mq-pista');
    const items = [...pista.querySelectorAll('.mq-item')];
    let i = 0;
    const go = (k, glide = true) => {
      pista.classList.toggle('desliza', glide);
      pista.style.transform = `translateX(${-items[k].offsetLeft}px)`;
    };
    const tick = () => {
      if (paused || strip.classList.contains('pausa')) return;
      i += 1;
      go(i);
      // Past the last one the row stands on the copy of the first: jump back to it unseen
      if (i === news.length) timers.push(setTimeout(() => { i = 0; go(0, false); }, 900));
    };
    go(0, false);
    holdOnTouch();
    timers.push(setInterval(tick, step));
  } else if (t.kind === 'giro') {
    const items = [...strip.querySelectorAll('.mq-item')];
    const segs = [...strip.querySelectorAll('.mq-seg')];
    let i = -1;
    let shown = 0;
    let timer = null;
    const show = next => {
      const prev = items[i];
      if (prev) { prev.classList.remove('on'); prev.classList.add('sale'); setTimeout(() => prev.classList.remove('sale'), 600); }
      i = next % items.length;
      shown += 1;
      items[i].classList.remove('sale');
      items[i].classList.add('on');
      segs.forEach((s, k) => { s.classList.toggle('hecho', k < i); s.classList.remove('ahora'); });
      if (segs[i]) { void segs[i].offsetWidth; segs[i].classList.add('ahora'); }
      // A loud treatment slides a long headline to show its end; a calm one leaves it still, in «…»
      const room = items[i].querySelector('.mq-titulo');
      room.classList.remove('largo');
      const over = room.scrollWidth - room.clientWidth;
      if (!t.calm && over > 2) { room.style.setProperty('--mq-sobra', `${-over}px`); void room.offsetWidth; room.classList.add('largo'); }
      if (t.id === 'b') {
        strip.querySelector('.mq-tiempo')?.remove();
        const bar = doc.createElement('span');
        bar.className = 'mq-tiempo';
        strip.append(bar);
      }
      // `once`: after the last one, back to the first and stay there
      if (t.once && shown > items.length) { clearInterval(timer); strip.classList.add('quieta'); segs.forEach(s => s.classList.remove('hecho', 'ahora')); }
    };
    const tick = () => { if (!paused) show(i + 1); };
    show(0);
    timer = setInterval(tick, step);
    timers.push(timer);
    // Back from a splash: that headline was read, so the next one comes in and the step starts again
    resume = () => {
      if (strip.classList.contains('quieta')) return;
      clearInterval(timer); show(i + 1); timer = setInterval(tick, step); timers.push(timer);
    };
  }

  strip.addEventListener('click', e => {
    const b = e.target.closest('.mq-item');
    if (!b) return;
    // A bubble opened is a bubble read: its ring goes grey (in the demo, only until the page reloads)
    b.classList.add('vista');
    onPick?.(b.dataset.id);
  });

  return {
    // While a splash is open the strip waits
    pause(on) {
      paused = on;
      strip.classList.toggle('pausa', on);
      if (!on) resume();
    },
    destroy() { timers.forEach(clearInterval); strip.remove(); },
  };
}
