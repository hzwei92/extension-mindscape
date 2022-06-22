import type { NormalizedCacheObject } from "@apollo/client"
import type { ApolloClient } from "@apollo/client"
import { Storage } from "@plasmohq/storage"
import type { CachePersistor } from "apollo3-cache-persist"
import { v4 } from "uuid"
import { AlarmType, ALARM_DELIMITER, ErrMessage, MessageName, PORT_NAME } from "~constants"
import type { Arrow } from "~features/arrow/arrow"
import { ARROW_FIELDS } from "~features/arrow/arrowFragments"
import { getCurrentUser, initUser, refreshToken } from "~features/auth/auth"
import { selectAuthIsDone, selectTokenIsInit, selectTokenIsValid, setAuthIsDone, setSessionId, setTokenIsInit } from "~features/auth/authSlice"
import { decrement, increment } from "~features/counter/counterSlice"
import { SpaceType } from "~features/space/space"
import { createGroup, createTab, GroupEntry, loadTabs, maintainSubtree, moveTab, removeGroup, removeTab, removeWindow, TabEntry, updateTab, WindowEntry } from "~features/tab/tab"
import { getTwigs, loadTwigTree, Twig } from "~features/twigs/twig"
import { TWIG_FIELDS } from "~features/twigs/twigFragments"
import { selectGroupIdToTwigIdToTrue, selectShouldReloadTwigTree, selectTabIdToTwigIdToTrue, selectWindowIdToTwigIdToTrue } from "~features/twigs/twigSlice"
import { selectUserId, setUserId } from "~features/user/userSlice"
import { getClient } from "~graphql"
import { persistor, RootState, store } from "~store"
import type { IdToType } from "~types"

let client: ApolloClient<NormalizedCacheObject>;
let cachePersistor: CachePersistor<NormalizedCacheObject>;
let shouldLoadTabs = false;
const tabIdToCreateBlocked: IdToType<boolean> = {};
const tabIdToUpdateBlocked: IdToType<boolean> = {};
let prevState: RootState;

chrome.runtime.onInstalled.addListener(async details => {
  console.log('installed', details);
  if (cachePersistor) {
    cachePersistor.remove();
  }
  ({ client, persistor: cachePersistor } = await getClient());

  store.dispatch(setSessionId(v4()));

  chrome.alarms.onAlarm.addListener(async alarm => {
    console.log('alarm', alarm)
    if (alarm.name === AlarmType.REFRESH_TOKEN) {
      refreshToken(client);
      return;
    }

    const name = alarm.name.split(ALARM_DELIMITER);

    if (name[0] === AlarmType.UPDATE_TAB) {
      const tabId =  parseInt(name[1]);

      const tab = await chrome.tabs.get(tabId);

      const state = store.getState();
      const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);
      const tabTwigIds = Object.keys(tabIdToTwigIdToTrue[tabId] || {});
      if (tabTwigIds.length > 1) {
        throw Error('Multiple twigs for tabId ' + tabId);
      }
      const tabTwigId = tabTwigIds[0];
      if (tabTwigId) {
        updateTab(client)(tabTwigId, tab.title, tab.url);
      }
      else {
        chrome.alarms.create(alarm.name, {
          when: Date.now() + 100,
        })
      }
      return;
    }

    try {
      if (name[0] === AlarmType.NO_GROUP) {
        const tabId = parseInt(name[1]);

        const focusWindow = await chrome.windows.getLastFocused();

        const tab = await chrome.tabs.get(tabId);

        if (tab.groupId === -1) {
          await chrome.tabs.group({
            tabIds: [tabId],
            createProperties: {
              windowId: focusWindow.id,
            }
          });
        }
      }
      else if (name[0] === AlarmType.MOVE_REQUIRED) {
        const index = parseInt(name[1]);
        const tabIds = name.slice(2).map(tabId => parseInt(tabId));
        chrome.tabs.move(tabIds, {
          index,
        });
      }
      else if (name[0] === AlarmType.GROUP_REQUIRED) {
        const groupId = parseInt(name[1]);
        const tabIds = name.slice(2).map(tabId => parseInt(tabId));
        chrome.tabs.group({
          tabIds,
          groupId,
        });
      }
    } catch (err) {
      if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
        chrome.alarms.create(alarm.name, {
          when: Date.now() + 100,
        });
      }
    }
  });

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

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('tab updated', tabId, changeInfo, tab);

    const state = store.getState();

    if (
      !(changeInfo.url ||
      changeInfo.title ||
      changeInfo.status === 'complete' ||
      (changeInfo.groupId && tab.status === 'complete'))
    ) return;

    if (tab.groupId === -1) {
      const name = AlarmType.NO_GROUP + ALARM_DELIMITER + tabId;
      chrome.alarms.create(name, {
        when: Date.now() + 100,
      });
      return;
    }

    // if (tabIdToUpdateBlocked[tabId]) {
    //   delete tabIdToUpdateBlocked[tabId];
    //   return;
    // }

    // check for tab twig

    const userId = selectUserId(state);
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);

    const tabTwigs = [];
    Object.keys(tabIdToTwigIdToTrue[tabId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: TWIG_FIELDS,
      }) as Twig;

      if (twig.userId === userId) {
        tabTwigs.push(twig);
      }
    })

    if (tabTwigs.length > 1) {
      throw Error('Duplicate twigs for tabId ' + tabId);
    } 

    const tabTwig = tabTwigs[0];

    if (!tabTwig && (tabIdToCreateBlocked[tabId] || changeInfo.title)) {
      // createTab request made, but not returned yet
      // wait until tabTwig present to update it, to avoid creating duplicate tabTwigs
      const name = AlarmType.UPDATE_TAB +
        ALARM_DELIMITER +
        tabId;
      await chrome.alarms.clear(name);
      await chrome.alarms.create(name, {
        when: Date.now() + 100,
      });
      return;
    }

    if (tabTwig && tabTwig.groupId === tab.groupId) {
      // not creating a window
      // not creating a group
      // staying in the same group, window

      const arrow = client.cache.readFragment({
        id: client.cache.identify({
          id: tabTwig.detailId,
          __typename: 'Arrow',
        }),
        fragment: ARROW_FIELDS,
      }) as Arrow;

      if (
        (changeInfo.url && arrow.url !== tab.url) || 
        (changeInfo.title && arrow.title !== tab.title)
      ) {
        // just a tab title/url change
        updateTab(client)(tabTwig.id, tab.title, tab.url);
      }
      return;
    }

    const groupIdToTwigIdToTrue = selectGroupIdToTwigIdToTrue(SpaceType.FRAME)(state);

    const groupTwigs = [];
    Object.keys(groupIdToTwigIdToTrue[tab.groupId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: TWIG_FIELDS,
      }) as Twig;

      if (twig.userId === userId) {
        groupTwigs.push(twig);
      }
    });

    if (groupTwigs.length > 1) {
      throw Error('Duplicate twigs for groupId ' + tab.groupId);
    } 

    const groupTwig = groupTwigs[0];

    if (groupTwig) {
      // not creating a window
      // not creating a group
      // moving to an existing group
      // tab.parentTab is possible

      let parentTab;
      if (tab.index > 0) {
        [parentTab] = await chrome.tabs.query({
          groupId: tab.groupId,
          index: tab.index - 1,
        });
      }

      if (tabTwig) {
        // not creating a tab
        // move tab into existing group
        maintainSubtree(client)(tabTwig.id, tab);
        console.log('move Tab');
        moveTab(client)(tabTwig.id, tab.windowId, tab.groupId, parentTab?.id) 
      } 
      else {
        let parentTwig: Twig;
        if (parentTab) {
          const parentTwigIds = Object.keys(tabIdToTwigIdToTrue[parentTab.id] || {});
          if (parentTwigIds.length > 1) {
            throw Error('Multiple twigs for tabId ' + parentTab.id);
          }

          parentTwig = client.cache.readFragment({
            id: client.cache.identify({
              id: parentTwigIds[0],
              __typename: 'Twig',
            }),
            fragment: TWIG_FIELDS,
          });
        }

        // create just a tab
        let tabEntry: TabEntry = {
          twigId: null,
          tabId,
          groupId: tab.groupId,
          windowId: tab.windowId,
          parentTabId: parentTab?.id,
          degree: parentTwig
            ? parentTwig.degree + 1
            : 3,
          rank: 1,
          index: tab.index,
          title: tab.title,
          url: tab.url,
          color: groupTwig.color,
        };
    
        createTab(client)(tabIdToCreateBlocked, tabEntry);
      }
    }
    else {
      // creating a group
      // tab.parentTab is not possible

      const windowTabs = await chrome.tabs.query({
        windowId: tab.windowId,
      });

      const groupIds = [];
      let groupId = -1;
      windowTabs.sort((a, b) => a.index < b.index ? -1 : 1)
        .forEach(tab => {
          if (tab.groupId !== -1 && tab.groupId !== groupId) {
            groupIds.push(tab.groupId);
            groupId = tab.groupId;
          }
        });
      
      const group = await chrome.tabGroups.get(tab.groupId);
  
      const groupEntry: GroupEntry = {
        twigId: null,
        windowId: tab.windowId,
        groupId: tab.groupId,
        rank: groupIds.indexOf(tab.groupId) + 1,
        color: group.color,
      };

      const windowIdToTwigIdToTrue = selectWindowIdToTwigIdToTrue(SpaceType.FRAME)(state);

      const windowTwigs = [];
      Object.keys(windowIdToTwigIdToTrue[tab.windowId] || {}).forEach(twigId => {
        const twig = client.cache.readFragment({
          id: client.cache.identify({
            id: twigId,
            __typename: 'Twig',
          }),
          fragment: TWIG_FIELDS,
        }) as Twig;

        if (twig.userId === userId) {
          windowTwigs.push(twig);
        }
      })

      if (windowTwigs.length > 1) {
        throw Error('Duplicate twigs for windowId ' + tab.windowId);
      }

      const windowTwig = windowTwigs[0];

      if (tabTwig) {
        maintainSubtree(client)(tabTwig.id, tab);
        if (windowTwig) {
          // create just a group, but move tabTwig into the new group
          createGroup(client)(groupEntry, null, null, tabTwig.id);
        }
        else {
          // create group, window, moving tabTwig into the new group
          const windowEntry: WindowEntry = {
            twigId: null,
            windowId: tab.windowId,
            rank: 1, // move to front
          }
          createGroup(client)(groupEntry, windowEntry, null, tabTwig.id);
        }
      }
      else {
        const tabEntry: TabEntry = {
          twigId: null,
          tabId: tab.id,
          groupId: tab.groupId,
          windowId: tab.windowId,
          parentTabId: null,
          degree: 3,
          rank: 1,
          index: tab.index,
          title: tab.title,
          url: tab.url,
          color: group.color,
        };

        if (windowTwig) {
          // create group, tab
          console.log('create group and tab')
          createGroup(client)(groupEntry, null, tabEntry, null);
        }
        else {
          // create group, tab, window
          const windowEntry: WindowEntry = {
            twigId: null,
            windowId: tab.windowId,
            rank: 1, // move to front
          }
          createGroup(client)(groupEntry, windowEntry, tabEntry, null);
        }
      }
    }
  });

  chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    console.log('tab moved', tabId, moveInfo);
    const state = store.getState();

    const userId = selectUserId(state);
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);
   
    const tabTwigs = [];
    Object.keys(tabIdToTwigIdToTrue[tabId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: TWIG_FIELDS,
      }) as Twig;

      if (twig.userId === userId) {
        tabTwigs.push(twig);
      }
    })

    if (tabTwigs.length > 1) {
      throw Error('Duplicate twigs for tabId ' + tabId);
    } 

    const tabTwig = tabTwigs[0];

    if (!tabTwig) {
      throw Error('Missing tab twig for tabId ' + tabId)
    }

    const tab = await chrome.tabs.get(tabId);

    if (tabTwig.groupId === tab.groupId) {
      let parentTab;
      if (tab.index > 0) {
        [parentTab] = await chrome.tabs.query({
          groupId: tab.groupId,
          index: tab.index - 1,
        });
      }
      maintainSubtree(client)(tabTwig, tab);
      moveTab(client)(tabTwig.id, moveInfo.windowId, tab.groupId, parentTab?.id)
    }
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
      const shouldReloadTwigTree = selectShouldReloadTwigTree(SpaceType.FRAME)(state);
      if (shouldReloadTwigTree) {
        loadTwigTree(client);
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