import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import type { Arrow } from "~features/arrow/arrow"
import { SpaceType } from "~features/space/space"
import type { User } from "~features/user/user"
import { USER_FIELDS } from "~features/user/userFragments"
import { getClient } from "~graphql"
import { store } from "~store"
import type { IdToType } from "~types"
import { FULL_TWIG_FIELDS, TWIG_WITH_PARENT } from "./twigFragments"
import { addTwigs, selectTwigIdToTrue, setTwigTree } from "./twigSlice"

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
    } catch (err) {
      console.error(err);
    }
  }

export const loadTwigTree = (client: ApolloClient<NormalizedCacheObject>) => {
  const state = store.getState();
  const twigIdToTrue = selectTwigIdToTrue(SpaceType.FRAME)(state);

  const twigs = [];
  Object.keys(twigIdToTrue).forEach(twigId => {
    const twig = client.cache.readFragment({
      id: client.cache.identify({
        id: twigId,
        __typename: 'Twig',
      }),
      fragment: FULL_TWIG_FIELDS,
      fragmentName: 'FullTwigFields',
    }) as Twig;
    //console.log(twigId, twig)
    if (twig && !twig.deleteDate) {
      twigs.push(twig);
    }
  });

  const idToChildIdToTrue: IdToType<IdToType<true>> = {};
  const idToDescIdToTrue: IdToType<IdToType<true>> = {};

  twigs.forEach(twig => {
    if (twig.parent) {
      if (idToChildIdToTrue[twig.parent.id]) {
        idToChildIdToTrue[twig.parent.id][twig.id] = true;
      }
      else {
        idToChildIdToTrue[twig.parent.id] = {
          [twig.id]: true,
        };
      }

      let twig1 = twig;
      while (twig1?.parent) {
        if (idToDescIdToTrue[twig1.parent.id]) {
          idToDescIdToTrue[twig1.parent.id][twig.id] = true;
        }
        else {
          idToDescIdToTrue[twig1.parent.id] = {
            [twig.id]: true,
          };
        }
        twig1 = client.cache.readFragment({
          id: client.cache.identify(twig1.parent),
          fragment: TWIG_WITH_PARENT,
        }) as Twig;
      }
    }
  });

  console.log('setTwigTree')
  store.dispatch(setTwigTree({
    space: SpaceType.FRAME,
    idToChildIdToTrue,
    idToDescIdToTrue,
  }))
}