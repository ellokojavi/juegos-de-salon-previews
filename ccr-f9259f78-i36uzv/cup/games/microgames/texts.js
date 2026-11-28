/**
 * ⚡ ¡Al toque! in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos`; `ui`, the keys its screen (ui.js) reads from T, all prefixed `mg`.
 * The 29 microgames' own words stay in tr.js, keyed by the Spanish where stage.js uses them.
 * Plural forms are [none, one, many].
 */
const ES = {
  juego: {
    nombre: '¡Al toque!', habilidad: 'reflejos',
    como: [
      'Diez microjuegos seguidos, de 3 a 5 segundos cada uno: lee la orden y hazla al toque.',
      'Cada uno se juega de una de tres formas: toca, arrastra o desliza. Antes de cada uno ves cuál.',
      'Cada uno da de 0 a 3 estrellas, y cada tres juegos todo va un 10 % más rápido.',
    ],
    puntaje: 'Cada estrella vale 10 puntos por la velocidad del juego (×1,0 a ×1,3); dos juegos seguidos con ★★ o más suman 5 de racha.',
    puntajeFinal: 'En la final y en Uno al día cuenta tu corrida de 0 a 100: las estrellas por la velocidad, sin rachas.',
    desempate: 'Si empatas, gana quien terminó la corrida en menos tiempo.',
  },
  ui: {
    mgLema: 'Una orden y 3 segundos para cumplirla.',
    mgCredit: 'Inspirado en {juego}, de Nintendo.',
    mgWiki: 'https://es.wikipedia.org/wiki/WarioWare',
    mgKinds: { toca: 'la respuesta, en el momento justo o muchas veces seguidas.', arrastra: 'algo con el dedo hasta su lugar, o de lado a lado.', desliza: 'el dedo por la pantalla: corta, recorre o frota.' },
    mgOver: '¡Corrida terminada!',
    mgTrialDone: '¡Listo!',
    mgContinue: 'Continuar',
    mgVerdicts: ['¡Otra!', '¡Bien!', '¡Al toque!'],
    mgPoints: ['puntos', 'punto', 'puntos'],
    mgBdStars: ['⭐ Ninguna estrella.', '⭐ 1 estrella × 10 puntos.', '⭐ {n} estrellas × 10 puntos.'],
    mgBdSpeed: '⚡ Bono de velocidad: +{n}.',
    mgBdStreaks: ['', '🔥 1 racha: +{p}.', '🔥 {n} rachas: +{p}.'],
    mgBdCut: '⏸ Jugaste {n} de {m}: los que faltaron cuentan 0.',
  },
};

const EN = {
  juego: {
    nombre: 'In a Flash!', habilidad: 'reflexes',
    como: [
      'Ten microgames in a row, 3 to 5 seconds each: read the order and do it in a flash.',
      'Each is played one of three ways: tap, drag or swipe. Before each one you see which.',
      'Each gives 0 to 3 stars, and every three games everything gets 10 % faster.',
    ],
    puntaje: 'Each star is worth 10 points times the game\'s speed (×1.0 to ×1.3); two games in a row with ★★ or more add a 5-point streak.',
    puntajeFinal: 'In the final and in One a Day your run counts from 0 to 100: the stars times the speed, without streaks.',
    desempate: 'If you tie, whoever finished the run in less time wins.',
  },
  ui: {
    mgLema: 'One order and 3 seconds to do it.',
    mgCredit: 'Inspired by {juego}, by Nintendo.',
    mgWiki: 'https://en.wikipedia.org/wiki/WarioWare',
    mgKinds: { toca: 'the answer, at the right moment or many times in a row.', arrastra: 'something with your finger to its place, or side to side.', desliza: 'your finger across the screen: cut, trace or rub.' },
    mgOver: 'Run over!',
    mgTrialDone: 'Done!',
    mgContinue: 'Continue',
    mgVerdicts: ['Again!', 'Nice!', 'In a flash!'],
    mgPoints: ['points', 'point', 'points'],
    mgBdStars: ['⭐ No stars.', '⭐ 1 star × 10 points.', '⭐ {n} stars × 10 points.'],
    mgBdSpeed: '⚡ Speed bonus: +{n}.',
    mgBdStreaks: ['', '🔥 1 streak: +{p}.', '🔥 {n} streaks: +{p}.'],
    mgBdCut: '⏸ You played {n} of {m}: the missing ones count 0.',
  },
};

const PT = {
  juego: {
    nombre: 'Na Hora!', habilidad: 'reflexos',
    como: [
      'Dez microjogos seguidos, de 3 a 5 segundos cada um: leia a ordem e faça na hora.',
      'Cada um se joga de uma de três formas: toque, arraste ou deslize. Antes de cada um você vê qual.',
      'Cada um dá de 0 a 3 estrelas, e a cada três jogos tudo fica 10 % mais rápido.',
    ],
    puntaje: 'Cada estrela vale 10 pontos vezes a velocidade do jogo (×1,0 a ×1,3); dois jogos seguidos com ★★ ou mais somam 5 de sequência.',
    puntajeFinal: 'Na final e no Um por dia sua corrida conta de 0 a 100: as estrelas pela velocidade, sem sequências.',
    desempate: 'Se empatar, ganha quem terminou a corrida em menos tempo.',
  },
  ui: {
    mgLema: 'Uma ordem e 3 segundos para cumprir.',
    mgCredit: 'Inspirado em {juego}, da Nintendo.',
    mgWiki: 'https://pt.wikipedia.org/wiki/WarioWare',
    mgKinds: { toca: 'a resposta, no momento certo ou muitas vezes seguidas.', arrastra: 'algo com o dedo até o lugar, ou de um lado para o outro.', desliza: 'o dedo pela tela: corte, percorra ou esfregue.' },
    mgOver: 'Corrida terminada!',
    mgTrialDone: 'Pronto!',
    mgContinue: 'Continuar',
    mgVerdicts: ['De novo!', 'Boa!', 'Na hora!'],
    mgPoints: ['pontos', 'ponto', 'pontos'],
    mgBdStars: ['⭐ Nenhuma estrela.', '⭐ 1 estrela × 10 pontos.', '⭐ {n} estrelas × 10 pontos.'],
    mgBdSpeed: '⚡ Bônus de velocidade: +{n}.',
    mgBdStreaks: ['', '🔥 1 sequência: +{p}.', '🔥 {n} sequências: +{p}.'],
    mgBdCut: '⏸ Você jogou {n} de {m}: os que faltaram contam 0.',
  },
};

export default { es: ES, en: EN, pt: PT };
