import { Card } from "./card";
import { Deck } from "./deck";
import { Hand } from "./hand";

class Round {
    static readonly MIN_PLAYERS = 2;
    static readonly MAX_PLAYERS = 10;
    players: string[] = []; // Array of player names
    dealer: number = 0;
    deck: Deck = new Deck();

    hands: Hand[] = [];

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
}

export { Round }
