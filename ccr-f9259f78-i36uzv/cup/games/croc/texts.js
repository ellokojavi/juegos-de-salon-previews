/**
 * Croc! in La Copa: es, en, pt texts merged into cup/rules.js (C-3).
 */
const ES = {
  juego: {
    nombre: 'Croc!',
    habilidad: 'reflejos',
    como: [
      'Cruza hasta la laguna: desliza en cualquier dirección para saltar.',
      'Toca dos veces rápido para el Dash, que salta dos carriles; cada fruta o auto que pasas raspando te devuelve una carga.',
      'Tienes 3 vidas: un choque o caer al agua te quita una.',
    ],
    puntaje: '🛣️ +1 por carril, 🏁 +10 al llegar, 🍓 +1 por fruta y 💔 -1 por vida perdida.',
    desempate: 'Si empatan al llegar, gana el menor tiempo; si no, quien llegó más lejos.',
  },
  ui: {
    spLema: 'Cruza la autopista sin mirar atrás.',
    // The traffic lever (the lab's), its two positions: off is normal, on is heavy
    spModo: [{ titulo: 'Modo fácil', sub: '2–3 autos por carril · ritmo clásico' }, { titulo: '🔥 Modo difícil', sub: '3–4 autos por carril · más rápidos y pegados' }],
    spDist: 'Carril {row}/{total}',
    spDashReady: '⚡ DASH LISTO',
    spDashWait: '⚡ {s}s',
    spSector1: 'Avenida',
    spSector2: 'Costanera',
    spSector3: 'Autopista nocturna',
    spCloseCall: '¡CERCA!',
    spPaused: 'En pausa',
    spResume: 'Toca para seguir',
    spWin: '🏆 ¡Cruzaste la laguna!',
    spCrash: '💥 ¡Te pilló el tránsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Llegaste al carril {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta recogida.', '🍓 {n} frutas recogidas.'],
    spBdLives: '💔 -{n} por vidas perdidas.',
  },
};

const EN = {
  juego: {
    nombre: 'Croc!',
    habilidad: 'reflexes',
    como: [
      'Cross the highway to the pond: swipe in any direction to hop.',
      'Double-tap to Dash over two lanes; each fruit or car you barely miss gives a charge back.',
      'You have 3 lives: a crash or a fall into the water costs one.',
    ],
    puntaje: '🛣️ +1 per lane, 🏁 +10 at finish, 🍓 +1 per fruit, and 💔 -1 per life lost.',
    desempate: 'If tied at finish, faster time wins; otherwise furthest distance wins.',
  },
  ui: {
    spLema: 'Cross the highway with no turning back.',
    spModo: [{ titulo: 'Easy mode', sub: '2–3 cars per lane · standard speed' }, { titulo: '🔥 Hard mode', sub: '3–4 cars per lane · faster with tighter gaps' }],
    spDist: 'Lane {row}/{total}',
    spDashReady: '⚡ DASH READY',
    spDashWait: '⚡ {s}s',
    spSector1: 'Suburb Ave',
    spSector2: 'City Highway',
    spSector3: 'Night Expressway',
    spCloseCall: 'CLOSE CALL!',
    spPaused: 'Paused',
    spResume: 'Tap to continue',
    spWin: '🏆 You reached the pond!',
    spCrash: '💥 Flattened by traffic!',
    spContinue: 'Continue',
    spBdDist: '🐸 Reached lane {n} of {total}.',
    spBdBonus: ['', '🍓 1 fruit collected.', '🍓 {n} fruit collected.'],
    spBdLives: '💔 -{n} for lives lost.',
  },
};

const PT = {
  juego: {
    nombre: 'Croc!',
    habilidad: 'reflexos',
    como: [
      'Atravesse até a lagoa: deslize em qualquer direção para pular.',
      'Toque duas vezes rápido para o Dash, que pula duas faixas; cada fruta ou carro que você passa raspando devolve uma carga.',
      'Você tem 3 vidas: uma batida ou uma queda na água tira uma.',
    ],
    puntaje: '🛣️ +1 por faixa, 🏁 +10 ao chegar, 🍓 +1 por fruta e 💔 -1 por vida perdida.',
    desempate: 'Se empatarem ao chegar, vence o menor tempo; senão, quem foi mais longe.',
  },
  ui: {
    spLema: 'Atravesse a rodovia sem olhar para trás.',
    spModo: [{ titulo: 'Modo fácil', sub: '2–3 carros por faixa · ritmo clássico' }, { titulo: '🔥 Modo difícil', sub: '3–4 carros por faixa · mais rápidos e juntos' }],
    spDist: 'Faixa {row}/{total}',
    spDashReady: '⚡ DASH PRONTO',
    spDashWait: '⚡ {s}s',
    spSector1: 'Avenida',
    spSector2: 'Via Expressa',
    spSector3: 'Rodovia Noturna',
    spCloseCall: 'POR UM TRIZ!',
    spPaused: 'Pausado',
    spResume: 'Toque para continuar',
    spWin: '🏆 Chegou à lagoa!',
    spCrash: '💥 Pego pelo trânsito!',
    spContinue: 'Continuar',
    spBdDist: '🐸 Chegou à faixa {n} de {total}.',
    spBdBonus: ['', '🍓 1 fruta pega.', '🍓 {n} frutas pegas.'],
    spBdLives: '💔 -{n} por vidas perdidas.',
  },
};

export default { es: ES, en: EN, pt: PT };
