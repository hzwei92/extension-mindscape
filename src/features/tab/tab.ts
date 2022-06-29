import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { Store } from "redux";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { selectGroupIdToTwigIdToTrue, selectTabIdToTwigIdToTrue, selectWindowIdToTwigIdToTrue } from "~features/twigs/twigSlice";
import { selectUserId } from "~features/user/userSlice";
import { store } from "~store";

export type WindowEntry = {
  twigId: string;
  parentTwigId: string;
  windowId: number;
  rank: number;
};

export type GroupEntry = {
  twigId: string;
  parentTwigId: string;
  groupId: number;
  windowId: number;
  rank: number;
  color: string;
};

export type TabEntry = {
  twigId: string;
  parentTwigId: string;
  tabId: number;
  groupId: number;
  windowId: number;
  degree: number;
  rank: number;
  title: string;
  url: string;
  color: string;
};


export const getTwigByTabId = (client: ApolloClient<NormalizedCacheObject>) => 
  (tabId: number): Twig => {
    const state = store.getState();

    const userId = selectUserId(state);
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);

    const twigs = [];
    Object.keys(tabIdToTwigIdToTrue[tabId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: FULL_TWIG_FIELDS,
        fragmentName: 'FullTwigFields',
      }) as Twig;

      if (twig?.userId === userId) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for tabId ' + tabId, twigs);
    }
    
    return twigs[0];
  }

export const getTwigByGroupId = (client: ApolloClient<NormalizedCacheObject>) => 
  (groupId: number): Twig => {
    const state = store.getState();

    const userId = selectUserId(state);
    const groupIdToTwigIdToTrue = selectGroupIdToTwigIdToTrue(SpaceType.FRAME)(state);
  
    console.log('groupIdToTwigIdToTrue', groupIdToTwigIdToTrue)
    const twigs = [];
    Object.keys(groupIdToTwigIdToTrue[groupId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: FULL_TWIG_FIELDS,
        fragmentName: 'FullTwigFields',
      }) as Twig;

      if (twig?.userId === userId) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for groupId ' + groupId, twigs);
    }
    
    return twigs[0];
  }


export const getTwigByWindowId = (client: ApolloClient<NormalizedCacheObject>) => 
  (windowId: number): Twig => {
    const state = store.getState();

    const userId = selectUserId(state);
    const windowIdToTwigIdToTrue = selectWindowIdToTwigIdToTrue(SpaceType.FRAME)(state);
  
    const twigs = [];
    Object.keys(windowIdToTwigIdToTrue[windowId] || {}).forEach(twigId => {
      const twig = client.cache.readFragment({
        id: client.cache.identify({
          id: twigId,
          __typename: 'Twig',
        }),
        fragment: FULL_TWIG_FIELDS,
        fragmentName: 'FullTwigFields',
      }) as Twig;

      if (twig?.userId === userId) {
        twigs.push(twig);
      }
    });

    if (twigs.length > 1) {
      console.error('Multiple twigs for windowId ' + windowId, twigs);
    }
    
    return twigs[0];
  }