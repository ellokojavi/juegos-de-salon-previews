/**
 * The lab's index (the owner, 2026-11-08): at the top of /labs/, one tap per card still being tried
 * (🎲 Juegos en prueba, ✨ Mejoras en prueba), so a card is reached without scrolling past every game.
 * La Bodega is left out. Drawn after launched.js has moved the cards published for everyone, so a
 * card that just went to La Bodega is not listed. Each entry is a plain link to the card's id
 * (`#seccion-offline`), so it works as a deep link too.
 */

/** The groups listed, in page order. */
export const GROUPS = ['activos', 'mejoras'];

/** The entries for `doc`: [{ group, title, items: [{ id, label, icon }] }] (`icon`: the drawing a card's title opens with, as a game's
 * drawing stands for its emoji on screen, DESIGN.md rule 9), only visible cards with an id and a title. Pure, for the test. */
export function entries(doc) {
  return GROUPS.map(g => doc.getElementById(g)).filter(Boolean).map(group => ({
    group: group.id,
    title: group.querySelector(':scope > h2')?.textContent.trim() || '',
    items: [...group.querySelectorAll(':scope > section.seccion[id]')]
      .filter(s => !s.hidden && s.querySelector(':scope > h2'))
      .map(s => { const h = s.querySelector(':scope > h2'); return { id: s.id, label: h.textContent.trim(), icon: h.querySelector(':scope > img')?.getAttribute('src') || null }; }),
  })).filter(g => g.items.length);
}

/** Draws the index into `#indice`; hidden when there is nothing to list. */
export function draw(doc = globalThis.document) {
  const nav = doc.getElementById('indice');
  if (!nav) return null;
  const list = entries(doc);
  nav.replaceChildren();
  nav.hidden = !list.length;
  for (const g of list) {
    const block = doc.createElement('div');
    block.className = 'indice-grupo';
    const h = doc.createElement('p');
    h.className = 'indice-titulo';
    h.textContent = g.title;
    const chips = doc.createElement('div');
    chips.className = 'chips';
    for (const it of g.items) {
      const a = doc.createElement('a');
      a.className = 'chip-btn';
      a.href = `#${it.id}`;
      a.textContent = it.label;
      if (it.icon) {
        const img = doc.createElement('img');
        img.src = it.icon; img.alt = ''; img.width = 16; img.height = 16;
        img.style.cssText = 'width:1.1em;height:1.1em;vertical-align:-0.15em;margin-right:0.3em';
        a.prepend(img);
      }
      chips.append(a);
    }
    block.append(h, chips);
    nav.append(block);
  }
  return nav;
}
