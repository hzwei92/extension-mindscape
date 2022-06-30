import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { v4 } from "uuid";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";
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

export const createGroup = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (group: chrome.tabGroups.TabGroup) => {
    console.log('group created', group)
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
    
    const windowTwig = getTwigByWindowId(client)(group.windowId);

    if (!windowTwig) {
      const name = AlarmType.CREATE_GROUP +
        ALARM_DELIMITER +
        group.id;

      chrome.alarms.create(name, {
        when: Date.now() + 100,
      });

      return;
    }

    const groupEntry: GroupEntry =  {
      twigId: v4(),
      parentTwigId: windowTwig.id,
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
      await cachePersistor.persist();
      console.log(data);

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: [data.createGroup.twig],
      }));

      store.dispatch(addTwigUsers({
        space: SpaceType.FRAME,
        twigs: [data.createGroup.twig],
      }));

    } catch (err) {
      console.error(err);
    }
  }

