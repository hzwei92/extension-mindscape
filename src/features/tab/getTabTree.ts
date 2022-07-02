import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { Store } from "redux";
import { SpaceType } from "~features/space/space";
import { selectIdToChildIdToTrue } from "~features/space/spaceSlice";
import { selectIdToTwig, selectTabIdToTwigIdToTrue } from "~features/twigs/twigSlice";
import { getTwigByTabId } from "./tab";


export const getTabTree = (store: Store) => 
  async (client: ApolloClient<NormalizedCacheObject>) => {
    const state = store.getState();
    const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);
    const idToChildIdToTrue = selectIdToChildIdToTrue(SpaceType.FRAME)(state);
    const tabs = await chrome.tabs.query({});

    const tabTree = {}
    await tabs.reduce(async (acc, tab) => {
      await acc;

      let twig = await getTwigByTabId(store)(tab.id);

      if (!twig) {
        tabTree[tab.id] = {};
      }
      else {
        let rootTwig;
        let parentTwig = twig;
        
        do {
          rootTwig = parentTwig;
          parentTwig = idToTwig[rootTwig.parent.id];
        } while (parentTwig.tabId)

        tabTree[rootTwig.tabId] = {};
      }
    }, Promise.resolve());

    console.log('tabTree', tabTree)
    const queue = Object.keys(tabTree).map(tabId => ({
      tabId: parseInt(tabId),
      tree: tabTree[tabId]
    }));


    while (queue.length) {
      const { tabId, tree } = queue.shift();
      const twigId = Object.keys(tabIdToTwigIdToTrue[tabId] || {})[0];

      Object.keys(idToChildIdToTrue[twigId] || []).forEach(childId => {
        const child = idToTwig[childId]

        if (child && child.tabId) {
          tree[child.tabId] = {};
          queue.push({
            tabId: child.tabId,
            tree: tree[child.tabId],
          });
        }
      });
    }
    console.log(tabTree);

    return tabTree;
  }