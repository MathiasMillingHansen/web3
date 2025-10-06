"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = exports.Deck = void 0;
exports.hasColor = hasColor;
exports.hasNumber = hasNumber;
const card_1 = require("./card");
Object.defineProperty(exports, "colors", { enumerable: true, get: function () { return card_1.colors; } });
class Deck {
    cards = [];
    constructor() {
        for (let color of card_1.colors) {
            // One 0 card of each color
            this.cards.push({ type: 'NUMBERED', color, number: 0 });
            // Two of each number 1-9 of each color
            for (let number = 1; number < 10; number++) {
                this.cards.push({ type: 'NUMBERED', color, number });
                this.cards.push({ type: 'NUMBERED', color, number });
            }
            // Two Skip cards of each color
            this.cards.push({ type: 'SKIP', color });
            this.cards.push({ type: 'SKIP', color });
            // Two Reverse cards of each color
            this.cards.push({ type: 'REVERSE', color });
            this.cards.push({ type: 'REVERSE', color });
            // Two Draw cards of each color
            this.cards.push({ type: 'DRAW', color });
            this.cards.push({ type: 'DRAW', color });
        }
        // Four Wild cards
        for (let i = 0; i < 4; i++) {
            this.cards.push({ type: 'WILD' });
            this.cards.push({ type: 'WILD DRAW' });
        }
    }
    get size() {
        return this.cards.length;
    }
    filter(aaaaaaaaa) {
        let newDeck = new Deck();
        newDeck.cards = this.cards.filter(aaaaaaaaa);
        return newDeck;
    }
    deal() {
        let dealt = this.cards.shift();
        return dealt;
    }
    shuffle(shuffler) {
        shuffler(this.cards);
    }
    toMemento() {
        let records = [];
        for (let card of this.cards) {
            if (card.type == 'WILD' || card.type == 'WILD DRAW')
                records.push({ type: card.type });
            if (card.type == 'DRAW' || card.type == 'REVERSE' || card.type == 'SKIP')
                records.push({ type: card.type, color: card.color });
            if (card.type == 'NUMBERED')
                records.push({ type: card.type, color: card.color, number: card.number });
        }
        return records;
    }
}
exports.Deck = Deck;
function hasColor(card, color) {
    if (card.type == 'WILD' || card.type == 'WILD DRAW')
        return false;
    return card.color == color;
}
function hasNumber(card, number) {
    if (card.type != 'NUMBERED')
        return false;
    return card.number == number;
}
