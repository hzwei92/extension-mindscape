import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { getBookmarkEntries } from "~features/bookmarks/syncBookmarks";
import { SpaceType } from "~features/space/space";
import { getGroupEntries, getTabEntries, getWindowEntries } from "~features/tab/syncTabState";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, removeTwigs } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";

const SYNC_BROWSER_STATE = gql`
  mutation SyncBrowserState(
    $twigId: String!,
    $bookmarks: [BookmarkEntry!]!, 
    $windows: [WindowEntry!]!, 
    $groups: [GroupEntry!]!, 
    $tabs: [TabEntry!]!
  ) {
    syncBrowserState(
      twigId: $twigId, 
      bookmarks: $bookmarks, 
      windows: $windows, 
      groups: $groups, 
      tabs: $tabs
    ) {
      bookmarks {
        ...FullTwigFields
      }
      windows {
        ...FullTwigFields
      }
      groups {
        ...FullTwigFields
      }
      tabs {
        ...FullTwigFields
      }
      deleted {
        id
        windowId
        groupId
        tabId
        deleteDate
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;

export const syncBrowserState = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (twigId: string, tabTrees: any[]) => {
    const bookmarkEntries = await getBookmarkEntries();

    const windowEntries = await getWindowEntries();
    
    const groupEntries = await getGroupEntries(windowEntries);

    const tabEntries = await getTabEntries(tabTrees, groupEntries);

    const { data } = await client.mutate({
      mutation: SYNC_BROWSER_STATE,
      variables: {
        twigId,
        bookmarks: bookmarkEntries,
        windows: windowEntries,
        groups: groupEntries,
        tabs: tabEntries,
      }
    });
    await cachePersistor.persist();
    console.log(data);

    const { 
      bookmarks,
      windows,
      groups,
      tabs,
      deleted,
    } = data.syncBrowserState;

    store.dispatch(removeTwigs({
      space: SpaceType.FRAME,
      twigs: deleted,
    }));
    
    store.dispatch(addTwigs({
      space: SpaceType.FRAME,
      twigs: [...bookmarks, ...windows, ...groups, ...tabs],
    }));

    store.dispatch(addTwigUsers({
      space: SpaceType.FRAME,
      twigs: [...bookmarks, ...windows, ...groups, ...tabs],
    }));
  }