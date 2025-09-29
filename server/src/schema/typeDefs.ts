import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Player {
    id: ID!
    name: String!
    isBot: Boolean!
    handSize: Int!
    cards: [Card!]  # Only visible to the player themselves
  }

  type Card {
    id: ID!
    type: String!
    color: String
    number: Int
  }

  type Game {
    id: ID!
    players: [Player!]!
    currentPlayer: Int!
    topCard: Card
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
    playCard(gameId: ID!, playerId: ID!, cardIndex: Int!, color: String): Game!
    drawCard(gameId: ID!, playerId: ID!): Game!
  }

  type Subscription {
    gameUpdated(gameId: ID!): Game!
  }
`;