import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { AlarmType, ALARM_DELIMITER } from "~constants";
import { FULL_ARROW_FIELDS } from "~features/arrow/arrowFragments";
import { SpaceType } from "~features/space/space";
import { setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
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

export const updateTab = (client: ApolloClient<NormalizedCacheObject>) =>
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
      console.log(data);

      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }))
      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

    } catch (err) {
      console.error(err);
    }
  }
  