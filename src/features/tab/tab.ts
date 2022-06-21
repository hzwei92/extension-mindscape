import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { store } from "~store";
import type { IdToType } from "~types";

export type WindowEntry = {
  twigId: string | null;
  windowId: number;
  rank: number;
};

export type GroupEntry = {
  twigId: string | null;
  groupId: number;
  windowId: number;
  rank: number;
  color: string;
};

export type TabEntry = {
  twigId: string | null;
  tabId: number;
  groupId: number;
  windowId: number;
  parentTabId: number | null;
  degree: number;
  rank: number;
  index: number;
  title: string;
  url: string;
  color: string;
};

const LOAD_TABS = gql`
  mutation LoadTabs($windows: [WindowEntry!]!, $groups: [GroupEntry!]!, $tabs: [TabEntry!]!) {
    loadTabs(windows: $windows, groups: $groups, tabs: $tabs) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`;


const REMOVE_TAB_TWIG = gql`
  mutation RemoveTabTwig($tabId: Int!) {
    removeTabTwig(tabId: $tabId) {
      twigs {
        id
        deleteDate
      }
      children {
        id
        degree
        rank
        parent {
          id
        }
      }
      sibs {
        id
        rank
      }
    }
  }
`;

const REMOVE_GROUP_TWIG = gql`
  mutation RemoveGroupTwig($groupId: Int!) {
    removeGroupTwig(groupId: $groupId) {
      twig {
        id
        deleteDate
      }
      sibs {
        id
        rank
      }
    }
  }
`;

const REMOVE_WINDOW_TWIG = gql`
  mutation RemoveWindowTwig($windowId: Int!) {
    removeWindowTwig(windowId: $windowId) {
      twig {
        id
        deleteDate
      }
      sibs {
        id
        rank
      }
    }
  }
`;

const orderAndGroupTabs = async (windowId: number, windowTabs: chrome.tabs.Tab[]) => {
  const tabTree: any = {}
  const openerIdToTabIds: IdToType<number[]> = {}; // used to populate tabTree
  const rootIdToTabIds: IdToType<number[]> = {}; // used to group tabs

  const idToTab = windowTabs.reduce((acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  }, {});

  windowTabs.forEach(tab => {
    if (tab.openerTabId) {
      if (openerIdToTabIds[tab.openerTabId]) {
        openerIdToTabIds[tab.openerTabId].push(tab.id)
      }
      else {
        openerIdToTabIds[tab.openerTabId] = [tab.id]
      }
    }
    else {
      tabTree[tab.id] = {};
    }

    let rootId = tab.id;
    while (idToTab[rootId].openerTabId) {
      rootId = idToTab[rootId].openerTabId;
    }

    if (rootIdToTabIds[rootId]) {
      rootIdToTabIds[rootId].push(tab.id);
    }
    else {
      rootIdToTabIds[rootId] = [tab.id];
    }
  });

  // populate tab tree
  const queue = Object.keys(tabTree).map(tabId => ({
    tabId: parseInt(tabId),
    tree: tabTree[tabId]
  }));

  while (queue.length) {
    const { tabId, tree } = queue.shift();
    (openerIdToTabIds[tabId] || []).forEach(subTabId => {
      tree[subTabId] = {};
      queue.push({
        tabId: subTabId,
        tree: tree[subTabId],
      })
    });
  }

  // move the tabs into order
  const tabIds = []; // tabs in order, depth first
  const orderTabs = (tree: any) => {
    Object.keys(tree)
      .sort((a, b) => idToTab[a].index < idToTab[b].index ? -1 : 1)
      .forEach(tabId => {
        tabIds.push(tabId);
        orderTabs(tree[tabId]);
      });
  }
  orderTabs(tabTree);

  await tabIds.reduce(async (acc, tabId, j) => {
    await acc;

    try {
      await chrome.tabs.move(parseInt(tabId), {
        index: j,
      });
    } catch (err) {
      console.error('movement unavailable', err);
    }

  }, Promise.resolve());

  // group tabs
  await Object.keys(rootIdToTabIds).reduce(async (acc, rootId) => {
    await acc;

    const root = idToTab[rootId];
    try {
      await chrome.tabs.group({
        tabIds: rootIdToTabIds[rootId],
        groupId: root.groupId === -1
          ? undefined
          : root.groupId,
        createProperties: root.groupId === -1
          ? {
              windowId,
            }
          : undefined,
      });
    } catch (err) {
      console.error('grouping unavailabe', err);
    }

  }, Promise.resolve());

  return tabTree;
}

export const loadTabs = async (client: ApolloClient<NormalizedCacheObject>) => {
  const tabs = await chrome.tabs.query({});

  const idToTab: IdToType<chrome.tabs.Tab> = {}
  const windowIdToTabIdToTrue: IdToType<IdToType<true>> = {};

  tabs.forEach(tab => {
    idToTab[tab.id] = tab;

    if (windowIdToTabIdToTrue[tab.windowId]) {
      windowIdToTabIdToTrue[tab.windowId][tab.id] = true;
    }
    else {
      windowIdToTabIdToTrue[tab.windowId] = {
        [tab.id]: true,
      };
    }
  });

  const focusWindow = await chrome.windows.getLastFocused();

  const windowIdToEntry: IdToType<WindowEntry> = {};
  const groupIdToEntry: IdToType<GroupEntry> = {};
  const tabIdToEntry: IdToType<TabEntry> = {};
  
  await Object.keys(windowIdToTabIdToTrue)
    .sort((a, b) => {
      if (parseInt(a) === focusWindow.id) return -1;
      if (parseInt(b) === focusWindow.id) return 1;
      return 0;
    })
    .reduce(async (acc, windowId, i) => {
      await acc;

      const windowEntry: WindowEntry = {
        twigId: null,
        windowId: parseInt(windowId),
        rank: i + 1,
      };

      windowIdToEntry[windowEntry.windowId] = windowEntry;

      const windowTabs = Object.keys(windowIdToTabIdToTrue[windowId])
        .map(tabId => idToTab[tabId]);

      const tabTree = await orderAndGroupTabs(parseInt(windowId), windowTabs)

      const tabs1 = await chrome.tabs.query({});

      const groupIds = [];
      let groupId = -1;
      tabs1
        .filter(tab => tab.windowId === parseInt(windowId))
        .sort((a, b) => a.index < b.index ? -1 : 1)
        .forEach(tab => {
          idToTab[tab.id] = tab;

          if (tab.groupId !== groupId){
            groupIds.push(tab.groupId);
            groupId = tab.groupId;
          }
        });
    
      const groupIdToTabRank: IdToType<number> = {}; // used to populate root tabEntry.ranks
      await groupIds.reduce(async (acc, groupId, j) => {
        await acc;

        const group = await chrome.tabGroups.get(groupId);
        const groupEntry: GroupEntry = {
          twigId: null,
          windowId: parseInt(windowId),
          groupId,
          rank: j + 1,
          color: group.color,
        };

        groupIdToEntry[groupId] = groupEntry;

        groupIdToTabRank[groupId] = 1;
      }, Promise.resolve());

      const getTabEntries = (parentTabId: number | null, tree: any, depth: number) => {
        Object.keys(tree).forEach((tabId, j) => {
          const tab = idToTab[tabId];

          let rank = j + 1;
          if (depth === 0) {
            rank = groupIdToTabRank[tab.groupId];
            groupIdToTabRank[tab.groupId] += 1;
          }

          const entry: TabEntry = {
            twigId: null,
            parentTabId,
            windowId: parseInt(windowId),
            groupId: tab.groupId,
            tabId: parseInt(tabId),
            index: tab.index,
            degree: depth + 3,
            rank,
            title: tab.title,
            url: tab.url,
            color: groupIdToEntry[tab.groupId].color,
          };
          tabIdToEntry[entry.tabId] = entry;

          getTabEntries(entry.tabId, tree[tabId], depth + 1);
        })
      }
      getTabEntries(null, tabTree, 0);
    }, Promise.resolve());

  try {
    const { data } = await client.mutate({
      mutation: LOAD_TABS,
      variables: {
        windows: Object.keys(windowIdToEntry).map(id => windowIdToEntry[id]),
        groups: Object.keys(groupIdToEntry).map(id => groupIdToEntry[id]),
        tabs: Object.keys(tabIdToEntry).map(id => tabIdToEntry[id]),
      }
    });
    console.log(data);
    store.dispatch(addTwigs({
      space: SpaceType.FRAME,
      twigs: data.loadTabs,
    }))
  } catch (err) {
    console.log(err);
  }

}

export const removeTab = (client: ApolloClient<NormalizedCacheObject>) =>
  async (tabId: number) => {
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_TAB_TWIG,
        variables: {
          tabId,
        }
      });
      console.log(data);
      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));
    } catch (err) {
      console.error(err);
    }
  }

export const removeGroup = (client: ApolloClient<NormalizedCacheObject>) => 
  async (groupId: number) => {
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_GROUP_TWIG,
        variables: {
          groupId,
        }
      });
      console.log(data);
      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));
    } catch (err) {
      console.error(err);
    }
  }

export const removeWindow = (client: ApolloClient<NormalizedCacheObject>) => 
  async (windowId: number) => {
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_WINDOW_TWIG,
        variables: {
          windowId,
        }
      });
      console.log(data);
      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));
    } catch (err) {
      console.error(err);
    }
  }