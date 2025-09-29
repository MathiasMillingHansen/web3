import { type Card } from './card'
import { type Color } from './card'
import { colors } from './card'
import { Shuffler } from "../utils/random_utils"

class Deck {
    cards: Card[] = [];

    constructor() {
        for (let color of colors) {
            // One 0 card of each color
            this.cards.push({ type: 'NUMBERED', color, number: 0 })
            // Two of each number 1-9 of each color
            for (let number = 1; number < 10; number++) {
                this.cards.push({ type: 'NUMBERED', color, number })
                this.cards.push({ type: 'NUMBERED', color, number })
            }
            // Two Skip cards of each color
            this.cards.push({ type: 'SKIP', color })
            this.cards.push({ type: 'SKIP', color })
            // Two Reverse cards of each color
            this.cards.push({ type: 'REVERSE', color })
            this.cards.push({ type: 'REVERSE', color })
            // Two Draw cards of each color
            this.cards.push({ type: 'DRAW', color })
            this.cards.push({ type: 'DRAW', color })
        }
        // Four Wild cards
        for (let i = 0; i < 4; i++) {
            this.cards.push({ type: 'WILD' })
            this.cards.push({ type: 'WILD DRAW' })
        }

    }


    get size(): number {
        return this.cards.length;
    }

    filter(aaaaaaaaa: (a: Card) => boolean): Deck {
        let newDeck = new Deck();
        newDeck.cards = this.cards.filter(aaaaaaaaa);
        return newDeck;
    }

    deal(): Card | undefined {
        let dealt = this.cards.shift();
        return dealt;
    }

    shuffle(shuffler: Shuffler<Card>) {
        shuffler(this.cards);
    }

    toMemento(): Record<string, string | number>[] {
        let records: Record<string, string | number>[] = [];
        for (let card of this.cards) {
            if (card.type == 'WILD' || card.type == 'WILD DRAW') records.push({ type: card.type });
            if (card.type == 'DRAW' || card.type == 'REVERSE' || card.type == 'SKIP') records.push({ type: card.type, color: card.color });
            if (card.type == 'NUMBERED') records.push({ type: card.type, color: card.color, number: card.number });
        }
        return records;
    }
}

function hasColor(card: Card, color: Color): boolean {
    if (card.type == 'WILD' || card.type == 'WILD DRAW') return false;
    return card.color == color;
}

function hasNumber(card: Card, number: number): boolean {
    if (card.type != 'NUMBERED') return false;
    return card.number == number;
}

export { Deck, hasColor, hasNumber, colors, Card }
