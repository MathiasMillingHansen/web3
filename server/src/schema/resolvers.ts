import { PubSub } from 'graphql-subscriptions';
import { Round } from '../models/round';
import { colors, Deck } from '../models/deck';
import { isColor } from '../models/card';
import { Player } from '../models/player';
import { Hand } from '../models/hand';
import { standardShuffler } from '../utils/random_utils';

const pubsub = new PubSub();

const games = new Map<string, Round>();
let gameIdCounter = 1;

function gameChanged(gameId: string)
{
  let game = games.get(gameId);
  if (!game) return;

  let formatted = formatGame(gameId, game);

  pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: formatted });
}

export const resolvers = {
  Query: {
    game: (_: any, { id, playerId }: { id: string; playerId?: string }) => {
      const game = games.get(id);
      if (!game) throw new Error('Game not found');
      return formatGame(id, game);
    },

    games: () => {
      return Array.from(games.entries()).map(([id, game]) => formatGame(id, game));
    },

    playerHand: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      const playerIndex = parseInt(playerId);
      if (playerIndex < 0 || playerIndex >= game.players.length) {
        throw new Error('Player not found');
      }

      const hand = game.playerHand(playerIndex);
      return hand.getCards();
    },
  },

  Mutation: {
    createGame: (_: any, { playerNames }: { playerNames: string[] }) => {
      const gameId = (gameIdCounter++).toString();
      const round = new Round();

      // For single player games, just set up the lobby structure without dealing cards
      if (playerNames.length === 1) {
        round.initializeLobby(playerNames);
      } else {
        // Multi-player setup - full game initialization
        const deck = new Deck();
        deck.shuffle(standardShuffler);
        round.setup(playerNames, deck, 7);
      }

      games.set(gameId, round);

      gameChanged(gameId);
      return { id: gameId };
    },

    joinGame: (_: any, { gameId, playerName }: { gameId: string; playerName: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      if (game.players.length >= 5) {
        throw new Error('Game is full');
      }

      if (game.players.includes(playerName)) {
        throw new Error('Player name already exists in this game');
      }

      game.players.push(playerName);
      game.hands.push(new Hand());

      // If game has already started, deal cards to new player
      if (game.discardPile.length > 0) {
        const cardsPerPlayer = 7;
        for (let i = 0; i < cardsPerPlayer; i++) {
          const card = game.deck.deal();
          if (card) game.hands[game.hands.length - 1].add(card);
        }
      }

      console.log(`Player ${playerName} joined game ${gameId}. Now ${game.players.length} players.`);

      let playerId = game.players.length - 1;
      gameChanged(gameId);
      return { id: gameId, playerId: playerId};
    },

    startGame: (_: any, { gameId }: { gameId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      if (game.players.length < 2) {
        throw new Error('Need at least 2 players to start the game');
      }

      // If game hasn't been initialized yet (lobby state), initialize it now
      if (game.discardPile.length === 0) {
        console.log(`Host starting game ${gameId} with ${game.players.length} players`);
        const deck = new Deck();
        deck.shuffle(standardShuffler);
        game.setup(game.players, deck, 7);
      }

      gameChanged(gameId);
      return { status: true };
    },

    playCard: (_: any, { gameId, playerId, cardIndex, color }: {
      gameId: string;
      playerId: string;
      cardIndex: number;
      color?: string
    }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      const playerIndex = parseInt(playerId);
      console.log('PlayCard attempt:', {
        gameId,
        requestedPlayerId: playerId,
        playerIndex,
        currentPlayer: game.currentPlayer,
        cardIndex,
        totalPlayers: game.players.length,
        cardToPlay: game.hands[playerIndex].getCards()[cardIndex]
      });

      if (playerIndex !== game.currentPlayer) {
        throw new Error(`Not your turn. Current player is ${game.currentPlayer}, you are ${playerIndex}`);
      }

      if (color != undefined && !isColor(color)) {
        throw new Error(`Invalid color chosen: ${color}`);
      }

      const currentPlayerBefore = game.currentPlayer;
      const success = game.play(cardIndex, color);
      const currentPlayerAfter = game.currentPlayer;

      console.log('PlayCard result:', {
        success,
        currentPlayerBefore,
        currentPlayerAfter,
        playerAdvancement: currentPlayerAfter !== currentPlayerBefore
      });
      if (!success) throw new Error('Invalid move');

      gameChanged(gameId);
      return { status: true };
    },

    drawCard: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      const playerIndex = parseInt(playerId);
      console.log('DrawCard attempt:', {
        gameId,
        requestedPlayerId: playerId,
        playerIndex,
        currentPlayer: game.currentPlayer,
        totalPlayers: game.players.length
      });

      if (playerIndex !== game.currentPlayer) {
        throw new Error(`Not your turn. Current player is ${game.currentPlayer}, you are ${playerIndex}`);
      }

      const drawnCard = game.drawCard();
      if (!drawnCard) throw new Error('No more cards to draw');

      game.nextPlayer();

      gameChanged(gameId);
      return { status: true };
    },

    declareUno: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');
      const playerIndex = parseInt(playerId);
      const status = game.sayUno(playerIndex);

      console.log(`Player ${playerIndex} declared UNO in game ${gameId}`);

      gameChanged(gameId);
      return {
        id: gameId,
        status
      };
    },

    catchUno: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');
      const playerIndex = parseInt(playerId);

      const status = game.catchUno(playerIndex);

      console.log(`Player ${playerIndex} caught an opponent not saying UNO in game ${gameId}`);

      gameChanged(gameId);
      return {
        id: gameId,
        status
      };
    }
  },

  Subscription: {
    gameUpdated: {
      subscribe: (_: any, { gameId }: { gameId: string }) => {
        return pubsub.asyncIterator([`GAME_UPDATED_${gameId}`]);
      },
    },
  },
};

function formatGame(id: string, round: Round) {
  let status = 'LOBBY';
  if (round.discardPile.length > 0) {
    status = 'PLAYING';
  }

  return {
    id,
    players: round.players.map((name: string, index: number) => ({
      id: index.toString(),
      name,
      handSize: round.hands[index] ? round.hands[index].size : 0,
      cards: round.hands[index].getCards(),
      hasDeclaredUno: round.hasDeclaredUno(index)
    })),
    currentPlayer: round.currentPlayer,
    topCard: round.discardPile.length > 0 ? round.discardPile[round.discardPile.length - 1] : null,
    topColor: round.topColor,
    direction: round.direction,
    status,

  };
}
