import { Card } from './card';


class Hand {
    private cards: Card[] = [];

    constructor(initialCards: Card[] = []) {
        this.cards = [...initialCards];
    }

    add(card: Card) {
        this.cards.push(card);
    }

    remove(card: Card): boolean {
        const idx = this.cards.findIndex(c => JSON.stringify(c) === JSON.stringify(card));
        if (idx !== -1) {
            this.cards.splice(idx, 1);
            return true;
        }
        return false;
    }

    getCards(): Card[] {
        return [...this.cards];
    }

    get size(): number {
        return this.cards.length;
    }
}

export { Hand };
