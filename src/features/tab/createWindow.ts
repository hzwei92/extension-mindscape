import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { SpaceType } from "~features/space/space";
import type { Twig } from "~features/twigs/twig";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs } from "~features/twigs/twigSlice";
import { store } from "~store";
import type { IdToType } from "~types";
import type { WindowEntry } from "./tab";

const CREATE_WINDOW = gql`
  mutation CreateWindow($twigId: String!, $windowEntry: WindowEntry!) {
    createWindow(twigId: $twigId, windowEntry: $windowEntry) {
      twig {
        ...FullTwigFields
      }
      sibs {
        id
        rank
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;

export const createWindow = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) =>
  async (window: chrome.windows.Window, parentTwigId: string, newIdToTwig: IdToType<Twig>) => {
    const windowEntry: WindowEntry = {
      windowId: window.id,
      rank: 1,
    };

    client.mutate({
      mutation: CREATE_WINDOW,
      variables: {
        twigId: parentTwigId,
        windowEntry,
      },
    }).then(async ({data}) => {
      newIdToTwig[data.createWindow.twig.id] = data.createWindow.twig;

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: [data.createWindow.twig],
      }));

    }).catch(err => {
      console.error(err);
    });

    // const state = store.getState();
    // const userId = selectUserId(state);
    // const user = client.cache.readFragment({
    //   id: client.cache.identify({
    //     id: userId,
    //     __typename: 'User',
    //   }),
    //   fragment: FULL_USER_FIELDS,
    //   fragmentName: 'FullUserFields',
    // }) as User;

    // const parentTwig = client.cache.readFragment({
    //   id: client.cache.identify({
    //     id: parentTwigId,
    //     __typename: 'Twig',
    //   }),
    //   fragment: FULL_TWIG_FIELDS,
    //   fragmentName: 'FullTwigFields',
    // }) as Twig;

    // const windowArrow = createArrow(
    //   user,
    //   v4(), 
    //   null,
    //   windowEntry.windowId.toString(), 
    //   null, 
    //   user.frame, 
    //   null, 
    //   null
    // );
    // const windowTwig = createTwig(
    //   user, 
    //   windowEntry.twigId, 
    //   user.frame, 
    //   windowArrow, 
    //   parentTwig, 
    //   parentTwig.x,
    //   parentTwig.y, 
    //   user.color, 
    //   true, 
    //   windowEntry.windowId, 
    //   null, 
    //   null,
    //   DisplayMode.VERTICAL,
    // );

    // client.cache.writeQuery({
    //   query: gql`
    //     query WriteReplyTwig {
    //       twig {
    //         ...FullTwigFields
    //       }
    //     }
    //     ${FULL_TWIG_FIELDS}
    //   `,
    //   data: {
    //     twig: windowTwig,
    //   },
    // });

    // windowTwig.createDate = null;
    // windowTwig.updateDate = null;
    // windowArrow.activeDate = null;
    // windowArrow.saveDate = null;
    // windowArrow.createDate = null;
    // windowArrow.updateDate = null;
    
    // const newRef = client.cache.writeFragment({
    //   id: client.cache.identify(windowTwig),
    //   fragment: TWIG_FIELDS,
    //   data: windowTwig,
    // });

    // client.cache.modify({
    //   id: client.cache.identify(parentTwig),
    //   fields: {
    //     children: (cachedRefs = []) => {
    //       return [...(cachedRefs || []), newRef];
    //     }
    //   }
    // });

    // store.dispatch(addTwigs({
    //   space: SpaceType.FRAME,
    //   twigs: [windowTwig],
    // }));
  } 