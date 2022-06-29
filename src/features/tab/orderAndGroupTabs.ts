import { tableFooterClasses } from "@mui/material";
import type { IdToType } from "~types";

export const orderAndGroupTabs = async () => {
  const tabs = await chrome.tabs.query({});

  const idToTab: IdToType<chrome.tabs.Tab> = {}
  const windowIdToTabIds: IdToType<number[]> = {};

  tabs.forEach(tab => {
    idToTab[tab.id] = tab;

    if (windowIdToTabIds[tab.windowId]) {
      windowIdToTabIds[tab.windowId].push(tab.id)
    }
    else {
      windowIdToTabIds[tab.windowId] = [tab.id];
    }
  });

  const tabTrees = await Promise.all(Object.keys(windowIdToTabIds).map(async windowId => {
    const tabTree: any = {}
    const openerIdToTabIds: IdToType<number[]> = {}; // used to populate tabTree
    const rootIdToTabIds: IdToType<number[]> = {}; // used to group tabs
  
    windowIdToTabIds[windowId].map(tabId => {
      const tab = idToTab[tabId];

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

      await chrome.tabs.move(parseInt(tabId), {
        index: j,
      });
    }, Promise.resolve());

    // group tabs
    await Promise.all(Object.keys(rootIdToTabIds).map(async rootId => {
      const root = idToTab[rootId];
      await chrome.tabs.group({
        tabIds: rootIdToTabIds[rootId],
        groupId: root.groupId === -1
          ? undefined
          : root.groupId,
        createProperties: root.groupId === -1
          ? { windowId: parseInt(windowId) }
          : undefined,
      });
      return Promise.resolve()
    }));

    return tabTree;
  }));

  return tabTrees;
}