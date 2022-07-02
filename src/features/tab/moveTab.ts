import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { SpaceType } from "~features/space/space";
import { selectIdToDescIdToTrue, setShouldReloadTwigTree } from "~features/space/spaceSlice";
import { selectTabIdToTwigIdToTrue } from "~features/twigs/twigSlice";
import { store } from "~store";
import { getTwigByGroupId, getTwigByTabId } from "./tab";

const MOVE_TAB = gql`
  mutation MoveTab($twigId: String!, $groupTwigId: String!, $parentTwigId: String) {
    moveTab(twigId: $twigId, groupTwigId: $groupTwigId, parentTwigId: $parentTwigId) {
      twig {
        id
        degree
        rank
        groupId
        color
        parent {
          id
        }
      }
      prevSibs {
        id
        rank
      }
      sibs {
        id
        rank
      }
      descs {
        id
        degree
        groupId
        color
      }
    }
  }
`;

export const moveTab = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) =>
  async (tab: chrome.tabs.Tab, count = 0) => {
    const createTabAlarmName = AlarmType.CREATE_TAB +
      ALARM_DELIMITER +
      tab.id;

    const alarms = await chrome.alarms.getAll();

    if (alarms.some(alarm => {
      const name = alarm.name.split(ALARM_DELIMITER);
      return name[0] === AlarmType.CREATE_TAB && name[1] === tab.id.toString();
    })) return;

    console.log('trying to move tab', tab.id)

    const twig = await getTwigByTabId(store)(tab.id);
    const groupTwig = await getTwigByGroupId(store)(tab.groupId);

    if (!twig?.id || !groupTwig?.id) {
      const name = AlarmType.MOVE_TAB +
        ALARM_DELIMITER +
        tab.id +
        ALARM_DELIMITER +
        count;

      chrome.alarms.create(name, {
        when: Date.now() + 100,
      });
      return;
    }

    let parentTwig;

    const groupTabs = await chrome.tabs.query({
      groupId: tab.groupId,
    });

    const state = store.getState();
    const tabIdToTwigIdToTrue = selectTabIdToTwigIdToTrue(SpaceType.FRAME)(state);
    const idToDescIdToTrue = selectIdToDescIdToTrue(SpaceType.FRAME)(state);

    let parentTab;
    groupTabs.sort((a,b) => a.index > b.index ? -1 : 1)
      .some(t => {
        if (t.index < tab.index) {
          const twigId = tabIdToTwigIdToTrue[t.id];
          const isDesc = Object.keys(idToDescIdToTrue[twig.id] || {}).some(descId => {
            return descId === twigId;
          });
          
          if (!isDesc) {
            parentTab = t;
            return true;
          }
        }
        return false;
      })
    
    if (parentTab) {
      parentTwig = await getTwigByTabId(parentTab.id);
      console.log('moveTwig parent', parentTwig, parentTab, idToDescIdToTrue)
      if (!parentTwig) {
        throw new Error('Missing twig for tabId ' + parentTab.id);
      }
    }
    try {
      const { data } = await client.mutate({
        mutation: MOVE_TAB,
        variables: {
          twigId: twig.id,
          groupTwigId: groupTwig.id,
          parentTwigId: parentTwig?.id,
        }
      });
      await cachePersistor.persist();
      console.log(data);

      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));

    } catch (err) {
      console.error(err);
    }
  }
  