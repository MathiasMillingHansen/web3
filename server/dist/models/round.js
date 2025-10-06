"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Round = void 0;
const deck_1 = require("./deck");
const hand_1 = require("./hand");
class Round {
    sayUno(playerIndex) {
        const hand = this.playerHand(playerIndex);
        if (hand.size === 1) {
            this.unoDeclared[playerIndex] = true;
            return true;
        }
        return false;
    }
    catchUno(targetPlayerIndex) {
        const hand = this.playerHand(targetPlayerIndex);
        if (hand.size === 1 && !this.unoDeclared[targetPlayerIndex]) {
            for (let i = 0; i < 2; i++) {
                const card = this.deck.deal();
                if (card)
                    hand.add(card);
            }
            this.unoDeclared[targetPlayerIndex] = false;
            return true;
        }
        return false;
    }
    unoDeclared = [];
    static MIN_PLAYERS = 2;
    static MAX_PLAYERS = 10;
    players = [];
    dealer = 0;
    deck = new deck_1.Deck();
    hands = [];
    discardPile = [];
    currentPlayer = 0;
    direction = 1;
    get playerCount() {
        return this.players.length;
    }
    player(index) {
        if (index < 0 || index >= this.players.length)
            throw new Error(`Player index out of bounds: ${index}`);
        return this.players[index];
    }
    playerHand(index) {
        if (index < 0 || index >= this.players.length)
            throw new Error(`Player index out of bounds: ${index}`);
        return this.hands[index];
    }
    setup(playerNames, deck, handSize = 7) {
        if (playerNames.length < Round.MIN_PLAYERS || playerNames.length > Round.MAX_PLAYERS) {
            throw new Error('Invalid number of players');
        }
        this.players = [...playerNames];
        this.deck = deck;
        this.hands = this.players.map(() => new hand_1.Hand());
        this.unoDeclared = this.players.map(() => false);
        for (let i = 0; i < handSize; i++) {
            for (let h of this.hands) {
                const card = this.deck.deal();
                if (card)
                    h.add(card);
            }
        }
        let firstCard;
        do {
            firstCard = this.deck.deal();
        } while (firstCard && (firstCard.type === 'WILD' || firstCard.type === 'WILD DRAW'));
        if (!firstCard)
            throw new Error('Deck exhausted before starting');
        this.discardPile = [firstCard];
        this.currentPlayer = (this.dealer) % this.players.length;
        this.direction = 1;
    }
    // Initialize lobby with players but don't start the game yet
    initializeLobby(playerNames) {
        if (playerNames.length > Round.MAX_PLAYERS) {
            throw new Error('Too many players');
        }
        this.players = [...playerNames];
        this.hands = this.players.map(() => new hand_1.Hand());
        this.unoDeclared = this.players.map(() => false);
        // Don't initialize deck or deal cards - this is just lobby setup
    }
    needsToSayUno(playerIndex) {
        const hand = this.playerHand(playerIndex);
        return hand.size === 1 && !this.unoDeclared[playerIndex];
    }
    hasDeclaredUno(playerIndex) {
        return this.unoDeclared[playerIndex];
    }
    get topCard() {
        if (this.discardPile.length === 0)
            throw new Error('No cards in discard pile');
        return this.discardPile[this.discardPile.length - 1];
    }
    canPlay(index, colorOverride) {
        if (index < 0 || index >= this.hands.length)
            return false;
        const hand = this.playerHand(index);
        const card = hand.getCards()[0];
        if (!card)
            return false;
        return this.isPlayable(card, colorOverride, hand.getCards());
    }
    isPlayable(card, colorOverride, hand) {
        const top = this.topCard;
        let activeColor = colorOverride;
        if (!activeColor && (top.type === 'WILD' || top.type === 'WILD DRAW')) {
            activeColor = top.chosenColor;
        }
        if (!activeColor && 'color' in top) {
            activeColor = top.color;
        }
        if (card.type === 'WILD DRAW' && hand) {
            console.log('Validating WILD DRAW card:', {
                activeColor,
                handSize: hand.length,
                topCard: this.topCard
            });
            const hasPlayable = hand.some(c => {
                if (c === card)
                    return false; // Don't count the wild draw card itself
                const isPlayable = this.isPlayable(c, activeColor, hand.filter(x => x !== card));
                const isWild = ['WILD', 'WILD DRAW'].includes(c.type);
                console.log(`Card ${c.type} ${c.color || 'no-color'}: playable=${isPlayable}, isWild=${isWild}`);
                return isPlayable && !isWild;
            });
            console.log('Has other playable non-wild cards:', hasPlayable);
            if (hasPlayable)
                return false;
            return true;
        }
        if (card.type === 'WILD')
            return true;
        if (top.type === 'WILD' || top.type === 'WILD DRAW') {
            if ('color' in card && card.color === activeColor)
                return true;
            if (['WILD', 'WILD DRAW'].includes(card.type))
                return true;
            return false;
        }
        if (['REVERSE', 'SKIP', 'DRAW'].includes(card.type)) {
            if ('color' in card && card.color === activeColor)
                return true;
            if (card.type === top.type)
                return true;
            return false;
        }
        if (card.type === 'NUMBERED') {
            if ('color' in card && card.color === activeColor)
                return true;
            if (top.type === 'NUMBERED' && card.number === top.number)
                return true;
            return false;
        }
        return false;
    }
    play(index, color) {
        if (index < 0 || index >= this.hands[this.currentPlayer].getCards().length)
            return false;
        const hand = this.hands[this.currentPlayer];
        const card = hand.getCards()[index];
        if (!card)
            return false;
        // For WILD DRAW cards, validate against current active color (not chosen color)
        // For other cards, use the chosen color
        const validationColor = card.type === 'WILD DRAW' ? undefined : color;
        console.log('Validating card play:', {
            cardType: card.type,
            chosenColor: color,
            validationColor,
            currentTopCard: this.topCard.type,
            currentTopColor: this.topCard.color || this.topCard.chosenColor
        });
        if (!this.isPlayable(card, validationColor, hand.getCards()))
            return false;
        // Only set the chosen color AFTER validation passes
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            card.chosenColor = color;
        }
        if (!hand.remove(card))
            return false;
        this.discardPile.push(card);
        this.handleCardEffect(card);
        if (hand.size !== 1) {
            this.unoDeclared[this.currentPlayer] = false;
        }
        // Only advance turn for cards that don't handle their own turn advancement
        if (card.type === 'REVERSE' && this.players.length > 2) {
            // REVERSE in 3+ player games: just changes direction, normal turn advance
            this.nextPlayer();
        }
        else if (!['SKIP', 'DRAW', 'WILD DRAW', 'REVERSE'].includes(card.type)) {
            // Regular cards (NUMBERED, WILD): advance turn normally
            this.nextPlayer();
        }
        // SKIP, DRAW, WILD DRAW, and REVERSE (2-player) handle their own turn advancement
        return true;
    }
    playCard(card) {
        const hand = this.hands[this.currentPlayer];
        if ((card.type === 'WILD' || card.type === 'WILD DRAW') && !card.chosenColor) {
            throw new Error('Must set chosenColor on wild cards before playing');
        }
        if (!this.isPlayable(card, card.chosenColor, hand.getCards()))
            return false;
        if (!hand.remove(card))
            return false;
        this.discardPile.push(card);
        this.handleCardEffect(card);
        if (hand.size !== 1) {
            this.unoDeclared[this.currentPlayer] = false;
        }
        this.nextPlayer();
        return true;
    }
    drawCard() {
        const card = this.deck.deal();
        if (card)
            this.hands[this.currentPlayer].add(card);
        return card;
    }
    handleCardEffect(card) {
        if (card.type === 'SKIP') {
            this.nextPlayer();
        }
        else if (card.type === 'REVERSE') {
            this.direction = (this.direction === 1 ? -1 : 1);
            if (this.players.length === 2)
                this.nextPlayer();
        }
        else if (card.type === 'DRAW') {
            this.nextPlayer();
            for (let i = 0; i < 2; i++)
                this.drawCard();
        }
        else if (card.type === 'WILD DRAW') {
            this.nextPlayer();
            for (let i = 0; i < 4; i++)
                this.drawCard();
        }
    }
    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + this.direction + this.players.length) % this.players.length;
    }
}
exports.Round = Round;
