import { Card } from "./card.js";

class Round {
    static readonly MIN_PLAYERS = 2;
    static readonly MAX_PLAYERS = 10;
    players: string[] = [];
    dealer: number = 0;

    hands: Card[][] = [];

    get playerCount(): number {
        return this.players.length;
    }

    player(index: number): string {
        return this.players[index];
    }

    playerHand(index: number) {

    }
}

export { Round }
