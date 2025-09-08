import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'
import { Card } from '../../src/model/card'
import { Deck } from '../../src/model/deck'
import { Colors } from '../../src/model/card'

// Fix (or import) these types:
type Round = any
type Game = any

//Fill out the empty functions
export function createInitialDeck(): Deck {
  const colors = Colors
  const deck : Deck = []
  for (let color of colors) {
    // One 0 card of each color
    deck.push({ type: 'NUMBERED', color, number: 0 })
    // Two of each number 1-9 of each color
    for (let number = 1; number < 10; number++) {
      deck.push({ type: 'NUMBERED', color, number })
      deck.push({ type: 'NUMBERED', color, number })
    }
    // Two Skip cards of each color
    deck.push({ type: 'SKIP', color })
    deck.push({ type: 'SKIP', color })
    // Two Reverse cards of each color
    deck.push({ type: 'REVERSE', color })
    deck.push({ type: 'REVERSE', color })
    // Two Draw cards of each color
    deck.push({ type: 'DRAW', color })
    deck.push({ type: 'DRAW', color })
  }
  // Four Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ type: 'WILD' })
    deck.push({ type: 'WILD DRAW' })
  }
  return deck
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: HandConfig): Round {
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
