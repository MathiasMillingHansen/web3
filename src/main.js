import { createApp, provide, h } from 'vue';
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import App from './App.vue';
import router from './router';

const hostname = window.location.hostname;

const httpLink = createHttpLink({
  uri: `http://${hostname}:4000/graphql`,
});

const wsLink = new GraphQLWsLink(createClient({
  url: `ws://${hostname}:4000/graphql`,
}));

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
  render: () => h(App),
});

app.use(router);
app.mount('#app');