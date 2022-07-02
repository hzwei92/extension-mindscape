
import type { Persistor } from "@plasmohq/redux-persist/lib/types";
import type { Store } from "redux";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { selectGroupIdToTwigIdToTrue, selectIdToTwig, selectTabIdToTwigIdToTrue, selectWindowIdToTwigIdToTrue } from "~features/twigs/twigSlice";
import type { User } from "~features/user/user";
import { selectCurrentUser } from "~features/user/userSlice";
import { store } from "~store";

export type WindowEntry = {
  windowId: number;
  rank: number;
};

export type GroupEntry = {
  groupId: number;
  windowId: number;
  rank: number;
  color: string;
};

export type TabEntry = {
  tabId: number;
  parentTabId: number;
  groupId: number;
  windowId: number;
  degree: number;
  rank: number;
  title: string;
  url: string;
  color: string;
};


export const getTwigByTabId = (store: Store) => 
  async (tabId: number): Promise<Twig> => {
    const state = store.getState();

    const user: User = selectCurrentUser(state);
    const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);
    
    const twigs = [];
    Object.keys(tabIdToTwigIdToTrue[tabId] || {}).forEach(twigId => {
      const twig = idToTwig[twigId];

      if (twig?.userId === user.id) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for tabId ' + tabId, twigs);
    }
    
    return twigs[0];
  }

export const getTwigByGroupId = (store: Store) => 
  async (groupId: number): Promise<Twig> => {
    const state = store.getState();

    const user: User = selectCurrentUser(state);
    const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
    const groupIdToTwigIdToTrue = selectGroupIdToTwigIdToTrue(SpaceType.FRAME)(state);

    const twigs = [];
    Object.keys(groupIdToTwigIdToTrue[groupId] || {}).forEach(twigId => {
      const twig = idToTwig[twigId]

      if (twig?.userId === user.id) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for groupId ' + groupId, twigs);
    }
    
    return twigs[0];
  }


export const getTwigByWindowId = (store: Store) => 
  async (windowId: number): Promise<Twig> => {
    const state = store.getState();

    const user: User = selectCurrentUser(state);
    const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
    const windowIdToTwigIdToTrue = selectWindowIdToTwigIdToTrue(SpaceType.FRAME)(state);

    const twigs = [];
    Object.keys(windowIdToTwigIdToTrue[windowId] || {}).forEach(twigId => {
      const twig = idToTwig[twigId];

      if (twig?.userId === user.id) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for windowId ' + windowId, twigs);
    }
    
    return twigs[0];
  }