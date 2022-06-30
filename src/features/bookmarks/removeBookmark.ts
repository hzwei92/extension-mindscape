import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import type { CachePersistor } from "apollo3-cache-persist"
import { SpaceType } from "~features/space/space";
import { removeTwigs } from "~features/twigs/twigSlice";
import { store } from "~store";

const REMOVE_BOOKMARK = gql`
  mutation RemoveBookmark($bookmarkId: String!) {
    removeBookmark(bookmarkId: $bookmarkId) {
      twigs {
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

export const removeBookmark = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) =>
  async (bookmarkId: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo) => {
    console.log('bookmark removed', bookmarkId, removeInfo);
    
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_BOOKMARK,
        variables: {
          bookmarkId,
        },
      });
      await cachePersistor.persist()
      console.log(data);

      store.dispatch(removeTwigs({
        space: SpaceType.FRAME,
        twigs: data.removeBookmark.twigs,
      }));
      
    } catch (err) {
      console.error(err);
    }
  }