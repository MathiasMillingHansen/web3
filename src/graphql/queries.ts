import { gql } from '@apollo/client/core';

export const CREATE_GAME = gql`
  mutation CreateGame($playerNames: [String!]!) {
    createGame(playerNames: $playerNames) {
      id
      players {
        id
        name
        isBot
        handSize
      }
      currentPlayer
      topCard {
        id
        type
        color
        number
      }
      direction
      status
    }
  }
`;

export const GET_GAME = gql`
  query GetGame($id: ID!, $playerId: ID) {
    game(id: $id, playerId: $playerId) {
      id
      players {
        id
        name
        isBot
        handSize
        cards {
          id
          type
          color
          number
        }
      }
      currentPlayer
      topCard {
        id
        type
        color
        number
      }
      direction
      status
    }
  }
`;

export const GET_PLAYER_HAND = gql`
  query GetPlayerHand($gameId: ID!, $playerId: ID!) {
    playerHand(gameId: $gameId, playerId: $playerId) {
      id
      type
      color
      number
    }
  }
`;

export const PLAY_CARD = gql`
  mutation PlayCard($gameId: ID!, $playerId: ID!, $cardIndex: Int!, $color: String) {
    playCard(gameId: $gameId, playerId: $playerId, cardIndex: $cardIndex, color: $color) {
      id
      players {
        id
        name
        isBot
        handSize
      }
      currentPlayer
      topCard {
        id
        type
        color
        number
      }
      direction
      status
    }
  }
`;

export const DRAW_CARD = gql`
  mutation DrawCard($gameId: ID!, $playerId: ID!) {
    drawCard(gameId: $gameId, playerId: $playerId) {
      id
      players {
        id
        name
        isBot
        handSize
      }
      currentPlayer
      topCard {
        id
        type
        color
        number
      }
      direction
      status
    }
  }
`;

export const GAME_UPDATED = gql`
  subscription GameUpdated($gameId: ID!) {
    gameUpdated(gameId: $gameId) {
      id
      players {
        id
        name
        isBot
        handSize
      }
      currentPlayer
      topCard {
        id
        type
        color
        number
      }
      direction
      status
    }
  }
`;