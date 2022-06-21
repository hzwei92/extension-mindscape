import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Provider } from 'react-redux';
import { persistor, store } from '~store';
import { getClient } from '~graphql';
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import App from './App';
import { PersistGate } from '@plasmohq/redux-persist/integration/react';
//import './index.css';
import { useEffect, useState } from 'react';
import { MessageName } from '~constants';

function IndexNewtab() {
  const [client, setClient] = useState(null as ApolloClient<NormalizedCacheObject> | null)
  const [port, setPort] = useState(null as chrome.runtime.Port | null);
  
  useEffect(() => {
    const handleConnect = port => {
      setPort(port);
      port.onMessage.addListener(message => {
        if (message.name === MessageName.RELOAD_CLIENT) {
          loadClient();
        }
      })
    }
    chrome.runtime.onConnect.addListener(handleConnect);
    return () => {
      chrome.runtime.onConnect.removeListener(handleConnect)
    }
  }, []);
  

  useEffect(() => {
    loadClient();
  }, []);


  const loadClient = async () => {
    const { client } = await getClient();
    setClient(client);
  }
  

  if (!client) return null;
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApolloProvider client={client}>
          <App port={port} />
        </ApolloProvider>
      </PersistGate>
    </Provider>
  )
}

export default IndexNewtab