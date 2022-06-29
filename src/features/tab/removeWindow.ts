import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { removeTwigs, setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { persistor, store } from "~store";


const REMOVE_WINDOW_TWIG = gql`
  mutation RemoveWindowTwig($windowId: Int!) {
    removeWindowTwig(windowId: $windowId) {
      twig {
        id
        windowId
        deleteDate
      }
      sibs {
        id
        rank
      }
    }
  }
`;

export const removeWindow = (client: ApolloClient<NormalizedCacheObject>) => 
async (windowId: number) => {
  try {
    const { data } = await client.mutate({
      mutation: REMOVE_WINDOW_TWIG,
      variables: {
        windowId,
      }
    });
    console.log(data);
    
    store.dispatch(removeTwigs({
      space: SpaceType.FRAME,
      twigs: [data.removeWindowTwig.twig],
    }));

    await persistor.flush();

    store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

    await persistor.flush();
  } catch (err) {
    console.error(err);
  }
}