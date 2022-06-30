import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import { removeTwigs, setAllPosReadyFalse } from "~features/twigs/twigSlice";
import { store } from "~store";


const REMOVE_GROUP_TWIG = gql`
  mutation RemoveGroupTwig($groupId: Int!) {
    removeGroupTwig(groupId: $groupId) {
      twig {
        id
        deleteDate
      }
      sibs {
        id
        rank
      }
    }
  }
`;
export const removeGroup = (client: ApolloClient<NormalizedCacheObject>) => 
  async (group: chrome.tabGroups.TabGroup) => {
    console.log('group removed', group);
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_GROUP_TWIG,
        variables: {
          groupId: group.id,
        }
      });
      console.log(data);
                  
      store.dispatch(removeTwigs({
        space: SpaceType.FRAME,
        twigs: [data.removeGroupTwig.twig],
      }));

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));
    } catch (err) {
      console.error(err);
    }
  }