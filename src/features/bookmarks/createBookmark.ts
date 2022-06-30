import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { addTwigs } from "~features/twigs/twigSlice";
import { addTwigUsers } from "~features/user/userSlice";
import { store } from "~store";
import type { BookmarkEntry } from "./bookmark";

const CREATE_BOOKMARK = gql`
  mutation CreateBookmark($bookmark: BookmarkEntry!) {
    createBookmark(bookmark: $bookmark) {
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

export const createBookmark = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (bookmarkId: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
    console.log('bookmark created');

    const bookmarkEntry: BookmarkEntry = {
      bookmarkId,
      parentBookmarkId: bookmark.parentId,
      degree:  1,
      rank: bookmark.index + 1,
      title: bookmark.title,
      url: bookmark.url,
    };

    try {
      const { data } = await client.mutate({
        mutation: CREATE_BOOKMARK,
        variables: {
          bookmark: bookmarkEntry,
        },
      });
      await cachePersistor.persist()
      console.log(data);

      store.dispatch(addTwigs({
        space: SpaceType.FRAME,
        twigs: [data.createBookmark.twig],
      }));

      store.dispatch(addTwigUsers({
        space: SpaceType.FRAME,
        twigs: [data.createBookmark.twig],
      }));

    } catch (err) {
      console.error(err);
    }
  }