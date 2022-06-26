import type { NormalizedCacheObject } from "@apollo/client"
import type { ApolloClient } from "@apollo/client"
import type { CachePersistor } from "apollo3-cache-persist"
import { v4 } from "uuid"
import { AlarmType, ALARM_DELIMITER, MessageName, PORT_NAME } from "~constants"
import { getCurrentUser, initUser, refreshToken } from "~features/auth/auth"
import { selectAuthIsDone, selectTokenIsInit, selectTokenIsValid, setAuthIsDone, setSessionId, setTokenIsInit } from "~features/auth/authSlice"
import { getTwigByTabId } from "~features/chrome/chrome"
import { createGroup } from "~features/chrome/createGroup"
import { createTab } from "~features/chrome/createTab"
import { createWindow } from "~features/chrome/createWindow"
import { handleAlarm } from "~features/chrome/handleAlarm"
import { maintainSubtree } from "~features/chrome/maintainSubtree"
import { moveTab } from "~features/chrome/moveTab"
import { orderAndGroupTabs } from "~features/chrome/orderAndGroupTabs"
import { removeGroup } from "~features/chrome/removeGroup"
import { removeTab } from "~features/chrome/removeTab"
import { removeWindow } from "~features/chrome/removeWindow"
import { syncTabState } from "~features/chrome/syncTabState"
import { updateTab } from "~features/chrome/updateTab"
import { SpaceType } from "~features/space/space"
import { getTwigs } from "~features/twigs/getTwigs"
import { loadTwigTree } from "~features/twigs/loadTwigTree"
import { selectShouldReloadTwigTree } from "~features/twigs/twigSlice"
import type { User } from "~features/user/user"
import { FULL_USER_FIELDS } from "~features/user/userFragments"
import { selectUserId, setUserId } from "~features/user/userSlice"
import { getClient } from "~graphql"
import { persistor, RootState, store } from "~store"
import type { IdToType } from "~types"

let client: ApolloClient<NormalizedCacheObject>;
let cachePersistor: CachePersistor<NormalizedCacheObject>;
let shouldLoadTabs = false;
const tabIdToMoveBlocked: IdToType<number> = {};
let prevState: RootState;

chrome.runtime.onInstalled.addListener(async details => {
  console.log('installed', details);
  if (cachePersistor) {
    cachePersistor.remove();
  }
  ({ client, persistor: cachePersistor } = await getClient());

  store.dispatch(setSessionId(v4()));

  chrome.runtime.onConnect.addListener(port => {
    if (port.name === PORT_NAME) {
      port.onMessage.addListener(message => {
        if (message.name === MessageName.RESTORE_CACHE) {
          console.log('persist cache');
          cachePersistor.restore();
        }
      })
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.name === MessageName.GET_TAB_ID) {
      sendResponse({
        tabId: sender.tab.id
      });
    }
  });

  chrome.alarms.onAlarm.addListener(handleAlarm(store, persistor)(client, cachePersistor));

  chrome.tabs.onCreated.addListener(async tab => {
    console.log('tab created', tab);
    createTab(client)(tab)
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('tab updated', tabId, changeInfo, tab)

    if (changeInfo.groupId) {
      if (changeInfo.groupId === -1) {
        const name = AlarmType.NO_GROUP +
          ALARM_DELIMITER +
          tabId;
        chrome.alarms.create(name, {
          when: Date.now() + 10,
        });
      }
      else  {
        if (tabIdToMoveBlocked[tabId]) {
          delete tabIdToMoveBlocked[tabId];
          return;
        }
        maintainSubtree(client)(tabIdToMoveBlocked)(tabId);
        moveTab(client, cachePersistor)(tab)
      }
    }
    else if (changeInfo.url || changeInfo.title) {
      updateTab(client)(tab)
    }
  });

  chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    console.log('tab moved', tabId, moveInfo);
    if (tabIdToMoveBlocked[tabId]) {
      delete tabIdToMoveBlocked[tabId];
      return;
    }
    const tab = await chrome.tabs.get(tabId);
    const tabTwig = getTwigByTabId(client)(tabId);
    if (tabTwig?.groupId && tabTwig.groupId === tab.groupId) {
      maintainSubtree(client)(tabIdToMoveBlocked)(tabId);
      moveTab(client, cachePersistor)(tab);
    }
  });

  chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    console.log('tab attached', tabId, attachInfo);
  });

  chrome.tabs.onRemoved.addListener(removeTab(client));

  chrome.tabGroups.onCreated.addListener(createGroup(client, cachePersistor));

  chrome.tabGroups.onUpdated.addListener(group => {
    console.log('group updated', group);
  });

  chrome.tabGroups.onRemoved.addListener(removeGroup(client));


  chrome.windows.onCreated.addListener(window => {
    console.log('window created', window);
    const state = store.getState();

    const userId = selectUserId(state);
    
    const user = client.cache.readFragment({
      id: client.cache.identify({
        id: userId,
        __typename: 'User',
      }),
      fragment: FULL_USER_FIELDS,
      fragmentName: 'FullUserFields'
    }) as User;

    createWindow(client)(window, user.frame.rootTwigId);
  });

  chrome.windows.onRemoved.addListener(removeWindow(client));


  persistor.subscribe(async () => {  
    const state = store.getState();
  
    const authIsDone = selectAuthIsDone(state);
    if (authIsDone) {
      if (shouldLoadTabs) {
        shouldLoadTabs = false;
        const userId = selectUserId(state);

        const user = client.cache.readFragment({
          id: client.cache.identify({
            id: userId,
            __typename: 'User',
          }),
          fragment: FULL_USER_FIELDS,
          fragmentName: 'FullUserFields'
        }) as User;

        const tabTrees = await orderAndGroupTabs();

        await syncTabState(client, cachePersistor)(user.frame.rootTwigId, tabTrees);
      }
      const shouldReloadTwigTree = selectShouldReloadTwigTree(SpaceType.FRAME)(state);
      if (shouldReloadTwigTree) {
        loadTwigTree(client);
      }
    }
    else {
      const userId = selectUserId(state);
      if (userId) {
        await getTwigs(client)(userId);
        await cachePersistor.persist();
        store.dispatch(setAuthIsDone(true));
      }
      else {
        const tokenIsInit = selectTokenIsInit(state);
        const tokenIsValid = selectTokenIsValid(state);
        if (tokenIsInit) {
          if (tokenIsValid) {
            await getCurrentUser(client);
            await cachePersistor.persist();
          }
          else {
            await initUser(client);
            await cachePersistor.persist();
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