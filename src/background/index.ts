import type { NormalizedCacheObject } from "@apollo/client"
import type { ApolloClient } from "@apollo/client"
import type { CachePersistor } from "apollo3-cache-persist"
import { v4 } from "uuid"
import { AlarmType, ALARM_DELIMITER, MessageName, PORT_NAME } from "~constants"
import { getCurrentUser, initUser, refreshToken } from "~features/auth/auth"
import { selectAuthIsDone, selectTokenIsInit, selectTokenIsValid, setAuthIsDone, setSessionId, setTokenIsInit } from "~features/auth/authSlice"
import { getTwigByTabId } from "~features/tab/tab"
import { createGroup } from "~features/tab/createGroup"
import { createTab } from "~features/tab/createTab"
import { createWindow } from "~features/tab/createWindow"
import { handleAlarm } from "~background/handleAlarm"
import { maintainSubtree } from "~features/tab/maintainSubtree"
import { moveTab } from "~features/tab/moveTab"
import { orderAndGroupTabs } from "~features/tab/orderAndGroupTabs"
import { removeGroup } from "~features/tab/removeGroup"
import { removeTab } from "~features/tab/removeTab"
import { removeWindow } from "~features/tab/removeWindow"
import { updateTab } from "~features/tab/updateTab"
import { SpaceType } from "~features/space/space"
import { getTwigs } from "~features/twigs/getTwigs"
import { loadTwigTree } from "~features/space/loadTwigTree"
import { addTwigs, selectIdToTwig } from "~features/twigs/twigSlice"
import type { User } from "~features/user/user"
import { getClient } from "~graphql"
import { persistor, store } from "~store"
import type { IdToType } from "~types"
import { syncBookmarks } from "~features/bookmarks/syncBookmarks"
import { createBookmark } from "~features/bookmarks/createBookmark"
import { removeBookmark } from "~features/bookmarks/removeBookmark"
import { moveBookmark } from "~features/bookmarks/moveBookmark"
import { changeBookmark } from "~features/bookmarks/changeBookmark"
import { syncBrowserState } from "./syncBrowserState"
import { selectCurrentUser, setCurrentUser } from "~features/user/userSlice"
import { selectShouldReloadTwigTree } from "~features/space/spaceSlice"

let client: ApolloClient<NormalizedCacheObject>;
let cachePersistor: CachePersistor<NormalizedCacheObject>;
let shouldSync = false;
const tabIdToMoveBlocked: IdToType<number> = {};
let newIdToTwig = {};

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

  chrome.alarms.onAlarm.addListener(handleAlarm(store, persistor)(client, cachePersistor)(tabIdToMoveBlocked, newIdToTwig));

  // manage tabs
  chrome.tabs.onCreated.addListener(async tab => {
    console.log('tab created', tab.id);
    await createTab(store, persistor)(client, cachePersistor)(tab, newIdToTwig)
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('tab updated', tabId, changeInfo)

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
      updateTab(tab)
    }
  });
  chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    console.log('tab moved', tabId, moveInfo);

    if (tabIdToMoveBlocked[tabId]) {
      delete tabIdToMoveBlocked[tabId];
      return;
    }
    const tab = await chrome.tabs.get(tabId);
    const tabTwig = await getTwigByTabId(store)(tabId);

    if (tabTwig?.groupId && tabTwig.groupId === tab.groupId) {
      maintainSubtree(client)(tabIdToMoveBlocked)(tabId);
      moveTab(client, cachePersistor)(tab);
    }
  });
  chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    console.log('tab attached', tabId, attachInfo);
  });
  chrome.tabs.onRemoved.addListener(removeTab(client));

  chrome.tabGroups.onCreated.addListener((group) => {
    console.log('group created', group.id)
    createGroup(store, persistor)(client, cachePersistor)(group, newIdToTwig);
  });
  chrome.tabGroups.onUpdated.addListener(group => {
    //console.log('group updated', group);
  });
  chrome.tabGroups.onRemoved.addListener(removeGroup(client));

  chrome.windows.onCreated.addListener(window => {
    console.log('window created', window);
    const state = store.getState();

    const user: User = selectCurrentUser(state);

    createWindow(client, cachePersistor)(window, user.frame.rootTwigId, newIdToTwig);
  });
  chrome.windows.onRemoved.addListener(removeWindow(client));

  // manage bookmarks
  chrome.bookmarks.onCreated.addListener(createBookmark(client, cachePersistor));
  chrome.bookmarks.onChildrenReordered.addListener((id, reorderInfo) => {
    console.log('bookmarks reordered', id, reorderInfo);
  })
  chrome.bookmarks.onImportEnded.addListener(() => {
    const state = store.getState();

    const user = selectCurrentUser(state);

    syncBookmarks(client, cachePersistor)(user.frame.rootTwigId)
  })
  chrome.bookmarks.onChanged.addListener(changeBookmark(client, cachePersistor));
  chrome.bookmarks.onMoved.addListener(moveBookmark(client, cachePersistor));
  chrome.bookmarks.onRemoved.addListener(removeBookmark(client, cachePersistor));

  persistor.subscribe(async () => {  
    const state = store.getState();
  
    const authIsDone = selectAuthIsDone(state);
    if (authIsDone) {
      if (shouldSync) {
        shouldSync = false;

        const user = selectCurrentUser(state);

        const tabTrees = await orderAndGroupTabs();

        await syncBrowserState(client, cachePersistor)(user.frame.rootTwigId, tabTrees);
      }
      const shouldReloadTwigTree = selectShouldReloadTwigTree(SpaceType.FRAME)(state);
      if (shouldReloadTwigTree) {
        loadTwigTree(client);
      }
      if (Object.keys(newIdToTwig).length) {
        const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
        const twigs = Object.keys(newIdToTwig).reduce((acc, twigId) => {
          if (!idToTwig[twigId]) {
            acc.push(newIdToTwig[twigId]);
          }
          return acc;
        }, []);
        if (twigs.length) {
          store.dispatch(addTwigs({
            space: SpaceType.FRAME,
            twigs,
          }));
        }
        newIdToTwig = {};
      }
    }
    else {
      const user: User = selectCurrentUser(state);
      if (user) {
        await getTwigs(client)(user);
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
            shouldSync = true;
          }
        }
      }
    }
  })

  store.dispatch(setTokenIsInit(false))
  store.dispatch(setAuthIsDone(false));
  store.dispatch(setCurrentUser(null));

  refreshToken(client);
})