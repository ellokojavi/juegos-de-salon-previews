/**
 * 🎲 Dominorama in La Copa: its texts in the three languages (C-3), merged into rules.js (D-331).
 * `juego` is its entry in `juegos`; `ui`, the keys its screen reads from T, all prefixed `dm`. The lines come
 * from the lab's game (labs/dominorama/game.js, Spanish only); `dmCredit` credits NYT's Pips, its inspiration
 * ({juego} is the link). Templates: {n} a count, {total} the boards, {nivel} the level, {pts} points, {x} {y} pips.
 * Plural forms are [none, one, many] or [one, many] as named.
 */
const ES = {
  juego: {
    nombre: 'Dominorama', habilidad: 'deducir',
    como: [
      'Pon todas las fichas: cada una cubre dos casillas.',
      'Cada zona de color cumple su regla: un número es lo que suman sus puntos; = todos iguales; ≠ todos distintos; < y >, menos o más.',
      'Mantén y arrastra cada ficha a su casilla; un toque la gira. Toca un rombo: se ilumina su zona.',
    ],
    puntaje: 'Cada tablero resuelto vale 20 puntos y, con los tres, la rapidez suma hasta 40; cada ayuda resta 10.',
    desempate: 'Si empatas, gana quien tardó menos.',
  },
  ui: {
    dmLema: 'Pon todas las fichas de dominó para que cada zona cumpla su regla.',
    dmCredit: 'Inspirado en {juego}, de The New York Times Games.',
    dmTablero: 'Tablero {n} de {total} · {nivel}',
    dmNivel: { facil: 'fácil', medio: 'medio', dificil: 'difícil' },
    dmElegir: 'Arrastra una ficha al tablero; un toque la gira.',
    dmElegida: 'Tócala para girarla otra vez, o toca la casilla donde va.',
    dmNo: { fuera: 'Así no cabe: gírala o prueba otra casilla.', ocupada: 'Ahí ya hay una ficha: sácala primero.' },
    dmRota: '❌ Una zona no cumple su regla: mueve alguna ficha.',
    dmListo: '✅ ¡Listo!',
    dmAyuda: '💡 Ayuda (−{pts})', dmAyudaSeguro: 'Toca de nuevo (−{pts})', dmAyudaDice: '💡 Esa ficha va ahí.',
    dmRendirse: '🏳️ Rendirse', dmRendirseSeguro: '🏳️ ¿Seguro?',
    dmDeshacer: '↩️ Deshacer', dmLimpiar: '🧹 Limpiar', dmLimpiarSeguro: '🧹 ¿Sacar todas?',
    dmFin: { todos: '¡Los tres!', rendido: 'Te rendiste' },
    dmFicha: 'Ficha {x} y {y}', dmFichaPuesta: 'Ficha {x} y {y}, puesta: tócala para sacarla',
    dmFichaBandeja: 'Ficha {x} y {y}: tócala para girarla, mantén para arrastrarla',
    dmCasilla: 'Casilla {r}, {c}', dmFichas: 'Fichas',
    dmBdTableros: ['🎲 Ningún tablero.', '🎲 1 tablero: {pts}.', '🎲 {n} tableros: {pts}.'],
    dmBdRapidez: '⏱️ Rapidez: {pts} de 40.',
    dmBdAyudas: ['💡 1 ayuda: −{pts}.', '💡 {n} ayudas: −{pts}.'],
    dmBdPiso: 'El puntaje no baja de 0.',
  },
};

const EN = {
  juego: {
    nombre: 'Dominorama', habilidad: 'deduction',
    como: [
      'Place every domino: each one covers two cells.',
      'Each colored zone keeps its rule: a number is what its pips add up to; = all equal; ≠ all different; < and >, less or more.',
      'Hold and drag each domino to its cell; a tap turns it. Tap a diamond to light up its zone.',
    ],
    puntaje: 'Each board solved is worth 20 points and, with all three, speed adds up to 40; each hint takes off 10.',
    desempate: 'On a tie, the faster player wins.',
  },
  ui: {
    dmLema: 'Place every domino so each zone keeps its rule.',
    dmCredit: 'Inspired by {juego}, by The New York Times Games.',
    dmTablero: 'Board {n} of {total} · {nivel}',
    dmNivel: { facil: 'easy', medio: 'medium', dificil: 'hard' },
    dmElegir: 'Drag a domino onto the board; a tap turns it.',
    dmElegida: 'Tap it to turn it again, or tap the cell where it goes.',
    dmNo: { fuera: 'It does not fit like that: turn it or try another cell.', ocupada: 'There is a domino there already: take it off first.' },
    dmRota: '❌ A zone breaks its rule: move a domino.',
    dmListo: '✅ Done!',
    dmAyuda: '💡 Hint (−{pts})', dmAyudaSeguro: 'Tap again (−{pts})', dmAyudaDice: '💡 That domino goes there.',
    dmRendirse: '🏳️ Give up', dmRendirseSeguro: '🏳️ Sure?',
    dmDeshacer: '↩️ Undo', dmLimpiar: '🧹 Clear', dmLimpiarSeguro: '🧹 Take all off?',
    dmFin: { todos: 'All three!', rendido: 'You gave up' },
    dmFicha: 'Domino {x} and {y}', dmFichaPuesta: 'Domino {x} and {y}, placed: tap it to take it off',
    dmFichaBandeja: 'Domino {x} and {y}: tap it to turn it, hold it to drag it',
    dmCasilla: 'Cell {r}, {c}', dmFichas: 'Dominoes',
    dmBdTableros: ['🎲 No board.', '🎲 1 board: {pts}.', '🎲 {n} boards: {pts}.'],
    dmBdRapidez: '⏱️ Speed: {pts} of 40.',
    dmBdAyudas: ['💡 1 hint: −{pts}.', '💡 {n} hints: −{pts}.'],
    dmBdPiso: 'The score does not go below 0.',
  },
};

const PT = {
  juego: {
    nombre: 'Dominorama', habilidad: 'deduzir',
    como: [
      'Coloque todas as peças: cada uma cobre duas casas.',
      'Cada zona colorida cumpre sua regra: um número é a soma dos pontos; = todos iguais; ≠ todos diferentes; < e >, menos ou mais.',
      'Segure e arraste cada peça até sua casa; um toque a gira. Toque num losango para iluminar sua zona.',
    ],
    puntaje: 'Cada tabuleiro resolvido vale 20 pontos e, com os três, a rapidez soma até 40; cada ajuda tira 10.',
    desempate: 'Se empatar, ganha quem levou menos tempo.',
  },
  ui: {
    dmLema: 'Coloque todas as peças de dominó para que cada zona cumpra sua regra.',
    dmCredit: 'Inspirado em {juego}, do The New York Times Games.',
    dmTablero: 'Tabuleiro {n} de {total} · {nivel}',
    dmNivel: { facil: 'fácil', medio: 'médio', dificil: 'difícil' },
    dmElegir: 'Arraste uma peça até o tabuleiro; um toque a gira.',
    dmElegida: 'Toque nela para girar de novo, ou toque na casa onde ela vai.',
    dmNo: { fuera: 'Assim não cabe: gire a peça ou tente outra casa.', ocupada: 'Já tem uma peça ali: tire-a primeiro.' },
    dmRota: '❌ Uma zona não cumpre sua regra: mude alguma peça.',
    dmListo: '✅ Pronto!',
    dmAyuda: '💡 Ajuda (−{pts})', dmAyudaSeguro: 'Toque de novo (−{pts})', dmAyudaDice: '💡 Essa peça vai ali.',
    dmRendirse: '🏳️ Desistir', dmRendirseSeguro: '🏳️ Certeza?',
    dmDeshacer: '↩️ Desfazer', dmLimpiar: '🧹 Limpar', dmLimpiarSeguro: '🧹 Tirar todas?',
    dmFin: { todos: 'Os três!', rendido: 'Você desistiu' },
    dmFicha: 'Peça {x} e {y}', dmFichaPuesta: 'Peça {x} e {y}, colocada: toque nela para tirá-la',
    dmFichaBandeja: 'Peça {x} e {y}: toque para girá-la, segure para arrastá-la',
    dmCasilla: 'Casa {r}, {c}', dmFichas: 'Peças',
    dmBdTableros: ['🎲 Nenhum tabuleiro.', '🎲 1 tabuleiro: {pts}.', '🎲 {n} tabuleiros: {pts}.'],
    dmBdRapidez: '⏱️ Rapidez: {pts} de 40.',
    dmBdAyudas: ['💡 1 ajuda: −{pts}.', '💡 {n} ajudas: −{pts}.'],
    dmBdPiso: 'A pontuação não fica abaixo de 0.',
  },
};

export default { es: ES, en: EN, pt: PT };
