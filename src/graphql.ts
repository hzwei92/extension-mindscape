
import { createClient, ClientOptions, Client } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { DEV_SERVER_URI, DEV_WS_SERVER_URI } from '~constants';
import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist';
import { localStorage } from 'redux-persist-webextension-storage';

interface RestartableClient extends Client {
  restart(): void;
}

function createRestartableClient(options: ClientOptions): RestartableClient {
  let restartRequested = false;
  let restart = () => {
    restartRequested = true;
  };

  const client = createClient({
    ...options,
    on: {
      ...options.on,
      opened: (socket: any) => {
        options.on?.opened?.(socket);

        restart = () => {
          if (socket.readyState === WebSocket.OPEN) {
            // if the socket is still open for the restart, do the restart
            socket.close(4205, 'Client Restart');
          } else {
            // otherwise the socket might've closed, indicate that you want
            // a restart on the next opened event
            restartRequested = true;
          }
        }

        // just in case you were eager to restart
        if (restartRequested) {
          restartRequested = false;
          restart();
        }
      },
    },
  });

  return {
    ...client,
    restart: () => restart(),
  };
}
const wsClient = createRestartableClient({
  url: process.env.NODE_ENV === 'production'
    ? window.location.origin.replace(/^http/, 'ws') + '/graphql'
    : `${DEV_WS_SERVER_URI}/graphql`,
  connectionParams: () => {
    const cookies = document.cookie.split('; ');
    let authCookie;
    cookies.some(cookie => {
      authCookie = cookie.match(/^Authentication=.*$/);
      return !!authCookie;
    });
    if (authCookie && authCookie[0]) {
      return {
        Authentication: (authCookie[0] as string).split('=')[1]
      };
    }
    return {};
  },
});

const wsLink = new GraphQLWsLink(wsClient);

const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production'
    ? '/graphql'
    : `${DEV_SERVER_URI}/graphql`,
  credentials: process.env.NODE_ENV === 'production'
    ? 'same-origin'
    : 'include'
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink,
);


export const getClient = async () => {
  const cache = new InMemoryCache({
    typePolicies: {
      Arrow: {
        merge: true,
      },
      Twig: {
        merge: true,
      },
      User: {
        merge: true,
      },
    }
  })
  
  const persistor = new CachePersistor({
    cache,
    storage: new LocalStorageWrapper(localStorage),
    debug: false,
    key: 'apollo-cache-persist',
    debounce: 0,
  });
  
  await persistor.restore();

  const client = new ApolloClient({
    link: splitLink,
    cache
  });
  return { client, persistor };
}