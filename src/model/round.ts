
import { Card } from "./card";
import { Deck } from "./deck";
import { Hand } from "./hand";



class Round {

    sayUno(playerIndex: number): boolean {
        const hand = this.playerHand(playerIndex);
        if (hand.size === 1) {
            this.unoDeclared[playerIndex] = true;
            return true;
        }
        return false;
    }

    catchUno(targetPlayerIndex: number): boolean {
        const hand = this.playerHand(targetPlayerIndex);
        if (hand.size === 1 && !this.unoDeclared[targetPlayerIndex]) {
            for (let i = 0; i < 2; i++) {
                const card = this.deck.deal();
                if (card) hand.add(card);
            }
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
        this.currentPlayer = (this.dealer + 1) % this.players.length;
        this.direction = 1;
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

    canPlay(index: number, colorOverride?: string): boolean {
        if (index < 0 || index >= this.hands.length) return false;
        const hand = this.playerHand(index);
        const card = hand.getCards()[0];
        if (!card) return false;
        return this.isPlayable(card, colorOverride, hand.getCards());
    }

    isPlayable(card: Card, colorOverride?: string, hand?: Card[]): boolean {
        const top = this.topCard;
        let activeColor: string | undefined = colorOverride;
        if (!activeColor && (top.type === 'WILD' || top.type === 'WILD DRAW')) {
            activeColor = (top as any).chosenColor;
        }
        if (!activeColor && 'color' in top) {
            activeColor = (top as any).color;
        }

        if (card.type === 'WILD DRAW' && hand) {
            const hasPlayable = hand.some(c => c !== card && this.isPlayable(c, activeColor, hand.filter(x => x !== card)) && !['WILD', 'WILD DRAW'].includes(c.type));
            if (hasPlayable) return false;
            return true;
        }

        if (card.type === 'WILD') return true;

        if (top.type === 'WILD' || top.type === 'WILD DRAW') {
            if ('color' in card && card.color === activeColor) return true;
            if (['WILD', 'WILD DRAW'].includes(card.type)) return true;
            return false;
        }

        if (['REVERSE', 'SKIP', 'DRAW'].includes(card.type)) {
            if ('color' in card && card.color === activeColor) return true;
            if (card.type === top.type) return true;
            return false;
        }

        if (card.type === 'NUMBERED') {
            if ('color' in card && card.color === activeColor) return true;
            if (top.type === 'NUMBERED' && card.number === top.number) return true;
            return false;
        }

        return false;
    }

    play(index: number, color?: string): boolean {
        if (index < 0 || index >= this.hands[this.currentPlayer].getCards().length) return false;
        const hand = this.hands[this.currentPlayer];
        const card = hand.getCards()[index];
        if (!card) return false;
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            (card as any).chosenColor = color;
        }
        if (!this.isPlayable(card, (card as any).chosenColor, hand.getCards())) return false;
        if (!hand.remove(card)) return false;
        this.discardPile.push(card);
        this.handleCardEffect(card);
        if (hand.size !== 1) {
            this.unoDeclared[this.currentPlayer] = false;
        }
        this.nextPlayer();
        return true;
    }

    playCard(card: Card): boolean {
        const hand = this.hands[this.currentPlayer];
        if ((card.type === 'WILD' || card.type === 'WILD DRAW') && !(card as any).chosenColor) {
            throw new Error('Must set chosenColor on wild cards before playing');
        }
        if (!this.isPlayable(card, (card as any).chosenColor, hand.getCards())) return false;
        if (!hand.remove(card)) return false;
        this.discardPile.push(card);
        this.handleCardEffect(card);
        if (hand.size !== 1) {
            this.unoDeclared[this.currentPlayer] = false;
        }
        this.nextPlayer();
        return true;
    }

    drawCard(): Card | undefined {
        const card = this.deck.deal();
        if (card) this.hands[this.currentPlayer].add(card);
        return card;
    }

    handleCardEffect(card: Card) {
        if (card.type === 'SKIP') {
            this.nextPlayer();
        } else if (card.type === 'REVERSE') {
            this.direction = (this.direction === 1 ? -1 : 1);
            if (this.players.length === 2) this.nextPlayer();
        } else if (card.type === 'DRAW') {
            this.nextPlayer();
            for (let i = 0; i < 2; i++) this.drawCard();
        } else if (card.type === 'WILD DRAW') {
            this.nextPlayer();
            for (let i = 0; i < 4; i++) this.drawCard();
        }
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + this.direction + this.players.length) % this.players.length;
    }
}

export { Round }
