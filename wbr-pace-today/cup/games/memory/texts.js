/**
 * 👀 Memorice in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos`; `ui`, the keys its screen reads from T, all prefixed `mm`.
 * The name is Memorice everywhere (what this kind of game is called in Chile). Plural forms are
 * [none, one, many]. The lines come from the lab's game (labs/memory/rules.js).
 */
import { LIVES, LIFE_EVERY } from './engine.js';

const ES = {
  juego: {
    nombre: 'Memorice', habilidad: 'memoria',
    como: [
      'Mira los dibujos antes de que se tapen.',
      'Toca el que te piden: uno, los dos de un par o los tres de un trío, antes de que se acabe el tiempo.',
      `Cada ronda es más rápida. Tienes ${LIVES} vidas: un error o el tiempo acabado te quita una.`,
    ],
    puntaje: 'Cada ronda superada vale 1 punto.',
    puntajeFinal: 'En la final cuentan tus rondas tal cual, hasta un máximo de 100.',
    desempate: 'Si empatas, gana quien encontró más dibujos; si siguen empatados, comparten el lugar.',
  },
  ui: {
    mmLema: 'Mira, recuerda y encuentra.',
    mmRound: 'Ronda {n}',
    mmLook: '👀 ¡Mira bien!',
    mmSkip: '⏩ Tapar ya',
    mmHide: '🙈 Se tapan…',
    mmPairs: '✌️ ¡Ronda de pares!',
    mmAsk: ['¿Dónde está?', 'Encuentra los dos:', 'Encuentra los tres:'],
    mmTimeUp: '⏰ ¡Se acabó el tiempo!',
    mmWell: ['¡Bien!', '¡Excelente!', '¡Ojo de lince!', '¡Perfecto!'],
    mmMiss: '✖ No era ahí.',
    mmLifeBack: `❤️ ¡${LIFE_EVERY} seguidas! Recuperas una vida.`,
    mmLivesLeft: ['', '💔 Te queda 1 vida.', 'Te quedan {n} vidas.'],
    mmLives: 'Vidas: {n}',
    mmEmpty: 'vacía',
    mmCovered: 'tapada',
    mmPaused: 'En pausa',
    mmResume: 'Toca para seguir',
    mmOver: '¡Se acabó!',
    mmTrialDone: '¡Listo!',
    mmContinue: 'Continuar',
    mmVerdicts: ['Recién calentando la memoria 🧠', 'Ya le estás agarrando la mano', '¡Buena memoria! ✨', '¡Ojo de lince! 🐱', '¡Memoria de elefante! 🐘'],
    mmBdRounds: ['👀 Ninguna ronda superada.', '👀 1 ronda superada.', '👀 {n} rondas superadas.'],
    mmBdFound: ['', '🔎 1 dibujo encontrado.', '🔎 {n} dibujos encontrados.'],
  },
};

const EN = {
  juego: {
    nombre: 'Memorice', habilidad: 'memory',
    como: [
      'Look at the pictures before they get covered.',
      'Tap the one asked for: one, both of a pair or all three of a trio, before the time runs out.',
      `Every round is faster. You have ${LIVES} lives: a mistake or running out of time costs one.`,
    ],
    puntaje: 'Each round cleared is 1 point.',
    puntajeFinal: 'In the final your rounds count as they are, up to 100.',
    desempate: 'If you tie, whoever found more pictures wins; if still tied, you share the place.',
  },
  ui: {
    mmLema: 'Look, remember, find.',
    mmRound: 'Round {n}',
    mmLook: '👀 Look hard!',
    mmSkip: '⏩ Cover now',
    mmHide: '🙈 Covering…',
    mmPairs: '✌️ Pairs round!',
    mmAsk: ['Where is it?', 'Find both:', 'Find all three:'],
    mmTimeUp: '⏰ Time’s up!',
    mmWell: ['Nice!', 'Excellent!', 'Eagle eye!', 'Perfect!'],
    mmMiss: '✖ Not there.',
    mmLifeBack: `❤️ ${LIFE_EVERY} in a row! You get a life back.`,
    mmLivesLeft: ['', '💔 1 life left.', '{n} lives left.'],
    mmLives: 'Lives: {n}',
    mmEmpty: 'empty',
    mmCovered: 'covered',
    mmPaused: 'Paused',
    mmResume: 'Tap to continue',
    mmOver: 'Game over!',
    mmTrialDone: 'Done!',
    mmContinue: 'Continue',
    mmVerdicts: ['Just warming up 🧠', 'Getting the hang of it', 'Good memory! ✨', 'Eagle eye! 🦅', 'A memory like an elephant’s! 🐘'],
    mmBdRounds: ['👀 No rounds cleared.', '👀 1 round cleared.', '👀 {n} rounds cleared.'],
    mmBdFound: ['', '🔎 1 picture found.', '🔎 {n} pictures found.'],
  },
};

const PT = {
  juego: {
    nombre: 'Memorice', habilidad: 'memória',
    como: [
      'Olhe os desenhos antes que sejam cobertos.',
      'Toque no desenho pedido: um, os dois de um par ou os três de um trio, antes que o tempo acabe.',
      `Cada rodada é mais rápida. Você tem ${LIVES} vidas: um erro ou o tempo esgotado tira uma.`,
    ],
    puntaje: 'Cada rodada superada vale 1 ponto.',
    puntajeFinal: 'Na final suas rodadas contam como estão, até no máximo 100.',
    desempate: 'Se empatar, ganha quem encontrou mais desenhos; se continuarem empatados, dividem o lugar.',
  },
  ui: {
    mmLema: 'Olhe, lembre e encontre.',
    mmRound: 'Rodada {n}',
    mmLook: '👀 Olhe bem!',
    mmSkip: '⏩ Cobrir já',
    mmHide: '🙈 Cobrindo…',
    mmPairs: '✌️ Rodada de pares!',
    mmAsk: ['Onde está?', 'Encontre os dois:', 'Encontre os três:'],
    mmTimeUp: '⏰ Acabou o tempo!',
    mmWell: ['Boa!', 'Excelente!', 'Olho de lince!', 'Perfeito!'],
    mmMiss: '✖ Não era aí.',
    mmLifeBack: `❤️ ${LIFE_EVERY} seguidas! Você recupera uma vida.`,
    mmLivesLeft: ['', '💔 Resta 1 vida.', 'Restam {n} vidas.'],
    mmLives: 'Vidas: {n}',
    mmEmpty: 'vazia',
    mmCovered: 'coberta',
    mmPaused: 'Pausado',
    mmResume: 'Toque para continuar',
    mmOver: 'Acabou!',
    mmTrialDone: 'Pronto!',
    mmContinue: 'Continuar',
    mmVerdicts: ['Só esquentando a memória 🧠', 'Pegando o jeito', 'Boa memória! ✨', 'Olho de lince! 🐱', 'Memória de elefante! 🐘'],
    mmBdRounds: ['👀 Nenhuma rodada superada.', '👀 1 rodada superada.', '👀 {n} rodadas superadas.'],
    mmBdFound: ['', '🔎 1 desenho encontrado.', '🔎 {n} desenhos encontrados.'],
  },
};

export default { es: ES, en: EN, pt: PT };
