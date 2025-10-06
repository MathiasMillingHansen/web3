"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const round_1 = require("../models/round");
const deck_1 = require("../models/deck");
const hand_1 = require("../models/hand");
const random_utils_1 = require("../utils/random_utils");
const pubsub = new graphql_subscriptions_1.PubSub();
// In-memory game storage (replace with database in production)
const games = new Map();
let gameIdCounter = 1;
exports.resolvers = {
    Query: {
        game: (_, { id, playerId }) => {
            const game = games.get(id);
            if (!game)
                throw new Error('Game not found');
            return formatGame(id, game, playerId);
        },
        games: () => {
            return Array.from(games.entries()).map(([id, game]) => formatGame(id, game, undefined));
        },
        playerHand: (_, { gameId, playerId }) => {
            const game = games.get(gameId);
            if (!game)
                throw new Error('Game not found');
            const playerIndex = parseInt(playerId);
            if (playerIndex < 0 || playerIndex >= game.players.length) {
                throw new Error('Player not found');
            }
            const hand = game.playerHand(playerIndex);
            return hand.getCards().map(formatCard);
        },
    },
    Mutation: {
        createGame: (_, { playerNames }) => {
            const gameId = (gameIdCounter++).toString();
            const round = new round_1.Round();
            // For single player games, just set up the lobby structure without dealing cards
            if (playerNames.length === 1) {
                round.initializeLobby(playerNames);
            }
            else {
                // Multi-player setup - full game initialization
                const deck = new deck_1.Deck();
                deck.shuffle(random_utils_1.standardShuffler);
                round.setup(playerNames, deck, 7);
            }
            games.set(gameId, round);
            const gameData = formatGame(gameId, round, undefined);
            pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: gameData });
            return gameData;
        },
        joinGame: (_, { gameId, playerName }) => {
            const game = games.get(gameId);
            if (!game)
                throw new Error('Game not found');
            // Check if game is full (max 5 players)
            if (game.players.length >= 5) {
                throw new Error('Game is full');
            }
            // Check if player name already exists
            if (game.players.includes(playerName)) {
                throw new Error('Player name already exists in this game');
            }
            // Add the new player to the lobby
            game.players.push(playerName);
            game.hands.push(new hand_1.Hand());
            // Don't auto-start the game - wait for host to call startGame mutation
            // If game has already started, deal cards to new player
            if (game.discardPile.length > 0) {
                // Game already started, deal cards to new player
                const cardsPerPlayer = 7; // Standard hand size
                for (let i = 0; i < cardsPerPlayer; i++) {
                    const card = game.deck.deal();
                    if (card)
                        game.hands[game.hands.length - 1].add(card);
                }
            }
            console.log(`Player ${playerName} joined game ${gameId}. Now ${game.players.length} players.`);
            const gameData = formatGame(gameId, game, undefined);
            pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: gameData });
            return gameData;
        },
        startGame: (_, { gameId }) => {
            const game = games.get(gameId);
            if (!game)
                throw new Error('Game not found');
            // Check if game has minimum players
            if (game.players.length < 2) {
                throw new Error('Need at least 2 players to start the game');
            }
            // If game hasn't been initialized yet (lobby state), initialize it now
            if (game.discardPile.length === 0) {
                console.log(`Host starting game ${gameId} with ${game.players.length} players`);
                const deck = new deck_1.Deck();
                deck.shuffle(random_utils_1.standardShuffler);
                game.setup(game.players, deck, 7);
            }
            const gameData = formatGame(gameId, game, undefined);
            console.log('Publishing game update:', {
                gameId,
                status: gameData.status,
                players: gameData.players.length
            });
            pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: gameData });
            return gameData;
        },
        playCard: (_, { gameId, playerId, cardIndex, color }) => {
            const game = games.get(gameId);
            if (!game)
                throw new Error('Game not found');
            const playerIndex = parseInt(playerId);
            console.log('PlayCard attempt:', {
                gameId,
                requestedPlayerId: playerId,
                playerIndex,
                currentPlayer: game.currentPlayer,
                cardIndex,
                totalPlayers: game.players.length
            });
            if (playerIndex !== game.currentPlayer) {
                throw new Error(`Not your turn. Current player is ${game.currentPlayer}, you are ${playerIndex}`);
            }
            const success = game.play(cardIndex, color);
            if (!success)
                throw new Error('Invalid move');
            const gameData = formatGame(gameId, game, undefined);
            pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: gameData });
            return gameData;
        },
        drawCard: (_, { gameId, playerId }) => {
            const game = games.get(gameId);
            if (!game)
                throw new Error('Game not found');
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
            if (!drawnCard)
                throw new Error('No more cards to draw');
            // Skip to next player after drawing
            game.nextPlayer();
            const gameData = formatGame(gameId, game, undefined);
            pubsub.publish(`GAME_UPDATED_${gameId}`, { gameUpdated: gameData });
            return gameData;
        },
    },
    Subscription: {
        gameUpdated: {
            subscribe: (_, { gameId }) => {
                return pubsub.asyncIterator([`GAME_UPDATED_${gameId}`]);
            },
        },
    },
};
function formatGame(id, round, requestingPlayerId) {
    // Determine game status based on game state
    let status = 'LOBBY';
    if (round.discardPile.length > 0) {
        status = 'PLAYING';
    }
    return {
        id,
        players: round.players.map((name, index) => ({
            id: index.toString(),
            name,
            handSize: round.hands[index] ? round.hands[index].size : 0,
            // Only include cards if this is the requesting player
            cards: requestingPlayerId && requestingPlayerId === index.toString() && round.hands[index]
                ? round.hands[index].getCards().map(formatCard)
                : []
        })),
        currentPlayer: round.currentPlayer,
        topCard: round.discardPile.length > 0 ? formatCard(round.discardPile[round.discardPile.length - 1]) : null,
        direction: round.direction,
        status,
    };
}
function formatCard(card) {
    // For wild cards that have been played, use the chosen color
    const displayColor = (card.type === 'WILD' || card.type === 'WILD DRAW') && card.chosenColor
        ? card.chosenColor
        : card.color || null;
    return {
        id: `${card.type}_${card.color || card.chosenColor || 'none'}_${card.number || 0}`,
        type: card.type,
        color: displayColor,
        number: card.number || null,
        chosenColor: card.chosenColor || null, // Include chosen color for debugging/reference
    };
}
