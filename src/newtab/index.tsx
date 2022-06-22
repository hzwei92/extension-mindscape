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
import type { CachePersistor } from 'apollo3-cache-persist';
import { setShouldReloadTwigTree } from '~features/twigs/twigSlice';
import { SpaceType } from '~features/space/space';

function IndexNewtab() {
  const [client, setClient] = useState(null as ApolloClient<NormalizedCacheObject> | null);
  const [cachePersistor, setCachePersistor] = useState(null as CachePersistor<NormalizedCacheObject> | null)
  const [port, setPort] = useState(null as chrome.runtime.Port | null);
  
  useEffect(() => {
    const handleConnect = port => {
      setPort(port);
      port.onMessage.addListener(async message => {
        if (message.name === MessageName.RESTORE_CACHE) {
          await cachePersistor.restore();
          console.log('restored', cachePersistor)
        }
      })
    }
    chrome.runtime.onConnect.addListener(handleConnect);
    return () => {
      chrome.runtime.onConnect.removeListener(handleConnect)
    }
  }, [cachePersistor]);
  

  useEffect(() => {
    loadClient();
    persistor.resync();
    store.dispatch(setShouldReloadTwigTree({
      space: SpaceType.FRAME,
      shouldReloadTwigTree: true,
    }))
    console.log('persistor', persistor)
  }, []);


  const loadClient = async () => {
    const { client, persistor } = await getClient();
    setClient(client);
    setCachePersistor(persistor);
  }
  

  if (!client) return null;
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApolloProvider client={client}>
          <App port={port} cachePersistor={cachePersistor}/>
        </ApolloProvider>
      </PersistGate>
    </Provider>
  )
}

export default IndexNewtab