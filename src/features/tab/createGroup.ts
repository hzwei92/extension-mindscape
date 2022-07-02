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
import { getTwigByWindowId, GroupEntry } from "./tab";

const CREATE_GROUP = gql`
  mutation CreateGroup($groupEntry: GroupEntry!) {
    createGroup(groupEntry: $groupEntry) {
      twig {
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

export const createGroup = (store: Store, persistor: Persistor) => 
  (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (group: chrome.tabGroups.TabGroup, newIdToTwig: IdToType<Twig>, count = 0) => {
    const windowTabs = await chrome.tabs.query({
      windowId: group.windowId,
    });

    const groupIds = [];
    let groupId = -1;
    windowTabs.sort((a, b) => a.index < b.index ? -1 : 1)
      .forEach(tab => {
        if (tab.groupId !== -1 && tab.groupId !== groupId) {
          groupIds.push(tab.groupId);
          groupId = tab.groupId;
        }
      });
    
    const windowTwig = await getTwigByWindowId(store)(group.windowId);

    console.log('trying to create group', group.id);
    if (!windowTwig) {
      const name = AlarmType.CREATE_GROUP +
        ALARM_DELIMITER +
        group.id +
        ALARM_DELIMITER +
        count;

      chrome.alarms.create(name, {
        when: Date.now() + 100,
      });

      return;
    }

    const groupEntry: GroupEntry =  {
      windowId: group.windowId,
      groupId: group.id,
      rank: groupIds.indexOf(group.id) + 1,
      color: group.color,
    };

    try {
      const { data } = await client.mutate({
        mutation: CREATE_GROUP,
        variables: {
          groupEntry,
        }
      });
      console.log('completed create group', group.id);

      newIdToTwig[data.createGroup.twig.id] = data.createGroup.twig;

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: [data.createGroup.twig],
      }));

      console.log(store.getState().twig[SpaceType.FRAME])

    } catch (err) {
      console.error(err);
    }
  }

