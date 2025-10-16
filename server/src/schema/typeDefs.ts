import { gql } from 'apollo-server';

export const typeDefs = gql`
  type Player {
    id: ID!
    name: String!
    handSize: Int!
    cards: [Card!]  # Only visible to the player themselves
    hasDeclaredUno: Boolean
  }

  type Card {
    type: String!
    color: String
    number: Int
  }

  type Game {
    id: ID!
    players: [Player!]!
    currentPlayer: Int!
    topCard: Card
    topColor: String
    direction: Int!
    status: String!
  }

  type GameResponse {
    id: ID!
    playerId: ID
    status: Boolean
  }

  type Query {
    game(id: ID!, playerId: ID): Game
    games: [Game!]!
    playerHand(gameId: ID!, playerId: ID!): [Card!]!
  }

  type Mutation {
    createGame(playerNames: [String!]!): GameResponse!
    joinGame(gameId: ID!, playerName: String!): GameResponse!
    startGame(gameId: ID!): GameResponse!
    playCard(gameId: ID!, playerId: ID!, cardIndex: Int!, color: String): GameResponse!
    drawCard(gameId: ID!, playerId: ID!): GameResponse!
    declareUno(gameId: ID!, playerId: ID!): GameResponse!
    catchUno(gameId: ID!, playerId: ID!): GameResponse!
  }

  type Subscription {
    gameUpdated(gameId: ID!): Game!
  }
`;
