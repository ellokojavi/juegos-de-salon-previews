/**
 * Críptico: «Propón tu críptico» (the owner, 2026-11-19). At the end of a clue the player can send one of
 * their own: the clue, its answer and, if they like, how one gets from one to the other, with the name it
 * would be published under. It goes to `feedback/` like any message from the app (D-104), with the kind
 * `criptico` already picked, so it reaches the panel and becomes an issue the feedback agent reviews for
 * the owner (docs/FEEDBACK-TRIAGE.md). Once approved it joins clues.js with its author (`by`), and the day
 * it comes up its author does not play it: «Hoy es tu críptico» (game.js).
 */
import { el } from '../../assets/js/ui.js';
import { leerYo } from '../../assets/js/jugador.js';
import { nombreDelCelular, versionOf, releaseOf } from '../../assets/js/transport/stats.js';
import { GAME_ID } from './rules.js';

/** The kind the rules accept for a proposed clue (firebase/database.rules.json, `feedback/$id/tipo`). */
export const KIND = 'criptico';
export const MAX = { clue: 200, answer: 30, how: 300, name: 40 };

/** The message as the owner reads it in the panel and the issue: one line per field. */
export function proposalText({ clue, answer, how = '' }) {
  return [
    `🗝️ Pista: ${clue}`,
    `🔑 Respuesta: ${answer}`,
    how ? `🧩 Cómo se llega: ${how}` : '',
  ].filter(Boolean).join('\n').slice(0, 1000);
}

/** What goes with it, unseen: the game, and who to credit (the name they chose and, if they have one, their player). */
export const proposalContext = ({ name, jid = null, lang }) =>
  JSON.stringify({ juego: GAME_ID, propuesta: 1, autor: name, ...(jid ? { j: jid } : {}), idioma: lang }).slice(0, 500);

/** The name to offer: the registered player's, else the one this phone already knows; the player can change it. */
export function defaultName(storage = globalThis.localStorage) {
  return (leerYo(storage)?.n || nombreDelCelular('', storage) || '').slice(0, MAX.name);
}

/** Opens the form over the page. `T` are the game's texts (rules.js), `lang` the page's language. */
export async function openProposal({ T, lang, send = null, onSent = () => {} }) {
  if (document.querySelector('.labs-capa')) return;
  // The feedback form's module, loaded on the tap (as buzon.js does): its email field, its sender
  const { campoCorreo, textosCorreo, fijarFondo, enviarReporte } = await import('../../assets/js/buzon-form.js');
  send ||= enviarReporte;
  let layer = null;
  let release = () => {};
  const close = () => { layer.remove(); release(); };
  const field = (label, input) => el('label', { class: 'propose-field' }, el('span', { class: 'propose-label' }, label), input);
  const clue = el('textarea', { class: 'labs-texto', id: 'propose-clue', rows: '3', maxlength: String(MAX.clue), placeholder: T.proposeCluePh });
  const answer = el('input', { class: 'labs-nombre', id: 'propose-answer', maxlength: String(MAX.answer), autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', placeholder: T.proposeAnswerPh });
  const how = el('textarea', { class: 'labs-texto', id: 'propose-how', rows: '2', maxlength: String(MAX.how), placeholder: T.proposeHowPh });
  const name = el('input', { class: 'labs-nombre', id: 'propose-name', maxlength: String(MAX.name), autocomplete: 'given-name', value: defaultName() });
  const email = campoCorreo({}, 'propose-email');
  const err = el('div', { class: 'labs-error', role: 'alert' });
  const sendBtn = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-propose-send' }, T.proposeSend);
  const box = el('div', { class: 'panel stack comentario labs-caja', role: 'dialog', 'aria-modal': 'true', 'aria-label': T.proposeTitle },
    el('h2', { class: 'display display--sm' }, `✍️ ${T.proposeTitle}`),
    // The kind, already picked: the same chip as the feedback form's, pressed
    el('div', { class: 'buzon-tipos' }, el('span', { class: 'buzon-tipo propose-kind', 'aria-pressed': 'true', 'data-tipo': KIND }, T.proposeKind)),
    el('p', { class: 'muted', style: 'margin:0' }, T.proposeIntro),
    lang !== 'es' ? el('p', { class: 'notice notice--warn', style: 'margin:0' }, T.proposeInSpanish) : null,
    field(T.proposeClue, clue), field(T.proposeAnswer, answer), field(T.proposeHow, how), field(T.proposeName, name),
    // The email with its own label, so its note («never published») is not read as the name's
    field(textosCorreo(lang).correo, email.input), email.nota, err, sendBtn,
    el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: close }, T.proposeCancel));
  sendBtn.addEventListener('click', async () => {
    const c = clue.value.trim().replace(/\s+/g, ' ');
    const a = answer.value.trim().replace(/\s+/g, ' ');
    if (!c || !a) { err.textContent = T.proposeMissing; (c ? answer : clue).focus(); return; }
    const mail = email.valor();
    if (mail === null) { err.textContent = email.malo; email.input.focus(); return; }
    const n = name.value.trim().slice(0, MAX.name);
    sendBtn.disabled = true; sendBtn.textContent = T.proposeSending;
    const done = msg => box.replaceChildren(el('p', { class: 'labs-aviso', role: 'status', id: 'propose-done' }, msg),
      el('button', { type: 'button', class: 'btn btn--yellow', onClick: close }, T.proposeClose));
    try {
      await send({
        texto: proposalText({ clue: c, answer: a, how: how.value.trim().replace(/\s+/g, ' ') }), nombre: n, tipo: KIND,
        ...(mail ? { correo: mail } : {}), contexto: proposalContext({ name: n, jid: leerYo()?.jid || null, lang }),
        v: versionOf(releaseOf(document)) || 'dev',
      });
      onSent();
      done(T.proposeThanks);
    } catch (e) {
      if (e?.guardado) { onSent(); done(T.proposeSaved); return; }
      err.textContent = T.proposeError;
      sendBtn.disabled = false; sendBtn.textContent = T.proposeSend;
    }
  });
  layer = el('div', { class: 'labs-capa' }, box);
  layer.addEventListener('click', e => { if (e.target === layer) close(); });
  document.body.append(layer);
  release = fijarFondo();
  clue.focus();
}
