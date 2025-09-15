class Round {
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
