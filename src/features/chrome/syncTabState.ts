import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { v4 } from "uuid";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, removeTwigs, setAllPosReadyFalse } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";
import type { IdToType } from "~types";
import type { GroupEntry, TabEntry, WindowEntry } from "./chrome";


const SYNC_TAB_STATE = gql`
  mutation SyncTabState($twigId: String!, $windows: [WindowEntry!]!, $groups: [GroupEntry!]!, $tabs: [TabEntry!]!) {
    syncTabState(twigId: $twigId, windows: $windows, groups: $groups, tabs: $tabs) {
      windows {
        ...FullTwigFields
      }
      groups {
        ...FullTwigFields
      }
      tabs {
        ...FullTwigFields
      }
      deleted {
        id
        windowId
        groupId
        tabId
        deleteDate
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;

const getWindowEntries = async (parentTwigId: string) => {
  const windows = await chrome.windows.getAll();
      
  const focusWindow = await chrome.windows.getLastFocused();

  const windowEntries = windows
    .sort((a, b) => {
      if (a.id === focusWindow.id) return -1;
      if (b.id === focusWindow.id) return 1;
      return 0;
    })
    .map((window, i) => {
      const entry: WindowEntry = {
        twigId: v4(),
        parentTwigId,
        windowId: window.id,
        rank: i + 1,
      };
      return entry;
    });
  
  return windowEntries;
}

const getGroupEntries = async (windowEntries: WindowEntry[]) => {
  const groups = await chrome.tabGroups.query({});

  const idToGroup: IdToType<chrome.tabGroups.TabGroup> = groups.reduce((acc, group) => {
    acc[group.id] = group;
    return acc;
  }, {});

  const groupEntries = (await Promise.all(windowEntries.map(async windowEntry => {
    const tabs = await chrome.tabs.query({
      windowId: windowEntry.windowId,
    });

    const groupIds = [];

    let groupId = -1;
    tabs.sort((a, b) => a.index < b.index ? -1 : 1)
      .forEach(tab => {
        if (tab.groupId !== -1 && tab.groupId !== groupId) {
          groupIds.push(tab.groupId);
          groupId = tab.groupId;
        }
      });
    
    return groupIds.map((groupId, i) => {
      const group = idToGroup[groupId];
      const groupEntry: GroupEntry = {
        twigId: v4(),
        parentTwigId: windowEntry.twigId,
        windowId: windowEntry.windowId,
        groupId: groupId,
        rank: i + 1,
        color: group.color,
      };
      return groupEntry;
    });
  }))).reduce((acc, entries) => {
    acc.push(...entries);
    return acc;
  }, []);  

  return groupEntries;
}

const getTabEntries = async (tabTrees: any[], groupEntries: GroupEntry[]) => {
  const tabs = await chrome.tabs.query({});
  const idToTab: IdToType<chrome.tabs.Tab> = tabs.reduce((acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  }, {});

  const groupIdToEntry: IdToType<GroupEntry> = groupEntries.reduce((acc, entry) => {
    acc[entry.groupId] = entry;
    return acc;
  }, {});

  const groupIdToTabRank = {};
  const tabIdToEntry: IdToType<TabEntry> = {};

  const getEntries = (parentTabId: number | null, tree: any, depth: number) => {
    Object.keys(tree).forEach((tabId, i) => {
      const tab = idToTab[tabId];

      let rank = i + 1;
      if (depth === 0) {
        if (groupIdToTabRank[tab.groupId]) {
          rank = groupIdToTabRank[tab.groupId];
          groupIdToTabRank[tab.groupId] += 1;
        }
        else {
          rank = 1;
          groupIdToTabRank[tab.groupId] = 2;
        }
      }
      
      const entry: TabEntry = {
        twigId: v4(),
        parentTwigId: depth === 0
          ? groupIdToEntry[tab.groupId].twigId
          : tabIdToEntry[parentTabId].twigId,
        windowId: tab.windowId,
        groupId: tab.groupId,
        tabId: parseInt(tabId),
        degree: depth + 3,
        rank,
        title: tab.title,
        url: tab.url,
        color: depth === 0
          ? groupIdToEntry[tab.groupId].color
          : tabIdToEntry[parentTabId].color,
      };

      tabIdToEntry[entry.tabId] = entry;

      getEntries(entry.tabId, tree[tabId], depth + 1);
    });
  }

  tabTrees.forEach(tabTree => {
    getEntries(null, tabTree, 0);
  });

  return Object.keys(tabIdToEntry).map(tabId => tabIdToEntry[tabId]);
}

export const syncTabState = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (twigId: string, tabTrees: any[]) => {
    const windowEntries = await getWindowEntries(twigId);
    
    const groupEntries = await getGroupEntries(windowEntries);

    const tabEntries = await getTabEntries(tabTrees, groupEntries);

    const { data } = await client.mutate({
      mutation: SYNC_TAB_STATE,
      variables: {
        twigId,
        windows: windowEntries,
        groups: groupEntries,
        tabs: tabEntries,
      }
    });
    await cachePersistor.persist();
    console.log(data);

    const { 
      windows,
      groups,
      tabs,
      deleted,
    } = data.syncTabState;

    store.dispatch(removeTwigs({
      space: SpaceType.FRAME,
      twigs: deleted,
    }));

    store.dispatch(addTwigs({
      space: SpaceType.FRAME,
      twigs: [...windows, ...groups, ...tabs],
    }));

    store.dispatch(addTwigUsers({
      space: SpaceType.FRAME,
      twigs: [...windows, ...groups, ...tabs],
    }));

    store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));


  }