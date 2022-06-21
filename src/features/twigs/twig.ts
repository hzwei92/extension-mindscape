import { gql } from "@apollo/client"
import type { Arrow } from "~features/arrow/arrow"
import { SpaceType } from "~features/space/space"
import type { User } from "~features/user/user"
import { USER_FIELDS } from "~features/user/userFragments"
import { getClient } from "~graphql"
import { store } from "~store"
import { FULL_TWIG_FIELDS } from "./twigFragments"
import { addTwigs } from "./twigSlice"

export type Twig = {
  id: string
  sourceId: string | null
  targetId: string | null
  userId: string
  user: User
  abstractId: string
  abstract: Arrow
  detailId: string
  detail: Arrow
  parent: Twig
  children: Twig[]
  i: number
  x: number
  y: number
  z: number
  degree: number
  rank: number
  index: number | null
  color: string | null
  displayMode: string
  ownWidth: number
  ownHeight: number
  width: number
  height: number
  windowId: number | null
  groupId: number | null
  tabId: number | null
  isOpen: boolean
  createDate: Date | null
  updateDate: Date | null
  deleteDate: Date | null
  __typename: string
}

const GET_TWIGS = gql`
  mutation GetTwigs($abstractId: String!) {
    getTwigs(abstractId: $abstractId) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`;

export const getTwigs = async (userId: string) => {
  const { client } = await getClient();
  const user = client.cache.readFragment({
    id: client.cache.identify({
      id: userId,
      __typename: 'User',
    }),
    fragment: USER_FIELDS
  }) as User;

  if (!user) return;

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