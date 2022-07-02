import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { addTwigs, removeTwigs } from "~features/twigs/twigSlice";
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
    
    store.dispatch(addTwigs({
      space: SpaceType.FRAME,
      twigs: [data.removeWindowTwig.twig],
    }));
    // store.dispatch(removeTwigs({
    //   space: SpaceType.FRAME,
    //   twigs: [data.removeWindowTwig.twig],
    // }));

  } catch (err) {
    console.error(err);
  }
}