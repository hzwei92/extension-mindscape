import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { FULL_ARROW_FIELDS } from "~features/arrow/arrowFragments";
import { SpaceType } from "~features/space/space";
import { setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { persistor, store } from "~store";
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

export const updateTab = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) =>
  async (tab: chrome.tabs.Tab) => {
    const twig = getTwigByTabId(client)(tab.id);

    if (!twig?.id) {
      const name = AlarmType.UPDATE_TAB +
        ALARM_DELIMITER +
        tab.id;

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
      await cachePersistor.persist();
      console.log(data);

      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));

      await persistor.flush();
      
      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

      await persistor.flush();
    } catch (err) {
      console.error(err);
    }
  }
  