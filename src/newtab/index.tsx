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
import { ErrMessage, MessageName } from '~constants';
import type { CachePersistor } from 'apollo3-cache-persist';
import { setShouldReloadTwigTree } from '~features/twigs/twigSlice';
import { SpaceType } from '~features/space/space';

function IndexNewtab() {
  const [client, setClient] = useState(null as ApolloClient<NormalizedCacheObject> | null);
  const [cachePersistor, setCachePersistor] = useState(null as CachePersistor<NormalizedCacheObject> | null)
  const [tabId, setTabId] = useState(-1);

  useEffect(() => {
    persistor.resync();

    loadClient();

    store.dispatch(setShouldReloadTwigTree({
      space: SpaceType.FRAME,
      shouldReloadTwigTree: true,
    }))
    try {
      chrome.runtime.sendMessage({
        name: MessageName.GET_TAB_ID
      }, response => {
        setTabId(response.tabId);
      });
    } catch (err) {
      if (err === ErrMessage.NO_RECEIVER) {
        console.log('no receiever')
      }
    }
  }, []);

  useEffect(() => {
    if (!cachePersistor) return;

    const handleConnect = port => {
      port.onMessage.addListener(message => {
        if (message.name === MessageName.RESTORE_CACHE) {
          cachePersistor.restore();
        }
      })
    }
    
    chrome.runtime.onConnect.addListener(handleConnect);

    return () => {
      chrome.runtime.onConnect.removeListener(handleConnect)
    }
  }, [cachePersistor]);


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
          <App cachePersistor={cachePersistor} tabId={tabId} />
        </ApolloProvider>
      </PersistGate>
    </Provider>
  )
}

export default IndexNewtab