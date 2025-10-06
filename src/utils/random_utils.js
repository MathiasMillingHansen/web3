"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardRandomizer = void 0;
exports.standardShuffler = standardShuffler;
// Uniformly selected pseudo-random number
const standardRandomizer = n => Math.floor(Math.random() * n);
exports.standardRandomizer = standardRandomizer;
// Perfect shuffle using the Fisher-Yates method
function standardShuffler(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        const j = Math.floor(Math.random() * (cards.length - i) + i);
        const temp = cards[j];
        cards[j] = cards[i];
        cards[i] = temp;
    }
}
