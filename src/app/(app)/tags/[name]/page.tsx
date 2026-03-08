"use client";

import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useViewStore } from "@/lib/stores/view-store";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkCardSkeleton } from "@/components/bookmarks/bookmark-card-skeleton";
import { BookmarkRowSkeleton } from "@/components/bookmarks/bookmark-row-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

interface TagData {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export default function TagPage() {
  const { name } = useParams<{ name: string }>();
  const tagName = decodeURIComponent(name);
  const { view } = useViewStore();

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json() as Promise<TagData[]>;
    },
  });

  const tagData = tags?.find((t) => t.name === tagName);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["bookmarks", "tag", tagName],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ tag: tagName });
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/bookmarks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json() as Promise<{ data: BookmarkData[]; nextCursor: string | null }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const bookmarks = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{tagName}</h1>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookmarkCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookmarkRowSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Tag className="size-6" />
          {tagName}
          {tagData?.color && (
            <Badge style={{ backgroundColor: tagData.color }} className="text-white">
              {tagName}
            </Badge>
          )}
        </h1>
        <EmptyState
          icon={Tag}
          title="No bookmarks with this tag"
          description={`No bookmarks have been tagged with "${tagName}".`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Tag className="size-6" />
        {tagName}
        {tagData?.color && (
          <Badge style={{ backgroundColor: tagData.color }} className="text-white">
            {tagName}
          </Badge>
        )}
      </h1>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onClick={(b) => window.open(b.url, "_blank")}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark}
              onClick={(b) => window.open(b.url, "_blank")}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
