import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { FULL_TWIG_FIELDS, TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, selectIdToDescIdToTrue, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { RootState, store } from "~store";
import type { IdToType } from "~types";
import { AlarmType, ALARM_DELIMITER, ErrMessage } from "~constants";

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

const CREATE_TAB = gql`
  mutation CreateTab($tab: TabEntry) {
    createTab(tab: $tab) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`;

const CREATE_GROUP = gql`
  mutation CreateGroup($group: GroupEntry!, $window: WindowEntry, $tab: TabEntry, $tabTwigId: String) {
    createGroup(group: $group, window: $window, tab: $tab, tabTwigId: $tabTwigId) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`;

const UPDATE_TAB = gql`
  mutation UpdateTab($twigId: String!, $title: String!, $url: String!) {
    updateTab(twigId: $twigId, title: $title, url: $url) {
      twig {
        ...FullTwigFields
      }
      deleted {
        id
        deleteDate
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;

const MOVE_TAB = gql`
  mutation MoveTab($twigId: String!, $windowId: Int!, $groupId: Int!, $parentTabId: Int) {
    moveTab(twigId: $twigId, windowId: $windowId, groupId: $groupId, parentTabId: $parentTabId) {
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
    }));
  } catch (err) {
    console.log(err);
  }

}

export const maintainSubtree = (client: ApolloClient<NormalizedCacheObject>) =>  
  async (twigId: string, tab: chrome.tabs.Tab) => {
    const state = store.getState();

    const idToDescIdToTrue = selectIdToDescIdToTrue(SpaceType.FRAME)(state);

    const descTabIds = Object.keys(idToDescIdToTrue[twigId] || {})
      .reduce((acc, descId) => {
        const descTwig = client.cache.readFragment({
          id: client.cache.identify({
            id: descId,
            __typename: 'Twig',
          }),
          fragment: TWIG_FIELDS,
        }) as Twig;

        if (descTwig.tabId) {
          acc.push(descTwig.tabId);
        }
        return acc;
      }, []);

    if (!descTabIds.length) return;

    descTabIds.forEach(descTabId => {
      // prevent cascade of updates, as descendants are updated/moved

      // TODO

      // tabIdToUpdateBlocked[descTabId] = true;
      // tabIdToMoveBlocked[descTabId] = true;
    });

    const index = tab.index + 1;

    const moveAlarmName = AlarmType.MOVE_REQUIRED +
      ALARM_DELIMITER + 
      index +
      ALARM_DELIMITER +
      descTabIds.join(ALARM_DELIMITER);

    await chrome.alarms.clear(moveAlarmName);

    try {
      await chrome.tabs.move(descTabIds, {
        index,
      });
    } catch (err) {
      if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
        chrome.alarms.create(moveAlarmName, {
          when: Date.now() + 100,
        })
      }
      else {
        console.error(err);
      }
    }

    const groupAlarmName = AlarmType.GROUP_REQUIRED + 
      ALARM_DELIMITER + 
      tab.groupId +
      ALARM_DELIMITER +
      descTabIds.join(ALARM_DELIMITER);

    await chrome.alarms.clear(groupAlarmName);

    try {
      await chrome.tabs.group({
        tabIds: descTabIds,
        groupId: tab.groupId,
      });
    } catch (err) {
      if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
        chrome.alarms.create(groupAlarmName, {
          when: Date.now() + 100,
        });
      }
      else {
        console.error('maintainSubtree: tab grouping unavailable', err)
      }
    }
  }

export const createTab = (client: ApolloClient<NormalizedCacheObject>) => 
  async (tabIdToCreateBlocked: IdToType<boolean>, tabEntry: TabEntry) => {
    console.log('createTab', tabEntry);
    tabIdToCreateBlocked[tabEntry.tabId] = true;
    try {
      const { data } = await client.mutate({
        mutation: CREATE_TAB,
        variables: {
          tab: tabEntry,
        }
      });
      console.log(data);
      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: data.createTab,
      }));
      delete tabIdToCreateBlocked[tabEntry.tabId];
    } catch (err) {
      console.error(err);
    } 
  }

export const createGroup = (client: ApolloClient<NormalizedCacheObject>) => 
  async (
    groupEntry: GroupEntry, 
    windowEntry: WindowEntry | null, 
    tabEntry: TabEntry | null, 
    tabTwigId: string | null,
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_GROUP,
        variables: {
          group: groupEntry,
          window: windowEntry,
          tab: tabEntry,
          tabTwigId,
        }
      });
      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: data.createGroup,
      }));
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  }

export const updateTab = (client: ApolloClient<NormalizedCacheObject>) =>
  async (twigId: string, title: string, url: string) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_TAB,
        variables: {
          twigId,
          title,
          url,
        }
      });
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  }
  
export const moveTab = (client: ApolloClient<NormalizedCacheObject>) => 
  async (twigId: string, windowId: number, groupId: number, parentTabId?: number) => {
    try {
      const { data } = await client.mutate({
        mutation: MOVE_TAB,
        variables: {
          twigId,
          windowId,
          groupId,
          parentTabId,
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