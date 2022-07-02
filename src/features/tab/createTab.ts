import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { Persistor } from "@plasmohq/redux-persist/lib/types";
import type { CachePersistor } from "apollo3-cache-persist";
import type { Store } from "redux";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs } from "~features/twigs/twigSlice";
import type { IdToType } from "~types";
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


export const createTab = (store: Store, persistor: Persistor) => 
  (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (tab: chrome.tabs.Tab, newIdToTwig: IdToType<Twig>, count = 0) => {
  console.log('trying to create tab', tab.id, tab.groupId, tab.openerTabId)
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
    parentTwig = await  getTwigByTabId(store)(tab.openerTabId);
  }
  else {
    parentTwig = await getTwigByGroupId(store)(groupId);
  }
  if (!parentTwig) {
    const name = AlarmType.CREATE_TAB +
      ALARM_DELIMITER +
      tab.id +
      ALARM_DELIMITER +
      count;

    await chrome.alarms.create(name, {
      when: Date.now() + 100,
    });

    return;
  }

  const group = await chrome.tabGroups.get(groupId);

  let tabEntry: TabEntry = {
    tabId: tab.id,
    groupId,
    windowId: tab.windowId,
    parentTabId: tab.openerTabId,
    degree: parentTwig.degree + 1,
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
    console.log('completed create tab', tab.id);

    data.createTab.twigs.forEach(twig => {
      newIdToTwig[twig.id] = twig;
    });

    store.dispatch(addTwigs({
      space: SpaceType.FRAME,
      twigs: data.createTab.twigs,
    }));

    console.log(store.getState().twig[SpaceType.FRAME])

  } catch (err) {
    console.error(err);
  } 
}
