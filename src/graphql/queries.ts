import { gql } from '@apollo/client/core';

export const CREATE_GAME = gql`
  mutation CreateGame($playerNames: [String!]!) {
    createGame(playerNames: $playerNames) {
      id
    }
  }
`;

export const JOIN_GAME = gql`
  mutation JoinGame($gameId: ID!, $playerName: String!) {
    joinGame(gameId: $gameId, playerName: $playerName) {
      id
      playerId
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
        handSize
        hasDeclaredUno
        cards {
          type
          color
          number
        }
      }
      currentPlayer
      topCard {
        type
        color
        number
      }
      topColor
      direction
      status
    }
  }
`;

export const PLAY_CARD = gql`
  mutation PlayCard($gameId: ID!, $playerId: ID!, $cardIndex: Int!, $color: String) {
    playCard(gameId: $gameId, playerId: $playerId, cardIndex: $cardIndex, color: $color) {
      status
    }
  }
`;

export const DRAW_CARD = gql`
  mutation DrawCard($gameId: ID!, $playerId: ID!) {
    drawCard(gameId: $gameId, playerId: $playerId) {
      status
    }
  }
`;

export const START_GAME = gql`
  mutation StartGame($gameId: ID!) {
    startGame(gameId: $gameId) {
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
        handSize
        hasDeclaredUno
        cards {
          type
          color
          number
        }
      }
      currentPlayer
      topCard {
        type
        color
        number
      }
      topColor
      direction
      status
    }
  }
`;

export const DECLARE_UNO = gql`
  mutation DeclareUno($gameId: ID!, $playerId: ID!) {
    declareUno(gameId: $gameId, playerId: $playerId) {
      id
      status
    }
  }
`;

export const CATCH_UNO = gql`
  mutation CatchUno($gameId: ID!, $playerId: ID!) {
    catchUno(gameId: $gameId, playerId: $playerId) {
      id
      status
    }
  }
`;
