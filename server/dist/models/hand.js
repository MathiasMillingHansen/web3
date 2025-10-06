"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hand = void 0;
class Hand {
    cards = [];
    constructor(initialCards = []) {
        this.cards = [...initialCards];
    }
    add(card) {
        this.cards.push(card);
    }
    remove(card) {
        const idx = this.cards.findIndex(c => JSON.stringify(c) === JSON.stringify(card));
        if (idx !== -1) {
            this.cards.splice(idx, 1);
            return true;
        }
        return false;
    }
    getCards() {
        return [...this.cards];
    }
    get size() {
        return this.cards.length;
    }
}
exports.Hand = Hand;
