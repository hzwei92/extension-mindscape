import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { SpaceType } from "~features/space/space";
import { removeTwigs, setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { persistor, store } from "~store";

const REMOVE_TAB_TWIG = gql`
  mutation RemoveTabTwig($tabId: Int!) {
    removeTabTwig(tabId: $tabId) {
      twig {
        id
        windowId
        groupId
        tabId
        deleteDate
        parent {
          id
        }
      }
      children {
        id
        degree
        rank
        parent {
          id
        }
      }
      descs {
        id
        degree
      }
      sibs {
        id
        rank
      }
      sheafs {
        id
        deleteDate
      }
    }
  }
`;

export const removeTab = (client: ApolloClient<NormalizedCacheObject>) =>
  async (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    console.log('tab removed', tabId, removeInfo);
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_TAB_TWIG,
        variables: {
          tabId,
        }
      });
      console.log(data);
            
      store.dispatch(removeTwigs({
        space: SpaceType.FRAME,
        twigs: [data.removeTabTwig.twig, ...data.removeTabTwig.sheafs],
      }));

      await persistor.flush();

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

      await persistor.flush();
    } catch (err) {
      console.error(err);
    }
  }