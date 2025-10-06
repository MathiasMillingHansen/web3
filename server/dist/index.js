"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const ws_1 = require("graphql-ws/lib/use/ws");
const ws_2 = require("ws");
const schema_1 = require("@graphql-tools/schema");
const typeDefs_1 = require("./schema/typeDefs");
const resolvers_1 = require("./schema/resolvers");
async function startServer() {
    const app = (0, express_1.default)();
    const httpServer = (0, http_1.createServer)(app);
    // Create executable schema
    const schema = (0, schema_1.makeExecutableSchema)({
        typeDefs: typeDefs_1.typeDefs,
        resolvers: resolvers_1.resolvers,
    });
    const server = new apollo_server_express_1.ApolloServer({
        schema,
        context: ({ req }) => {
            // Add authentication, user context here
            return { req };
        },
        introspection: true,
    });
    await server.start();
    server.applyMiddleware({ app: app });
    // Create WebSocket server for subscriptions
    const wsServer = new ws_2.WebSocketServer({
        server: httpServer,
        path: server.graphqlPath,
    });
    const serverCleanup = (0, ws_1.useServer)({
        schema,
        onConnect: () => {
            console.log('🔗 WebSocket connected for subscriptions');
        },
        onDisconnect: () => {
            console.log('🔌 WebSocket disconnected');
        },
    }, wsServer);
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
