/**
 * Blackjack: pure Vegas-style state machine (C-2). No DOM, no globals, testable in node.
 * Supports 1–6 players against the house (croupier), multi-deck shoe with red cut card,
 * simulated coins/betting, Hit / Stand / Double Down / Split / Surrender (50%), 3:2 natural Blackjack,
 * S17 dealer AI, and multiple end conditions (red card, max rounds, broke, everyone left).
 */

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const DEFAULT_CONFIG = { decks: 2, maxRounds: 3, startingCoins: 250, minBet: 10 };

/** Deterministic PRNG (mulberry32) so all phones in an online room deal the same shoe. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cardPoints(rank) {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

export function isRedSuit(suit) {
  return suit === '♥' || suit === '♦';
}

/** Build and Fisher-Yates shuffle a multi-deck shoe with a red cut card at ~75% penetration. */
export function buildShoe(decks = 2, rng = Math.random) {
  const cards = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Evaluate a hand's point total, softness, natural blackjack (unless split), and bust status. */
export function handValue(cards, { isSplit = false } = {}) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardPoints(c.rank);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return {
    total,
    soft: aces > 0,
    isBlackjack: !isSplit && cards.length === 2 && total === 21,
    isBust: total > 21,
  };
}

function makeHand(bet = 0, cards = [], split = false) {
  return { cards, bet, doubled: false, split, stood: false, surrendered: false, outcome: null, payout: 0 };
}

function drawFromShoe(state, extraCards = []) {
  let { shoe, shoePos, redCardOut, reshuffles = 0 } = state;
  if (shoePos >= shoe.length) {
    // Reshuffle remaining discards deterministically if a shoe ever runs dry mid-hand
    const inPlayCounts = new Map();
    const countCard = c => {
      const k = `${c.rank}${c.suit}`;
      inPlayCounts.set(k, (inPlayCounts.get(k) || 0) + 1);
    };
    for (const p of state.players) {
      for (const h of p.hands) {
        for (const c of h.cards) countCard(c);
      }
    }
    for (const c of state.dealer.cards) countCard(c);
    for (const c of extraCards) countCard(c);

    const freshSeed = ((state.seed || 1) + ((reshuffles + 1) * 0x9E3779B9)) >>> 0;
    const fresh = buildShoe(state.decks || DEFAULT_CONFIG.decks, mulberry32(freshSeed));
    const filtered = [];
    for (const c of fresh) {
      const k = `${c.rank}${c.suit}`;
      const n = inPlayCounts.get(k) || 0;
      if (n > 0) inPlayCounts.set(k, n - 1);
      else filtered.push(c);
    }
    shoe = [...shoe, ...(filtered.length > 0 ? filtered : fresh)];
    reshuffles += 1;
    redCardOut = true;
  }
  const card = shoe[shoePos];
  const nextPos = shoePos + 1;
  return {
    card,
    shoe,
    shoePos: nextPos,
    redCardOut: redCardOut || nextPos >= state.cutIndex,
    reshuffles,
  };
}

function isActivePlayer(p) {
  return !p.left && !p.bustedOut && p.coins > 0;
}

function findNextBettingIndex(players, fromIndex) {
  for (let i = fromIndex; i < players.length; i++) {
    if (isActivePlayer(players[i]) && players[i].hands.length === 0) return i;
  }
  return -1;
}

function computeWinner(players) {
  if (players.length === 1) {
    const p = players[0];
    return { type: 'solo', winners: p.coins > 0 ? [0] : [], topCoins: p.coins };
  }
  const rankDiff = (a, b) => (a.coins - b.coins) || ((a.handsWon || 0) - (b.handsWon || 0)) || ((a.blackjacks || 0) - (b.blackjacks || 0));
  let best = players[0];
  for (const p of players) if (rankDiff(p, best) > 0) best = p;
  const winners = [];
  players.forEach((p, i) => { if (rankDiff(p, best) === 0) winners.push(i); });
  return {
    type: winners.length > 1 ? 'tie' : 'multi',
    winners,
    topCoins: best.coins,
  };
}

function finishGame(state, endReason) {
  return {
    ...state,
    phase: 'over',
    endReason,
    winner: computeWinner(state.players),
  };
}

/** Create a new Blackjack table session. */
export function newGame(names, opts = {}) {
  if (!Array.isArray(names) || names.length < 1 || names.length > 6) {
    throw new Error('newGame: 1 to 6 players required');
  }
  const decks = opts.decks ?? DEFAULT_CONFIG.decks;
  const maxRounds = opts.maxRounds ?? DEFAULT_CONFIG.maxRounds;
  const startingCoins = opts.startingCoins ?? DEFAULT_CONFIG.startingCoins;
  const minBet = Math.min(opts.minBet ?? DEFAULT_CONFIG.minBet, startingCoins);
  const rng = opts.rng ?? Math.random;
  const shoe = opts.shoe ? opts.shoe.map(c => ({ ...c })) : buildShoe(decks, rng);
  const cutIndex = opts.cutIndex ?? Math.floor(shoe.length * 0.75);

  const players = names.map(name => ({
    name,
    coins: startingCoins,
    lastBet: minBet,
    handsWon: 0,
    blackjacks: 0,
    left: false,
    bustedOut: false,
    hands: [],
  }));

  return {
    decks,
    maxRounds,
    startingCoins,
    minBet,
    seed: (opts.seed >>> 0) || 1,
    shoe,
    shoePos: 0,
    cutIndex,
    redCardOut: false,
    reshuffles: 0,
    round: 1,
    phase: 'betting',
    bettingIndex: 0,
    turnPlayer: 0,
    turnHand: 0,
    players,
    dealer: { cards: [], holeRevealed: false },
    endReason: null,
    winner: null,
  };
}

function dealRound(state) {
  let { shoe, shoePos, redCardOut, reshuffles = 0 } = state;
  const players = state.players.map(p => ({ ...p, hands: p.hands.map(h => ({ ...h, cards: [] })) }));
  const dealerCards = [];
  const snapshot = () => ({ ...state, shoe, shoePos, redCardOut, reshuffles, players, dealer: { ...state.dealer, cards: dealerCards } });

  // Deal 2 cards alternating players then dealer, matching a real Vegas table
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].hands.length > 0) {
        const d = drawFromShoe(snapshot());
        shoe = d.shoe;
        shoePos = d.shoePos;
        redCardOut = d.redCardOut;
        reshuffles = d.reshuffles;
        players[i].hands[0].cards.push(d.card);
      }
    }
    const dd = drawFromShoe(snapshot());
    shoe = dd.shoe;
    shoePos = dd.shoePos;
    redCardOut = dd.redCardOut;
    reshuffles = dd.reshuffles;
    dealerCards.push(dd.card);
  }

  const nextState = {
    ...state,
    shoe,
    shoePos,
    redCardOut,
    reshuffles,
    players,
    dealer: { cards: dealerCards, holeRevealed: false },
  };

  // If dealer has natural Blackjack, reveal hole card and settle immediately
  if (handValue(dealerCards).isBlackjack) {
    return settleRound({ ...nextState, dealer: { ...nextState.dealer, holeRevealed: true } });
  }

  return advanceToNextActionable(nextState, 0, 0);
}

function advanceToNextActionable(state, startPlayer, startHand) {
  const { players } = state;
  for (let pIdx = startPlayer; pIdx < players.length; pIdx++) {
    const p = players[pIdx];
    const hStart = pIdx === startPlayer ? startHand : 0;
    for (let hIdx = hStart; hIdx < p.hands.length; hIdx++) {
      const h = p.hands[hIdx];
      const val = handValue(h.cards, { isSplit: h.split });
      if (!h.stood && !h.doubled && !h.surrendered && !val.isBust && val.total < 21) {
        return { ...state, phase: 'playing', turnPlayer: pIdx, turnHand: hIdx };
      }
    }
  }
  return runDealer(state);
}

function runDealer(state) {
  let { shoe, shoePos, redCardOut, reshuffles = 0 } = state;
  const dealerCards = state.dealer.cards.map(c => ({ ...c }));

  // Dealer only draws if at least one player hand is live (not surrendered, busted, or natural blackjack)
  const hasLiveHand = state.players.some(p =>
    p.hands.some(h => {
      const v = handValue(h.cards, { isSplit: h.split });
      return !h.surrendered && !v.isBust && !v.isBlackjack;
    }),
  );

  if (hasLiveHand) {
    while (handValue(dealerCards).total < 17) {
      const d = drawFromShoe({ ...state, shoe, shoePos, redCardOut, reshuffles, dealer: { ...state.dealer, cards: dealerCards } });
      shoe = d.shoe;
      shoePos = d.shoePos;
      redCardOut = d.redCardOut;
      reshuffles = d.reshuffles;
      dealerCards.push(d.card);
    }
  }

  return settleRound({
    ...state,
    shoe,
    shoePos,
    redCardOut,
    reshuffles,
    dealer: { cards: dealerCards, holeRevealed: true },
  });
}

function settleRound(state) {
  const dVal = handValue(state.dealer.cards);
  const players = state.players.map(p => {
    if (p.hands.length === 0) return p;
    let returned = 0;
    let wonCount = 0;
    let bjCount = 0;
    const settledHands = p.hands.map(h => {
      const pVal = handValue(h.cards, { isSplit: h.split });
      let outcome;
      let payout = 0;

      if (h.surrendered) {
        outcome = 'surrender';
        payout = Math.floor(h.bet / 2);
      } else if (pVal.isBust) {
        outcome = 'bust';
        payout = 0;
      } else if (pVal.isBlackjack && !dVal.isBlackjack) {
        outcome = 'blackjack';
        payout = h.bet + Math.floor(h.bet * 1.5);
        wonCount++;
        bjCount++;
      } else if (dVal.isBlackjack && !pVal.isBlackjack) {
        outcome = 'lose';
        payout = 0;
      } else if (pVal.isBlackjack && dVal.isBlackjack) {
        outcome = 'push';
        payout = h.bet;
      } else if (dVal.isBust || pVal.total > dVal.total) {
        outcome = 'win';
        payout = h.bet * 2;
        wonCount++;
      } else if (pVal.total === dVal.total) {
        outcome = 'push';
        payout = h.bet;
      } else {
        outcome = 'lose';
        payout = 0;
      }
      returned += payout;
      return { ...h, outcome, payout };
    });

    const newCoins = p.coins + returned;
    return {
      ...p,
      coins: newCoins,
      handsWon: (p.handsWon || 0) + wonCount,
      blackjacks: (p.blackjacks || 0) + bjCount,
      bustedOut: newCoins <= 0,
      hands: settledHands,
    };
  });

  return { ...state, phase: 'roundEnd', players };
}

/** Place a bet for the current betting player; deals when all active players have bet. */
export function placeBet(state, amount) {
  if (state.phase !== 'betting') return state;
  const idx = state.bettingIndex;
  const p = state.players[idx];
  if (!p || !isActivePlayer(p)) return state;
  const minRequired = Math.min(state.minBet, p.coins);
  if (!Number.isInteger(amount) || amount < minRequired || amount > p.coins) return state;

  const players = state.players.map((pl, i) =>
    i === idx
      ? { ...pl, coins: pl.coins - amount, lastBet: amount, hands: [makeHand(amount)] }
      : pl,
  );
  const nextBetIdx = findNextBettingIndex(players, idx + 1);
  if (nextBetIdx !== -1) {
    return { ...state, players, bettingIndex: nextBetIdx };
  }
  return dealRound({ ...state, players, bettingIndex: -1 });
}

/** Mark a player as having left the table (keeping their current coins). */
export function leaveTable(state, playerIndex = null) {
  if (state.phase !== 'betting' && state.phase !== 'roundEnd') return state;
  const idx = playerIndex ?? state.bettingIndex;
  const p = state.players[idx];
  if (!p || p.left) return state;

  const players = state.players.map((pl, i) => (i === idx ? { ...pl, left: true } : pl));
  const anyNonLeft = players.some(pl => !pl.left);
  if (!anyNonLeft) {
    return finishGame({ ...state, players }, 'left');
  }

  if (state.phase === 'betting') {
    const nextBetIdx = findNextBettingIndex(players, 0);
    if (nextBetIdx !== -1) {
      return { ...state, players, bettingIndex: nextBetIdx };
    }
    const anyBet = players.some(pl => pl.hands.length > 0);
    if (anyBet) return dealRound({ ...state, players, bettingIndex: -1 });
    return finishGame({ ...state, players }, 'broke');
  }

  return { ...state, players };
}

export function canHit(state) {
  if (state.phase !== 'playing') return false;
  const h = state.players[state.turnPlayer]?.hands[state.turnHand];
  if (!h || h.stood || h.doubled) return false;
  const v = handValue(h.cards, { isSplit: h.split });
  return !v.isBust && v.total < 21;
}

export function canStand(state) {
  return state.phase === 'playing' && !!state.players[state.turnPlayer]?.hands[state.turnHand];
}

export function canDouble(state) {
  if (state.phase !== 'playing') return false;
  const p = state.players[state.turnPlayer];
  const h = p?.hands[state.turnHand];
  if (!h || h.cards.length !== 2 || h.stood || h.doubled) return false;
  return p.coins >= h.bet;
}

export function canSplit(state) {
  if (state.phase !== 'playing') return false;
  const p = state.players[state.turnPlayer];
  const h = p?.hands[0];
  if (!p || p.hands.length !== 1 || !h || h.cards.length !== 2) return false;
  return h.cards[0].rank === h.cards[1].rank && p.coins >= h.bet;
}

export function canSurrender(state) {
  if (state.phase !== 'playing') return false;
  const h = state.players[state.turnPlayer]?.hands[state.turnHand];
  if (!h || h.cards.length !== 2 || h.split || h.stood || h.doubled || h.surrendered) return false;
  return true;
}

/** Hit: deal one card to the active hand. */
export function hit(state) {
  if (!canHit(state)) return state;
  const d = drawFromShoe(state);
  const players = state.players.map((p, pi) =>
    pi !== state.turnPlayer
      ? p
      : {
          ...p,
          hands: p.hands.map((h, hi) =>
            hi === state.turnHand ? { ...h, cards: [...h.cards, d.card] } : h,
          ),
        },
  );
  const next = { ...state, shoe: d.shoe, shoePos: d.shoePos, redCardOut: d.redCardOut, reshuffles: d.reshuffles, players };
  const h = players[state.turnPlayer].hands[state.turnHand];
  const v = handValue(h.cards, { isSplit: h.split });
  if (v.isBust || v.total === 21) {
    return advanceToNextActionable(next, state.turnPlayer, state.turnHand + 1);
  }
  return next;
}

/** Stand: keep current hand total and advance to next hand/player. */
export function stand(state) {
  if (!canStand(state)) return state;
  const players = state.players.map((p, pi) =>
    pi !== state.turnPlayer
      ? p
      : {
          ...p,
          hands: p.hands.map((h, hi) =>
            hi === state.turnHand ? { ...h, stood: true } : h,
          ),
        },
  );
  return advanceToNextActionable({ ...state, players }, state.turnPlayer, state.turnHand + 1);
}

/** Double down: double bet, draw exactly one card, and automatically stand. */
export function doubleDown(state) {
  if (!canDouble(state)) return state;
  const d = drawFromShoe(state);
  const players = state.players.map((p, pi) => {
    if (pi !== state.turnPlayer) return p;
    const bet = p.hands[state.turnHand].bet;
    return {
      ...p,
      coins: p.coins - bet,
      hands: p.hands.map((h, hi) =>
        hi === state.turnHand
          ? { ...h, bet: h.bet * 2, doubled: true, stood: true, cards: [...h.cards, d.card] }
          : h,
      ),
    };
  });
  return advanceToNextActionable(
    { ...state, shoe: d.shoe, shoePos: d.shoePos, redCardOut: d.redCardOut, reshuffles: d.reshuffles, players },
    state.turnPlayer,
    state.turnHand + 1,
  );
}

/** Split: divide a pair into two independent hands, each receiving a second card. */
export function split(state) {
  if (!canSplit(state)) return state;
  const d1 = drawFromShoe(state);
  const d2 = drawFromShoe(
    { ...state, shoe: d1.shoe, shoePos: d1.shoePos, redCardOut: d1.redCardOut, reshuffles: d1.reshuffles },
    [d1.card],
  );

  const players = state.players.map((p, pi) => {
    if (pi !== state.turnPlayer) return p;
    const orig = p.hands[0];
    return {
      ...p,
      coins: p.coins - orig.bet,
      hands: [
        makeHand(orig.bet, [orig.cards[0], d1.card], true),
        makeHand(orig.bet, [orig.cards[1], d2.card], true),
      ],
    };
  });

  return advanceToNextActionable(
    { ...state, shoe: d2.shoe, shoePos: d2.shoePos, redCardOut: d2.redCardOut, reshuffles: d2.reshuffles, players },
    state.turnPlayer,
    0,
  );
}

/** Surrender: forfeit hand on initial two cards and recover half the bet. */
export function surrender(state) {
  if (!canSurrender(state)) return state;
  const players = state.players.map((p, pi) =>
    pi !== state.turnPlayer
      ? p
      : {
          ...p,
          hands: p.hands.map((h, hi) =>
            hi === state.turnHand ? { ...h, surrendered: true, stood: true } : h,
          ),
        },
  );
  return advanceToNextActionable({ ...state, players }, state.turnPlayer, state.turnHand + 1);
}

/** Advance from roundEnd to the next betting round, or finish the game if an end condition is met. */
export function nextRound(state) {
  if (state.phase !== 'roundEnd') return state;
  const anyNonLeft = state.players.some(p => !p.left);
  if (!anyNonLeft) return finishGame(state, 'left');

  const anyCanPlay = state.players.some(p => isActivePlayer(p));
  if (!anyCanPlay) return finishGame(state, 'broke');

  if (state.redCardOut) return finishGame(state, 'redCard');
  if (state.maxRounds > 0 && state.round >= state.maxRounds) return finishGame(state, 'rounds');

  const players = state.players.map(p => ({ ...p, hands: [] }));
  const firstBet = findNextBettingIndex(players, 0);
  return {
    ...state,
    round: state.round + 1,
    phase: 'betting',
    bettingIndex: firstBet,
    turnPlayer: 0,
    turnHand: 0,
    players,
    dealer: { cards: [], holeRevealed: false },
  };
}

export function canApplyOnlineAction(state, playersOrder, msg) {
  if (!state || !Array.isArray(playersOrder) || !msg || msg.t !== 'bj' || typeof msg.from !== 'string') return false;
  const senderIdx = playersOrder.indexOf(msg.from);
  if (senderIdx < 0) return false;
  if (msg.act === 'bet') return state.phase === 'betting' && senderIdx === state.bettingIndex;
  if (msg.act === 'hit' || msg.act === 'stand' || msg.act === 'double' || msg.act === 'split' || msg.act === 'surrender') {
    return state.phase === 'playing' && senderIdx === state.turnPlayer;
  }
  if (msg.act === 'next') return state.phase === 'roundEnd' && msg.from === 'A';
  if (msg.act === 'leave') {
    if (state.phase === 'betting') return senderIdx === state.bettingIndex && (msg.playerIndex === undefined || msg.playerIndex === senderIdx);
    if (state.phase === 'roundEnd') return msg.playerIndex === undefined || msg.playerIndex === senderIdx;
    return false;
  }
  return false;
}

export const isOver = state => state.phase === 'over';
export const shoeRemaining = state => Math.max(0, state.shoe.length - state.shoePos);
export const cardsUntilRedCard = state => Math.max(0, state.cutIndex - state.shoePos);
