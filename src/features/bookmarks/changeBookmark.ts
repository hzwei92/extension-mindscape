import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import type { CachePersistor } from "apollo3-cache-persist";
import { SpaceType } from "~features/space/space";
import { FULL_TWIG_FIELDS } from "~features/twigs/twigFragments";
import { store } from "~store";

const CHANGE_BOOKMARK = gql`
  mutation ChangeBookmark($bookmarkId: String!, $title: String!, $url: String) {
    changeBookmark(bookmarkId: $bookmarkId, title: $title, url: $url) {
      ...FullTwigFields
    }
  }
  ${FULL_TWIG_FIELDS}
`
export const changeBookmark = (client: ApolloClient<NormalizedCacheObject>, cachePersistor: CachePersistor<NormalizedCacheObject>) => 
  async (bookmarkId: string, changeInfo: chrome.bookmarks.BookmarkChangeInfo) => {
    try {
      const { data } = await client.mutate({
        mutation: CHANGE_BOOKMARK,
        variables: {
          bookmarkId,
          title: changeInfo.title,
          url: changeInfo.url
        },
      });
      await cachePersistor.persist();
      console.log(data);
      
    } catch (err) {
      console.error(err);
    }
  }