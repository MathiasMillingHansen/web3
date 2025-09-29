import { PubSub } from 'graphql-subscriptions';
import { Round } from '../models/round';
import { Deck } from '../models/deck';
import { Player } from '../models/player';
import { standardShuffler } from '../utils/random_utils';

const pubsub = new PubSub();

// In-memory game storage (replace with database in production)
const games = new Map<string, Round>();
let gameIdCounter = 1;

export const resolvers = {
  Query: {
    game: (_: any, { id, playerId }: { id: string; playerId?: string }) => {
      const game = games.get(id);
      if (!game) throw new Error('Game not found');
      return formatGame(id, game, playerId);
    },
    
    games: () => {
      return Array.from(games.entries()).map(([id, game]) => formatGame(id, game, undefined));
    },

    playerHand: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');
      
      const playerIndex = parseInt(playerId);
      if (playerIndex < 0 || playerIndex >= game.players.length) {
        throw new Error('Player not found');
      }
      
      const hand = game.playerHand(playerIndex);
      return hand.getCards().map(formatCard);
    },
  },

  Mutation: {
    createGame: (_: any, { playerNames }: { playerNames: string[] }) => {
      const gameId = (gameIdCounter++).toString();
      const round = new Round();
      const deck = new Deck();
      deck.shuffle(standardShuffler);
      
      round.setup(playerNames, deck, 7);
      games.set(gameId, round);
      
      const gameData = formatGame(gameId, round, undefined);
      pubsub.publish('GAME_UPDATED', { gameUpdated: gameData });
      
      return gameData;
    },

    joinGame: (_: any, { gameId, playerName }: { gameId: string; playerName: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');
      
      // Add logic to join existing game if needed
      // For now, return current game state
      const gameData = formatGame(gameId, game, undefined);
      pubsub.publish('GAME_UPDATED', { gameUpdated: gameData });
      
      return gameData;
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
      if (playerIndex !== game.currentPlayer) {
        throw new Error('Not your turn');
      }
      
      const success = game.play(cardIndex, color);
      if (!success) throw new Error('Invalid move');
      
      const gameData = formatGame(gameId, game, undefined);
      pubsub.publish('GAME_UPDATED', { gameUpdated: gameData });
      
      return gameData;
    },

    drawCard: (_: any, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');
      
      const playerIndex = parseInt(playerId);
      if (playerIndex !== game.currentPlayer) {
        throw new Error('Not your turn');
      }
      
      const drawnCard = game.drawCard();
      if (!drawnCard) throw new Error('No more cards to draw');
      
      // Skip to next player after drawing
      game.nextPlayer();
      
      const gameData = formatGame(gameId, game, undefined);
      pubsub.publish('GAME_UPDATED', { gameUpdated: gameData });
      
      return gameData;
    },
  },

  Subscription: {
    gameUpdated: {
      subscribe: (_: any, { gameId }: { gameId: string }) => {
        return pubsub.asyncIterator(['GAME_UPDATED']);
      },
    },
  },
};

function formatGame(id: string, round: Round, requestingPlayerId?: string) {
  return {
    id,
    players: round.players.map((name: string, index: number) => ({
      id: index.toString(),
      name,
      isBot: false, // You might want to track this in Round
      handSize: round.playerHand(index).size,
      // Only include cards if this is the requesting player
      cards: requestingPlayerId && requestingPlayerId === index.toString() 
        ? round.playerHand(index).getCards().map(formatCard)
        : []
    })),
    currentPlayer: round.currentPlayer,
    topCard: round.discardPile.length > 0 ? formatCard(round.discardPile[round.discardPile.length - 1]) : null,
    direction: round.direction,
    status: 'PLAYING', // Add game status logic
  };
}

function formatCard(card: any) {
  return {
    id: `${card.type}_${card.color || 'none'}_${card.number || 0}`,
    type: card.type,
    color: card.color || null,
    number: card.number || null,
  };
}
