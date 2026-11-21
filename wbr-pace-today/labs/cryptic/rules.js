/**
 * Cryptic: the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys (C-3);
 * the clues are in clues.js, the rules in engine.js. See docs/games/cryptic.md.
 */

export const GAME_ID = 'cryptic';
/** The language of the clues: Spanish only for now (clues.js). */
export const CLUE_LANG = 'es';
export const KIND_KEYS = ['anagram', 'reversal', 'hidden', 'charade', 'container', 'deletion', 'homophone', 'definitions', 'selector', 'substitution'];

const ES = {
  ui: {
    docTitle: 'Críptico 🗝️ · Juegos de Salón', gameChip: '🗝️ Críptico', menu: '‹ Laboratorio',
    title: 'Críptico', lead: 'Pistas directas, indirectas y con truco para encontrar una palabra.',
    howTitle: '🗝️ Cómo se juega',
    modeToday: 'Jugar las pistas de hoy', modeTodayHint: 'N.º {n}: tres pistas nuevas cada día', modeTodayDone: 'Hoy sumaste {score} de 100. Vuelve mañana por más.', modeTodayAgain: 'Ver tus pistas de hoy',
    modePractice: 'Practicar con otras pistas',
    clueNumber: 'Críptico n.º {n}', practiceLabel: 'Pista de práctica', inSpanish: '⚠️ Las pistas están en español',
    placeholder: 'Escribe la respuesta', check: 'Comprobar',
    wrong: '❌ «{g}» no es. Prueba otra.', lengthWrong: 'La respuesta tiene {n} letras y escribiste {m}.',
    hintBtn: '💡 Ayuda: −{cost} puntos', hintKind: '🧩 Juego de palabras: {kind}.', hintDef: '🖍️ La definición está subrayada.', hintFirst: '🔤 Empieza con {letter}.',
    giveUp: 'Me rindo', giveUpSure: 'Sí, mostrar la respuesta',
    solvedTitle: '¡Resuelta!', gaveUpTitle: 'La respuesta era {a}',
    tries: '{n} intentos', triesOne: '1 intento', streakMany: '🔥 Racha de {n} días', streakOne: '🔥 Racha de 1 día',
    howSolved: '🧩 Cómo se arma', nextClue: 'Las próximas pistas salen a medianoche.',
    practiceAgain: 'Otra pista de práctica', practiceNote: 'Pista de práctica: no cuenta para la racha.',
    resumeTitle: '⏯ Tienes pistas a medias', resume: 'Continuar', delete: 'Borrar',
    shareRotulo: '📤 Compartir', shareContext: 'N.º {n}',
    // «Propón tu críptico» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ ¿Se te ocurre uno?', proposeBtn: 'Propón tu críptico', proposeTitle: 'Propón tu críptico', proposeKind: '🗝️ Críptico',
    proposeIntro: 'Si nos gusta, lo publicamos con tu nombre. El día que salga, todos juegan tu pista menos tú, y tu racha sigue.',
    proposeInSpanish: 'Por ahora las pistas son en español: escribe la tuya en español.',
    proposeClue: 'La pista', proposeCluePh: 'Ej.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'La respuesta', proposeAnswerPh: 'Ej.: JAMÓN',
    proposeHow: 'Cómo se llega a la respuesta (opcional)', proposeHowPh: 'Ej.: las letras de MONJA, revueltas, forman JAMÓN',
    proposeName: 'Tu nombre, como saldrá en la pista', proposeSend: 'Enviar mi críptico', proposeSending: 'Enviando…',
    proposeMissing: 'Escribe la pista y su respuesta.', proposeCancel: 'Cancelar', proposeClose: 'Cerrar',
    proposeThanks: '¡Gracias! Lo vamos a revisar. Si sale publicado, verás tu nombre en la pista.',
    proposeSaved: 'Quedó guardado en tu celular y se envía apenas haya conexión.', proposeError: 'No se pudo enviar. Prueba de nuevo.',
    credit: 'Críptico de {n}', yourDayLine: '🗝️ Hoy salió tu críptico: lo juegan todos menos tú, y te tocó otra pista.',
    // The day's three clues and their score (the owner, 2026-11-20)
    hintsNone: 'Ya usaste tus 3 ayudas de hoy.', stepHints: 'Valía {worth}: usaste {h} ayudas de {cost} puntos.', stepHintsOne: 'Valía {worth}: usaste 1 ayuda de {cost} puntos.', stepZero: 'Rendirse vale 0 puntos.', hintsLeft: 'Te quedan {n} de 3 ayudas para hoy.', hintsLeftOne: 'Te queda 1 de 3 ayudas para hoy.', levelE: '🟢 Fácil', levelM: '🟡 Media', levelH: '🔴 Difícil', stepLabel: '{level} · pista {i} de 3 · vale {p} puntos', practiceWorth: '{level} · vale {p} puntos', stepSolved: '¡Resuelta! +{p} puntos', stepNext: 'Siguiente: {level}', stepEnd: 'Ver tu puntaje', points: '{p} puntos', scoreTitle: '{score} de 100', practicePoints: 'Sumaste {p} de {worth} puntos.',
  },
  kinds: {
    anagram: 'anagrama (las letras de una palabra, en otro orden)', reversal: 'al revés (una palabra leída hacia atrás)',
    hidden: 'escondida (la respuesta va dentro de otras palabras)', charade: 'suma (palabras pegadas una tras otra)',
    container: 'dentro de otra (una palabra metida en otra)', deletion: 'le falta una letra (una palabra sin un pedazo)',
    homophone: 'suena igual (dos palabras que se oyen parecido)', definitions: 'dos definiciones (la palabra tiene dos significados)',
    selector: 'iniciales (las primeras letras de varias palabras)',
    substitution: 'cambia una letra (una palabra con una letra en lugar de otra)',
  },
  como: [
    '🎯 Adivina la palabra: una parte de la pista la define y el resto la arma con un juego de palabras.',
    '🟢🟡🔴 Cada día hay tres pistas: fácil, media y difícil. Valen 20, 30 y 50 puntos.',
    '💡 Tienes 3 ayudas para el día y cuestan más en las difíciles. Rendirse vale 0.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Cryptic 🗝️ · Parlor Games', gameChip: '🗝️ Cryptic', menu: '‹ Lab',
    title: 'Cryptic', lead: 'Direct, indirect and tricky clues to find a word.',
    howTitle: '🗝️ How to play',
    modeToday: 'Play today\'s clues', modeTodayHint: 'No. {n}: three new clues every day', modeTodayDone: 'Today you scored {score} out of 100. Come back tomorrow for more.', modeTodayAgain: 'See today\'s clues',
    modePractice: 'Practice with other clues',
    clueNumber: 'Cryptic No. {n}', practiceLabel: 'Practice clue', inSpanish: '⚠️ The clues are in Spanish',
    placeholder: 'Type the answer', check: 'Check',
    wrong: '❌ "{g}" is not it. Try another.', lengthWrong: 'The answer has {n} letters and you typed {m}.',
    hintBtn: '💡 Hint: −{cost} points', hintKind: '🧩 Wordplay: {kind}.', hintDef: '🖍️ The definition is underlined.', hintFirst: '🔤 It starts with {letter}.',
    giveUp: 'I give up', giveUpSure: 'Yes, show the answer',
    solvedTitle: 'Solved!', gaveUpTitle: 'The answer was {a}',
    tries: '{n} tries', triesOne: '1 try', streakMany: '🔥 {n}-day streak', streakOne: '🔥 1-day streak',
    howSolved: '🧩 How it works', nextClue: 'The next clues come out at midnight.',
    practiceAgain: 'Another practice clue', practiceNote: 'Practice clue: it does not count for your streak.',
    resumeTitle: '⏯ You have clues in progress', resume: 'Continue', delete: 'Delete',
    shareRotulo: '📤 Share', shareContext: 'No. {n}',
    // «Propose your cryptic» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ Got one of your own?', proposeBtn: 'Propose your clue', proposeTitle: 'Propose your clue', proposeKind: '🗝️ Cryptic',
    proposeIntro: 'If we like it, we publish it with your name. On its day everyone plays your clue but you, and your streak goes on.',
    proposeInSpanish: 'For now the clues are in Spanish: write yours in Spanish.',
    proposeClue: 'The clue', proposeCluePh: 'E.g.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'The answer', proposeAnswerPh: 'E.g.: JAMÓN',
    proposeHow: 'How to get to the answer (optional)', proposeHowPh: 'E.g.: the letters of MONJA, mixed up, make JAMÓN',
    proposeName: 'Your name, as it will show on the clue', proposeSend: 'Send my clue', proposeSending: 'Sending…',
    proposeMissing: 'Write the clue and its answer.', proposeCancel: 'Cancel', proposeClose: 'Close',
    proposeThanks: 'Thanks! We will look at it. If it is published, you will see your name on the clue.',
    proposeSaved: 'It is saved on your phone and goes out as soon as there is a connection.', proposeError: 'It could not be sent. Try again.',
    credit: 'Clue by {n}', yourDayLine: '🗝️ Your clue came out today: everyone plays it but you, so you got another one.',
    // The day's three clues and their score (the owner, 2026-11-20)
    hintsNone: 'You have used your 3 hints for today.', stepHints: 'It was worth {worth}: you used {h} hints of {cost} points.', stepHintsOne: 'It was worth {worth}: you used 1 hint of {cost} points.', stepZero: 'Giving up scores 0 points.', hintsLeft: 'You have {n} of 3 hints left for today.', hintsLeftOne: 'You have 1 of 3 hints left for today.', levelE: '🟢 Easy', levelM: '🟡 Medium', levelH: '🔴 Hard', stepLabel: '{level} · clue {i} of 3 · worth {p} points', practiceWorth: '{level} · worth {p} points', stepSolved: 'Solved! +{p} points', stepNext: 'Next: {level}', stepEnd: 'See your score', points: '{p} points', scoreTitle: '{score} out of 100', practicePoints: 'You scored {p} of {worth} points.',
  },
  kinds: {
    anagram: 'anagram (the letters of a word, in another order)', reversal: 'reversal (a word read backwards)',
    hidden: 'hidden (the answer sits inside other words)', charade: 'charade (words joined one after another)',
    container: 'container (one word put inside another)', deletion: 'deletion (a word missing a piece)',
    homophone: 'sounds like (two words that sound alike)', definitions: 'double definition (the word has two meanings)',
    selector: 'initials (the first letters of several words)',
    substitution: 'a letter changed (a word with one letter in place of another)',
  },
  como: [
    '🎯 Guess the word: one part of the clue defines it and the rest builds it with wordplay.',
    '🟢🟡🔴 Every day there are three clues: easy, medium and hard. They are worth 20, 30 and 50 points.',
    '💡 You get 3 hints for the day, and they cost more on the hard ones. Giving up scores 0.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Críptico 🗝️ · Jogos de Salão', gameChip: '🗝️ Críptico', menu: '‹ Laboratório',
    title: 'Críptico', lead: 'Pistas diretas, indiretas e com truque para encontrar uma palavra.',
    howTitle: '🗝️ Como se joga',
    modeToday: 'Jogar as pistas de hoje', modeTodayHint: 'N.º {n}: três pistas novas a cada dia', modeTodayDone: 'Hoje você fez {score} de 100. Volte amanhã para mais.', modeTodayAgain: 'Ver suas pistas de hoje',
    modePractice: 'Praticar com outras pistas',
    clueNumber: 'Críptico n.º {n}', practiceLabel: 'Pista de prática', inSpanish: '⚠️ As pistas estão em espanhol',
    placeholder: 'Escreva a resposta', check: 'Conferir',
    wrong: '❌ «{g}» não é. Tente outra.', lengthWrong: 'A resposta tem {n} letras e você escreveu {m}.',
    hintBtn: '💡 Ajuda: −{cost} pontos', hintKind: '🧩 Jogo de palavras: {kind}.', hintDef: '🖍️ A definição está sublinhada.', hintFirst: '🔤 Começa com {letter}.',
    giveUp: 'Desisto', giveUpSure: 'Sim, mostrar a resposta',
    solvedTitle: 'Resolvida!', gaveUpTitle: 'A resposta era {a}',
    tries: '{n} tentativas', triesOne: '1 tentativa', streakMany: '🔥 Sequência de {n} dias', streakOne: '🔥 Sequência de 1 dia',
    howSolved: '🧩 Como se monta', nextClue: 'As próximas pistas saem à meia-noite.',
    practiceAgain: 'Outra pista de prática', practiceNote: 'Pista de prática: não conta para a sequência.',
    resumeTitle: '⏯ Você tem pistas pela metade', resume: 'Continuar', delete: 'Apagar',
    shareRotulo: '📤 Compartilhar', shareContext: 'N.º {n}',
    // «Proponha seu críptico» (propose.js) and the day a player's own clue comes up (the owner, 2026-11-19)
    proposeAsk: '✍️ Quer criar um?', proposeBtn: 'Proponha seu críptico', proposeTitle: 'Proponha seu críptico', proposeKind: '🗝️ Críptico',
    proposeIntro: 'Se gostarmos, publicamos com seu nome. No dia dele, todos jogam sua pista menos você, e sua sequência continua.',
    proposeInSpanish: 'Por enquanto as pistas são em espanhol: escreva a sua em espanhol.',
    proposeClue: 'A pista', proposeCluePh: 'Ex.: Una monja alborotada termina en el sándwich',
    proposeAnswer: 'A resposta', proposeAnswerPh: 'Ex.: JAMÓN',
    proposeHow: 'Como se chega à resposta (opcional)', proposeHowPh: 'Ex.: as letras de MONJA, embaralhadas, formam JAMÓN',
    proposeName: 'Seu nome, como vai aparecer na pista', proposeSend: 'Enviar meu críptico', proposeSending: 'Enviando…',
    proposeMissing: 'Escreva a pista e a resposta.', proposeCancel: 'Cancelar', proposeClose: 'Fechar',
    proposeThanks: 'Obrigado! Vamos revisar. Se for publicado, você verá seu nome na pista.',
    proposeSaved: 'Ficou salvo no seu celular e é enviado assim que houver conexão.', proposeError: 'Não deu para enviar. Tente de novo.',
    credit: 'Críptico de {n}', yourDayLine: '🗝️ Hoje saiu o seu críptico: todos jogam menos você, e você ganhou outra pista.',
    // The day's three clues and their score (the owner, 2026-11-20)
    hintsNone: 'Você já usou suas 3 ajudas de hoje.', stepHints: 'Valia {worth}: você usou {h} ajudas de {cost} pontos.', stepHintsOne: 'Valia {worth}: você usou 1 ajuda de {cost} pontos.', stepZero: 'Desistir vale 0 pontos.', hintsLeft: 'Restam {n} de 3 ajudas para hoje.', hintsLeftOne: 'Resta 1 de 3 ajudas para hoje.', levelE: '🟢 Fácil', levelM: '🟡 Média', levelH: '🔴 Difícil', stepLabel: '{level} · pista {i} de 3 · vale {p} pontos', practiceWorth: '{level} · vale {p} pontos', stepSolved: 'Resolvida! +{p} pontos', stepNext: 'Próxima: {level}', stepEnd: 'Ver sua pontuação', points: '{p} pontos', scoreTitle: '{score} de 100', practicePoints: 'Você fez {p} de {worth} pontos.',
  },
  kinds: {
    anagram: 'anagrama (as letras de uma palavra, em outra ordem)', reversal: 'ao contrário (uma palavra lida de trás para frente)',
    hidden: 'escondida (a resposta está dentro de outras palavras)', charade: 'soma (palavras coladas uma após a outra)',
    container: 'dentro de outra (uma palavra posta dentro de outra)', deletion: 'falta uma letra (uma palavra sem um pedaço)',
    homophone: 'soa igual (duas palavras que soam parecido)', definitions: 'duas definições (a palavra tem dois sentidos)',
    selector: 'iniciais (as primeiras letras de várias palavras)',
    substitution: 'troca uma letra (uma palavra com uma letra no lugar de outra)',
  },
  como: [
    '🎯 Adivinhe a palavra: uma parte da pista a define e o resto a monta com um jogo de palavras.',
    '🟢🟡🔴 Todo dia há três pistas: fácil, média e difícil. Valem 20, 30 e 50 pontos.',
    '💡 Você tem 3 ajudas para o dia e elas custam mais nas difíceis. Desistir vale 0.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
