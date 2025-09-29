import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import { Card } from '../../server/src/models/card'
import { Deck } from '../../server/src/models/deck'
import { type Color } from '../../server/src/models/card'
import { colors } from '../../server/src/models/card'
import { Round } from '../../server/src/models/round'
import { Hand } from '../../server/src/models/hand'

// Fix (or import) these types:
type Game = any

//Fill out the empty functions
export function createInitialDeck(): Deck {
  const deck = new Deck();
  for (let color of colors) {
    // One 0 card of each color
    deck.cards.push({ type: 'NUMBERED', color, number: 0 })
    // Two of each number 1-9 of each color
    for (let number = 1; number < 10; number++) {
      deck.cards.push({ type: 'NUMBERED', color, number })
      deck.cards.push({ type: 'NUMBERED', color, number })
    }
    // Two Skip cards of each color
    deck.cards.push({ type: 'SKIP', color })
    deck.cards.push({ type: 'SKIP', color })
    // Two Reverse cards of each color
    deck.cards.push({ type: 'REVERSE', color })
    deck.cards.push({ type: 'REVERSE', color })
    // Two Draw cards of each color
    deck.cards.push({ type: 'DRAW', color })
    deck.cards.push({ type: 'DRAW', color })
  }
  // Four Wild cards
  for (let i = 0; i < 4; i++) {
    deck.cards.push({ type: 'WILD' })
    deck.cards.push({ type: 'WILD DRAW' })
  }
  return deck
}

function extractNumber(a: any): number {
  if (typeof a != 'number') throw new Error(`${a} is not a number`);
  return a;
}

function extractColor(a: any): Color {
  for (let c of colors) {
    if (c == a) {
      return c;
    }
  }
  throw new Error(`Invalid color: ${a}`);
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
  let deck = new Deck();
  deck.cards = cards.map(r => {
    let type = r['type']
    if (type == 'NUMBERED') { return { type, color: extractColor(r.color), number: extractNumber(r.number) }}
    if (type == 'SKIP') { return { type, color: extractColor(r.color) }}
    if (type == 'REVERSE') { return { type, color: extractColor(r.color) }}
    if (type == 'DRAW') { return { type, color: extractColor(r.color) }}
    if (type == 'WILD') { return { type }}
    if (type == 'WILD DRAW') { return { type }}
    throw new Error(`Unknown type: ${type}`);
  });
  return deck;
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({players, dealer, shuffler = standardShuffler, cardsPerPlayer = 7 }: HandConfig): Round {
  if (players.length < Round.MIN_PLAYERS) throw new Error('At least 2 players required');
  if (players.length > Round.MAX_PLAYERS) throw new Error('At most 10 players allowed');
  let round = new Round();
  round.players = players;
  round.dealer = dealer;
  round.deck = createInitialDeck(); // Always use a fresh, full deck
  round.deck.shuffle(shuffler);
  round.hands = players.map(() => new Hand());
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let h of round.hands) {
      const card = round.deck.deal();
      if (card) h.add(card);
    }
  }
  // Set up discard pile with the next card from the deck
  const firstCard = round.deck.deal();
  if (!firstCard) throw new Error('Deck exhausted before starting');
  round.discardPile = [firstCard];
  return round;
}

export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
}

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
}

export function createGameFromMemento(memento: any, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler): Game {
}
