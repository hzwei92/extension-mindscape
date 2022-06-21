import type { NormalizedCacheObject } from "@apollo/client"
import type { ApolloClient } from "@apollo/client"
import { Storage } from "@plasmohq/storage"
import type { CachePersistor } from "apollo3-cache-persist"
import { v4 } from "uuid"
import { AlarmType, MessageName, PORT_NAME } from "~constants"
import { getCurrentUser, initUser, refreshToken } from "~features/auth/auth"
import { selectAuthIsDone, selectTokenIsInit, selectTokenIsValid, setAuthIsDone, setSessionId, setTokenIsInit } from "~features/auth/authSlice"
import { decrement, increment } from "~features/counter/counterSlice"
import { loadTabs, removeGroup, removeTab, removeWindow } from "~features/tab/tab"
import { getTwigs } from "~features/twigs/twig"
import { selectUserId, setUserId } from "~features/user/userSlice"
import { getClient } from "~graphql"
import { persistor, RootState, store } from "~store"

let client: ApolloClient<NormalizedCacheObject>;
let cachePersistor: CachePersistor<NormalizedCacheObject>;
let shouldLoadTabs = false;
let prevState: RootState;


chrome.runtime.onInstalled.addListener(async details => {
  console.log('installed', details);
  if (cachePersistor) {
    cachePersistor.remove();
  }
  ({ client, persistor: cachePersistor } = await getClient());

  store.dispatch(setSessionId(v4()));

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === AlarmType.REFRESH_TOKEN) {
      refreshToken(client);
      return;
    }
  })

  chrome.tabs.onCreated.addListener(async tab => {
    console.log('tab created', tab);
    try {
      if (tab.groupId === -1) {
        if (tab.openerTabId) {
          const opener = await chrome.tabs.get(tab.openerTabId);
          await chrome.tabs.move(tab.id, {
            index: opener.index + 1,
          })
          await chrome.tabs.group({
            tabIds: [tab.id],
            groupId: opener.groupId,
          })
        }
        else {
          await chrome.tabs.group({
            tabIds: [tab.id],
            createProperties: {
              windowId: tab.windowId,
            },
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('tab updated', tabId, changeInfo, tab)
  });

  chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    console.log('tab moved', tabId, moveInfo);
  })

  chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    console.log('tab attached', tabId, attachInfo);
  })
  chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    console.log('tab removed', tabId, removeInfo);
    removeTab(client)(tabId);
  })

  chrome.tabGroups.onCreated.addListener(async group => {
    console.log('group created', group);
  });

  chrome.tabGroups.onUpdated.addListener(async group => {
    console.log('group updated', group);
  })

  chrome.tabGroups.onRemoved.addListener(async group => {
    console.log('group removed', group);
    removeGroup(client)(group.id)
  })


  chrome.windows.onCreated.addListener(async window => {
    console.log('window created', window);
  })
  chrome.windows.onRemoved.addListener(async windowId => {
    console.log('window removed', windowId);
    removeWindow(client)(windowId);
  })


  persistor.subscribe(async () => {  
    const state = store.getState();
  
    const authIsDone = selectAuthIsDone(state);
    if (authIsDone) {
      if (shouldLoadTabs) {
        loadTabs(client);
        shouldLoadTabs = false;
      }
    }
    else {
      const userId = selectUserId(state);
      if (userId) {
        getTwigs(client)(userId);
        store.dispatch(setAuthIsDone(true));
      }
      else {
        const tokenIsInit = selectTokenIsInit(state);
        const tokenIsValid = selectTokenIsValid(state);
        if (tokenIsInit) {
          if (tokenIsValid) {
            getCurrentUser(client);
          }
          else {
            initUser(client);
            shouldLoadTabs = true;
          }
        }
      }
    }
  
    prevState = state;
  })

  store.dispatch(setTokenIsInit(false))
  store.dispatch(setAuthIsDone(false));
  store.dispatch(setUserId(''));

  refreshToken(client);
})