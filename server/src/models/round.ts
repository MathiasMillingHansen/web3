
import { Card, Color } from "./card";
import { Deck } from "./deck";
import { Hand } from "./hand";

class Round {

    sayUno(playerIndex: number): boolean {
        const hand = this.playerHand(playerIndex);
        console.log("Player", playerIndex, "is saying UNO with hand size", hand.size);
        if (hand.size === 1) {
            this.unoDeclared[playerIndex] = true;
            return true;
        }
        return false;
    }

    catchUno(targetPlayerIndex: number): boolean {
        const hand = this.playerHand(targetPlayerIndex);
        if (hand.size === 1 && !this.unoDeclared[targetPlayerIndex]) {
            this.drawCard(targetPlayerIndex);
            this.drawCard(targetPlayerIndex);
            this.unoDeclared[targetPlayerIndex] = false;
            return true;
        }
        return false;
    }
    private unoDeclared: boolean[] = [];



    static readonly MIN_PLAYERS = 2;
    static readonly MAX_PLAYERS = 10;
    players: string[] = [];
    dealer: number = 0;
    deck: Deck = new Deck();
    hands: Hand[] = [];
    discardPile: Card[] = [];
    currentPlayer: number = 0;
    direction: 1 | -1 = 1;
    topColor: Color | undefined; // Color chosen by player for WILD or WILD DRAW

    get playerCount(): number {
        return this.players.length;
    }

    player(index: number): string {
        if (index < 0 || index >= this.players.length) throw new Error(`Player index out of bounds: ${index}`);
        return this.players[index];
    }

    playerHand(index: number): Hand {
        if (index < 0 || index >= this.players.length) throw new Error(`Player index out of bounds: ${index}`);
        return this.hands[index];
    }

    setup(playerNames: string[], deck: Deck, handSize = 7) {
        if (playerNames.length < Round.MIN_PLAYERS || playerNames.length > Round.MAX_PLAYERS) {
            throw new Error('Invalid number of players');
        }
        this.players = [...playerNames];
        this.deck = deck;
        this.hands = this.players.map(() => new Hand());
        this.unoDeclared = this.players.map(() => false);
        for (let i = 0; i < handSize; i++) {
            for (let h of this.hands) {
                const card = this.deck.deal();
                if (card) h.add(card);
            }
        }

        let firstCard: Card | undefined;
        do {
            firstCard = this.deck.deal();
        } while (firstCard && (firstCard.type === 'WILD' || firstCard.type === 'WILD DRAW'));
        if (!firstCard) throw new Error('Deck exhausted before starting');
        this.discardPile = [firstCard];
        this.topColor = firstCard.color;
        this.currentPlayer = (this.dealer) % this.players.length;
        this.direction = 1;
    }

    // Initialize lobby with players but don't start the game yet
    initializeLobby(playerNames: string[]) {
        if (playerNames.length > Round.MAX_PLAYERS) {
            throw new Error('Too many players');
        }
        this.players = [...playerNames];
        this.hands = this.players.map(() => new Hand());
        this.unoDeclared = this.players.map(() => false);
    }

    needsToSayUno(playerIndex: number): boolean {
        const hand = this.playerHand(playerIndex);
        return hand.size === 1 && !this.unoDeclared[playerIndex];
    }

    hasDeclaredUno(playerIndex: number): boolean {
        return this.unoDeclared[playerIndex];
    }


    get topCard(): Card {
        if (this.discardPile.length === 0) throw new Error('No cards in discard pile');
        return this.discardPile[this.discardPile.length - 1];
    }

    canPlay(index: number): boolean {
        if (index < 0 || index >= this.hands.length) return false;
        const hand = this.playerHand(index);
        const card = hand.getCards()[0];
        if (!card) return false;
        return this.isPlayable(card, hand.getCards(), );
    }

    isPlayable(card: Card, hand: Card[]): boolean {
        switch (card.type)
        {
            case 'WILD': {
                return true;
            }

            case 'WILD DRAW': {
                // From rules: "You can only play this card when you don't have a card
                // in your hand that matches the color of the card previously played."
                if (!hand.some(c => 'color' in c && c.color === this.topColor)) return true;
            } break;

            case 'REVERSE':
            case 'SKIP':
            case 'DRAW': {
                if (this.topCard.type === card.type) return true;
                if (this.topColor === card.color) return true;
            } break;

            case 'NUMBERED': {
                if (this.topCard.type === 'NUMBERED' && this.topCard.number === card.number) return true;
                if (this.topColor === card.color) return true;
            } break;
        }

        return false;
    }

    play(index: number, chosenColor?: Color): boolean {
        if (index < 0 || index >= this.hands[this.currentPlayer].getCards().length) return false;
        const hand = this.hands[this.currentPlayer];
        const card = hand.getCards()[index];
        if (!card) return false;

        console.log('Validating card play:', {
            cardType: card.type,
            chosenColor,
            currentTopCard: this.topCard.type,
            currentTopColor: this.topColor,
        });

        if (!this.isPlayable(card, hand.getCards())) return false;

        if ('color' in card) {
            if (chosenColor != undefined) throw new Error(`Cannot choose color for card type ${card.type}`);
            this.topColor = card.color;
        } else {
            if (chosenColor == undefined) throw new Error(`Must choose color for card type ${card.type}`);
            this.topColor = chosenColor;
        }

        if (!hand.remove(card)) return false;
        this.discardPile.push(card);

        switch (card.type) {
            case 'REVERSE':
                if (this.players.length === 2) {
                    this.nextPlayer();
                } else {
                    this.direction = this.direction === 1 ? -1 : 1;
                }
                break;
            case 'SKIP':
                this.nextPlayer();
                break;
            case 'DRAW':
                this.nextPlayer();
                const nextHand = this.hands[this.currentPlayer];
                this.drawCard();
                this.drawCard();
                break;
            case 'WILD DRAW':
                this.nextPlayer();
                const affectedHand = this.hands[this.currentPlayer];
                this.drawCard();
                this.drawCard();
                this.drawCard();
                this.drawCard();
                break;
        }

        this.nextPlayer();
        return true;
    }

    drawCard(targetPlayerIndex?: number): Card | undefined {
        const card = this.deck.deal();
        if (card) {
            if (targetPlayerIndex !== undefined) {
                this.hands[targetPlayerIndex].add(card);
                this.unoDeclared[targetPlayerIndex] = false;
            } else {
                this.hands[this.currentPlayer].add(card);
                this.unoDeclared[this.currentPlayer] = false;
            }
        }
        return card;
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + this.direction + this.players.length) % this.players.length;
        console.log('player is now:', this.currentPlayer);
    }
}

export { Round }
