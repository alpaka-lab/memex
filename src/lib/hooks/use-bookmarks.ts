"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

interface BookmarkFilters {
  collectionId?: string | null;
  tag?: string | null;
  starred?: boolean;
  archived?: boolean;
  search?: string | null;
  sort?: string | null;
}

interface BookmarkResponse {
  data: Array<{
    id: string;
    url: string;
    title: string;
    description?: string | null;
    ogImage?: string | null;
    favicon?: string | null;
    domain: string;
    note?: string | null;
    collectionId?: string | null;
    isStarred: boolean | number;
    isArchived: boolean | number;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  }>;
  nextCursor: string | null;
}

export function useBookmarks(filters: BookmarkFilters = {}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<BookmarkResponse>({
    queryKey: ["bookmarks", filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();

      if (filters.collectionId) params.set("collectionId", filters.collectionId);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.starred) params.set("starred", "1");
      if (filters.archived) params.set("archived", "1");
      if (filters.search) params.set("search", filters.search);
      if (filters.sort) params.set("sort", filters.sort);
      if (pageParam) params.set("cursor", pageParam as string);
      params.set("limit", "20");

      const res = await fetch(`/api/bookmarks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const bookmarks = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    data: bookmarks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  };
}
