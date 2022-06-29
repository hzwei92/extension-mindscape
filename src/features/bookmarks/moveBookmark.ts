import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { SpaceType } from "~features/space/space";
import { setAllPosReadyFalse, setShouldReloadTwigTree } from "~features/twigs/twigSlice";
import { persistor, store } from "~store";

const MOVE_BOOKMARK = gql`
  mutation MoveBookmark($bookmarkId: String!, $parentBookmarkId: String!, $rank: Int!) {
    moveBookmark(bookmarkId: $bookmarkId, parentBookmarkId: $parentBookmarkId, rank: $rank) {
      twig {
        id
        degree
        rank
        parent {
          id
        }
      }
      prevSibs {
        id
        rank
      }
      sibs {
        id
        rank
      }
      descs {
        id
        degree
      }
    }
  }
`;

export const moveBookmark = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (bookmarkId: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo) => {
    try {
      const { data } = await client.mutate({
        mutation: MOVE_BOOKMARK,
        variables: {
          bookmarkId,
          parentBookmarkId: moveInfo.parentId,
          rank: moveInfo.index + 1,
        }
      });
      await cachePersistor.persist()
      console.log(data);

      store.dispatch(setShouldReloadTwigTree({
        space: SpaceType.FRAME,
        shouldReloadTwigTree: true,
      }));

      await persistor.flush();

      store.dispatch(setAllPosReadyFalse(SpaceType.FRAME));

      await persistor.flush();
    } catch (err) {
      console.error(err)
    }
  }