import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import { v4 } from "uuid";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, setAllPosReadyFalse } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";
import type { WindowEntry } from "./tab";

const CREATE_WINDOW = gql`
  mutation CreateWindow($windowEntry: WindowEntry!) {
    createWindow(windowEntry: $windowEntry) {
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

export const createWindow = (client: ApolloClient<NormalizedCacheObject>) =>
  async (window: chrome.windows.Window, parentTwigId: string) => {
    const windowEntry: WindowEntry = {
      twigId: v4(),
      parentTwigId,
      windowId: window.id,
      rank: 1,
    };

    client.mutate({
      mutation: CREATE_WINDOW,
      variables: {
        windowEntry,
      },
    }).then(({data}) => {
      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: [data.createWindow.twig],
      }));

      store.dispatch(addTwigUsers({
        space: SpaceType.FRAME,
        twigs: [data.createWindow.twig],
      }));

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

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

    // store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));
  } 