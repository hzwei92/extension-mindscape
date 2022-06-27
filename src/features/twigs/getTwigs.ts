import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { SpaceType } from "~features/space/space";
import type { User } from "~features/user/user";
import { USER_FIELDS } from "~features/user/userFragments";
import { addTwigUsers } from "~features/user/userSlice";
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
async (userId: string) => {
  const user = client.readFragment({
    id: client.cache.identify({
      id: userId,
      __typename: 'User',
    }),
    fragment: USER_FIELDS
  }) as User;

  if (!user) {
    throw Error('Missing user with id ' + userId)
  };

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
    
    store.dispatch(addTwigUsers({
      space: SpaceType.FRAME,
      twigs: data.getTwigs,
    }));
    
  } catch (err) {
    console.error(err);
  }
}