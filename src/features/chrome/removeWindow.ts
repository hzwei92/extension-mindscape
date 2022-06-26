import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { removeTwigs, setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { store } from "~store";


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

    store.dispatch(setShouldReloadTwigTree({
      space: SpaceType.FRAME,
      shouldReloadTwigTree: true,
    }));

    store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));
  } catch (err) {
    console.error(err);
  }
}