import { ApolloServer } from 'apollo-server';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Add authentication, user context here
      return { req };
    },
    introspection: true,
  });

  const { url } = await server.listen({ port: process.env.PORT || 4000 });
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🎮 GraphQL Playground available at ${url}`);
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});