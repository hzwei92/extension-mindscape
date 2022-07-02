import { gql } from "@apollo/client";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { FULL_ARROW_FIELDS } from "~features/arrow/arrowFragments";
import { SpaceType } from "~features/space/space";
import { setShouldReloadTwigTree } from "~features/space/spaceSlice";
import { getClient } from "~graphql";
import { store } from "~store";
import { getTwigByTabId } from "./tab";

const UPDATE_TAB = gql`
  mutation UpdateTab($twigId: String!, $title: String!, $url: String!) {
    updateTab(twigId: $twigId, title: $title, url: $url) {
      twig {
        id
        detailId
        detail {
          ...FullArrowFields
        }
      }
      deleted {
        id
        deleteDate
      }
    }
  }
  ${FULL_ARROW_FIELDS}
`;

export const updateTab = async (tab: chrome.tabs.Tab, count = 0) => {
    const createTabAlarmName = AlarmType.CREATE_TAB +
      ALARM_DELIMITER +
      tab.id;
      
    const alarms = await chrome.alarms.getAll();

    if (alarms.some(alarm => {
      const name = alarm.name.split(ALARM_DELIMITER);
      return name[0] === AlarmType.CREATE_TAB && name[1] === tab.id.toString();
    })) return;
  

    const { client, persistor } = await getClient();

    const twig = await getTwigByTabId(store)(tab.id);

    if (!twig?.id) {
      const name = AlarmType.UPDATE_TAB +
        ALARM_DELIMITER +
        tab.id +
        ALARM_DELIMITER +
        count;

      chrome.alarms.create(name, {
        when: Date.now() + 100,
      });
      return;
    }

    try {
      const { data } = await client.mutate({
        mutation: UPDATE_TAB,
        variables: {
          twigId: twig.id,
          title: tab.title,
          url: tab.url,
        }
      });
      await persistor.persist();
      console.log(data);

      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));
      
    } catch (err) {
      console.error(err);
    }
  }
  