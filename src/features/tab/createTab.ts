import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { v4 } from "uuid";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, setAllPosReadyFalse } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";
import { getTwigByGroupId, getTwigByTabId, TabEntry } from "./tab";


const CREATE_TAB = gql`
  mutation CreateTab($tabEntry: TabEntry!) {
    createTab(tabEntry: $tabEntry) {
      twigs {
        ...FullTwigFields
      }
      sibs {
        id
        rank
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;


export const createTab = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (tab: chrome.tabs.Tab) => {
    let groupId = tab.groupId;

    if (tab.groupId === -1) {
      if (tab.openerTabId) {
        const opener = await chrome.tabs.get(tab.openerTabId);
        groupId = opener.groupId;
        await chrome.tabs.move(tab.id, {
          index: opener.index + 1,
        })
        await chrome.tabs.group({
          tabIds: [tab.id],
          groupId: opener.groupId,
        })
      }
      else {
        groupId = await chrome.tabs.group({
          tabIds: [tab.id],
          createProperties: {
            windowId: tab.windowId,
          },
        });
      }
    }

    let parentTwig: Twig;
    if (tab.openerTabId) {
      parentTwig = getTwigByTabId(client)(tab.openerTabId);
    }
    else {
      parentTwig = getTwigByGroupId(client)(groupId);
    }
    if (!parentTwig) {
      const name = AlarmType.CREATE_TAB +
        ALARM_DELIMITER +
        tab.id;

      await chrome.alarms.create(name, {
        when: Date.now() + 100,
      });

      return;
    }

    const group = await chrome.tabGroups.get(groupId);

    let tabEntry: TabEntry = {
      twigId: v4(),
      parentTwigId: parentTwig.id,
      tabId: tab.id,
      groupId,
      windowId: tab.windowId,
      degree: parentTwig
        ? parentTwig.degree + 1
        : 3,
      rank: 1,
      title: tab.title,
      url: tab.url || tab.pendingUrl,
      color: group.color
    };
    
    try {
      const { data } = await client.mutate({
        mutation: CREATE_TAB,
        variables: {
          tabEntry,
        }
      });
      await cachePersistor.persist();
      console.log(data);

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: data.createTab.twigs,
      }));

      store.dispatch(addTwigUsers({
        space: SpaceType.FRAME,
        twigs: data.createTab.twigs,
      }));

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

    } catch (err) {
      console.error(err);
    } 
  }
