import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { AlarmType, ALARM_DELIMITER, ErrMessage } from "~constants";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { TWIG_FIELDS } from "~features/twigs/twigFragments";
import { selectIdToDescIdToTrue } from "~features/twigs/twigSlice";
import { store } from "~store";
import type { IdToType } from "~types";
import { getTwigByTabId } from "./chrome";

export const maintainSubtree = (client: ApolloClient<NormalizedCacheObject>) =>  
  (tabIdToMoveBlocked: IdToType<number>) =>
  async (tabId: number) => {
    const state = store.getState();

    const twig = getTwigByTabId(client)(tabId);

    if (!twig) {
      const name = AlarmType.MAINTAIN_SUBTREE +
        ALARM_DELIMITER + 
        tabId
      chrome.alarms.create(name,{
        when: Date.now() + 100,
      })
    }

    const idToDescIdToTrue = selectIdToDescIdToTrue(SpaceType.FRAME)(state);

    const descTabIds = Object.keys(idToDescIdToTrue[twig?.id] || {})
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
      tabIdToMoveBlocked[descTabId] = tabIdToMoveBlocked[descTabId]
        ? tabIdToMoveBlocked[descTabId] + 1
        : 1;
    });

    const tab = await chrome.tabs.get(tabId);
    
    const index = tab.index + 1;

    const name = AlarmType.MAINTAIN_SUBTREE +
      ALARM_DELIMITER + 
      index +
      ALARM_DELIMITER +
      tab.groupId +
      ALARM_DELIMITER +
      descTabIds.join(ALARM_DELIMITER);

    try {
      console.log('maintainSubtree', name)
      await chrome.tabs.move(descTabIds, {
        index,
      });

      await chrome.tabs.group({
        tabIds: descTabIds,
        groupId: tab.groupId,
      });
    } catch (err) {
      if (err.message === ErrMessage.CANNOT_EDIT_TABS) {
        await chrome.alarms.create(name, {
          when: Date.now() + 100,
        })
      }
      else {
        console.error(err);
      }
    }
  }