import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import type { User } from "~features/user/user";
import { store } from "~store";
import { FULL_TWIG_FIELDS } from "./twigFragments";
import { addTwigs } from "./twigSlice";

const GET_TWIGS = gql`
  mutation GetTwigs($abstractId: String!) {
    getTwigs(abstractId: $abstractId) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`;

export const getTwigs = (client: ApolloClient<NormalizedCacheObject>) => 
  async (user: User) => {
    try {
      const { data } = await client.mutate({
        mutation: GET_TWIGS,
        variables: {
          abstractId: user.frameId,
        }
      });
      console.log(data);

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: data.getTwigs
      }));
      
    } catch (err) {
      console.error(err);
    }
  }