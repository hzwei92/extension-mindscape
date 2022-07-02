import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { AlarmType, ALARM_DELIMITER, ErrMessage } from "~constants";
import { SpaceType } from "~features/space/space";
import { selectIdToDescIdToTrue } from "~features/space/spaceSlice";
import { selectIdToTwig } from "~features/twigs/twigSlice";
import { store } from "~store";
import type { IdToType } from "~types";
import { getTwigByTabId } from "./tab";

export const maintainSubtree = (client: ApolloClient<NormalizedCacheObject>) =>  
  (tabIdToMoveBlocked: IdToType<number>) =>
  async (tabId: number) => {
    const alarms = await chrome.alarms.getAll();

    if (alarms.some(alarm => {
      const name = alarm.name.split(ALARM_DELIMITER);
      return name[0] === AlarmType.CREATE_TAB && name[1] === tabId.toString();
    })) return;

    const twig = await getTwigByTabId(store)(tabId);

    const name = AlarmType.MAINTAIN_SUBTREE +
      ALARM_DELIMITER +
      tabId;
      
    if (!twig) {
      chrome.alarms.create(name, {
        when: Date.now() + 100,
      })
    }

    const state = store.getState();
    const idToTwig = selectIdToTwig(SpaceType.FRAME)(state);
    const idToDescIdToTrue = selectIdToDescIdToTrue(SpaceType.FRAME)(state);

    const descTabIds = Object.keys(idToDescIdToTrue[twig?.id] || {})
      .reduce((acc, descId) => {
        const descTwig = idToTwig[descId];

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

    try {
      console.log('maintainSubtree', tabId)
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