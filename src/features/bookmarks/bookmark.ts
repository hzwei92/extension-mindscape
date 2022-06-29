

export type BookmarkEntry = {
  bookmarkId: string;
  parentBookmarkId: string | null;
  degree: number;
  rank: number;
  title: string;
  url: string | null;
}