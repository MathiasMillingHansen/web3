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
    id: ID!
    type: String!
    color: String
    number: Int
    chosenColor: String
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

  type Query {
    game(id: ID!, playerId: ID): Game
    games: [Game!]!
    playerHand(gameId: ID!, playerId: ID!): [Card!]!
  }

  type Mutation {
    createGame(playerNames: [String!]!): Game!
    joinGame(gameId: ID!, playerName: String!): Game!
    startGame(gameId: ID!): Game!
    playCard(gameId: ID!, playerId: ID!, cardIndex: Int!, color: String): Game!
    drawCard(gameId: ID!, playerId: ID!): Game!
    declareUno(gameId: ID!, playerId: ID!): Game!
    catchUno(gameId: ID!, playerId: ID!): Game!
  }

  type Subscription {
    gameUpdated(gameId: ID!): Game!
  }
`;
