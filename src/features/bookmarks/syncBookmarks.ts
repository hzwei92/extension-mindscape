import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs, removeTwigs, setAllPosReadyFalse } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { persistor, store } from "~store";
import type { BookmarkEntry } from "./bookmark";

const SYNC_BOOKMARKS = gql`
  mutation SyncBookmarks($twigId: String!, $bookmarks: [BookmarkEntry!]!) {
    syncBookmarks(twigId: $twigId, bookmarks: $bookmarks) {
      bookmarks {
        ...FullTwigFields
      }
      deleted {
        id
        bookmarkId
        deleteDate
      }
    }
  }
  ${FULL_TWIG_FIELDS}
`;

export const syncBookmarks = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) =>
  async (parentTwigId: string) => {
    console.log('syncing bookmarks')
    const [root] = await chrome.bookmarks.getTree();
    
    const entries = [];

    const queue = root.children.map(node => {
      return {
        node,
        degree: 1,
      }
    });

    while (queue.length) {
      const { 
        node, 
        degree
      } = queue.shift();

      const entry: BookmarkEntry = {
        bookmarkId: node.id,
        parentBookmarkId: node.parentId,
        title: node.title,
        url: node.url,
        degree,
        rank: (node.index ?? 0) + 1,
      };
      entries.push(entry);

      (node.children || []).forEach(child => {
        queue.push({
          node: child,
          degree: degree + 1,
        })
      });
    }
    console.log(entries);

    try {
      const { data } = await client.mutate({
        mutation: SYNC_BOOKMARKS,
        variables: {
          twigId: parentTwigId,
          bookmarks: entries,
        }
      });
      await cachePersistor.persist();
      console.log(data);

      const {
        bookmarks,
        deleted,
      } = data.syncBookmarks;
        
      store.dispatch(removeTwigs({
        space: SpaceType.FRAME,
        twigs: deleted,
      }));

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: bookmarks,
      }));

      store.dispatch(addTwigUsers({
        space: SpaceType.FRAME,
        twigs: bookmarks,
      }));

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

      await persistor.flush();
    } catch (err) {
      console.error(err);
    }

  }