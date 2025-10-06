"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const round_1 = require("./round");
const deck_1 = require("./deck");
const hand_1 = require("./hand");
class Game {
    _players;
    _targetScore;
    _scores;
    _round;
    _winner;
    _randomizer;
    _cardsPerPlayer;
    _dealer;
    _rounds = [];
    constructor({ players, targetScore, randomizer, cardsPerPlayer }) {
        if (!players || players.length < 2)
            throw new Error('At least 2 players required');
        if (!targetScore || targetScore <= 0)
            throw new Error('Target score must be > 0');
        this._players = players;
        this._targetScore = targetScore;
        this._scores = new Array(players.length).fill(0);
        this._randomizer = randomizer;
        this._cardsPerPlayer = cardsPerPlayer ?? 7;
        this._dealer = randomizer ? Math.floor(randomizer() * players.length) : Math.floor(Math.random() * players.length);
        this.startRound();
    }
    get playerCount() { return this._players.length; }
    player(i) { if (i < 0 || i >= this._players.length)
        throw new Error('Player index out of bounds'); return this._players[i]; }
    get targetScore() { return this._targetScore; }
    score(i) { if (i < 0 || i >= this._scores.length)
        throw new Error('Player index out of bounds'); return this._scores[i]; }
    winner() { return this._winner; }
    currentRound() { return this._round; }
    startRound(memento) {
        if (memento) {
            this._round = new round_1.Round();
            this._round.players = [...memento.players];
            this._round.dealer = memento.dealer;
            this._round.deck = new deck_1.Deck();
            this._round.deck.cards = memento.drawPile ? [...memento.drawPile] : [];
            this._round.hands = (memento.hands || []).map((hand) => new hand_1.Hand([...hand]));
            this._round.discardPile = memento.discardPile ? [...memento.discardPile] : [];
            this._round.currentPlayer = memento.playerInTurn ?? 0;
            this._round.direction = memento.currentDirection === 'counterclockwise' ? -1 : 1;
        }
        else {
            this._round = new round_1.Round();
            this._round.players = [...this._players];
            this._round.dealer = this._dealer;
            const deck = new deck_1.Deck();
            const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
            for (let color of colors) {
                deck.cards.push({ type: 'NUMBERED', color, number: 0 });
                for (let n = 1; n <= 9; n++) {
                    deck.cards.push({ type: 'NUMBERED', color, number: n });
                    deck.cards.push({ type: 'NUMBERED', color, number: n });
                }
                deck.cards.push({ type: 'SKIP', color });
                deck.cards.push({ type: 'SKIP', color });
                deck.cards.push({ type: 'REVERSE', color });
                deck.cards.push({ type: 'REVERSE', color });
                deck.cards.push({ type: 'DRAW', color });
                deck.cards.push({ type: 'DRAW', color });
            }
            for (let i = 0; i < 4; i++) {
                deck.cards.push({ type: 'WILD' });
                deck.cards.push({ type: 'WILD DRAW' });
            }
            if (this._randomizer) {
                for (let i = deck.cards.length - 1; i > 0; i--) {
                    const j = Math.floor(this._randomizer() * (i + 1));
                    [deck.cards[i], deck.cards[j]] = [deck.cards[j], deck.cards[i]];
                }
            }
            this._round.deck = deck;
            this._round.hands = this._players.map(() => new hand_1.Hand());
            for (let i = 0; i < this._cardsPerPlayer; i++) {
                for (let h of this._round.hands) {
                    const card = this._round.deck.deal();
                    if (card)
                        h.add(card);
                }
            }
            let firstCard;
            do {
                firstCard = this._round.deck.deal();
            } while (firstCard && (firstCard.type === 'WILD' || firstCard.type === 'WILD DRAW'));
            if (!firstCard)
                throw new Error('Deck exhausted before starting');
            this._round.discardPile = [firstCard];
            this._round.currentPlayer = (this._dealer + 1) % this._players.length;
            this._round.direction = 1;
        }
        this._rounds.push(this._round);
    }
}
exports.Game = Game;
