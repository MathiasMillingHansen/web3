import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import express, { Application } from 'express';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';

async function startServer() {
  const app: Application = express();
  const httpServer = createServer(app);
  
  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      // Add authentication, user context here
      return { req };
    },
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app: app as any });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: server.graphqlPath,
  });

  const serverCleanup = useServer(
    {
      schema,
      onConnect: () => {
        console.log('🔗 WebSocket connected for subscriptions');
      },
      onDisconnect: () => {
        console.log('🔌 WebSocket disconnected');
      },
    },
    wsServer
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔗 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });

  // Cleanup
  process.on('SIGTERM', () => {
    serverCleanup.dispose();
  });
}

startServer().catch(error => {
  console.error('Error starting server:', error);
});