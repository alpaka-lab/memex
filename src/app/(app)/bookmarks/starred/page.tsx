"use client";

import { Star } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/use-bookmarks";
import { useViewStore } from "@/lib/stores/view-store";
import { BookmarkListView } from "@/components/bookmarks/bookmark-list-view";
import { BookmarkCardSkeleton } from "@/components/bookmarks/bookmark-card-skeleton";
import { BookmarkRowSkeleton } from "@/components/bookmarks/bookmark-row-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

export default function StarredPage() {
  const { view } = useViewStore();
  const {
    data: bookmarks,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useBookmarks({ starred: true });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Starred</h1>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookmarkCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
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
        <h1 className="text-2xl font-bold">Starred</h1>
        <EmptyState
          icon={Star}
          title="No starred bookmarks"
          description="Star your favorite bookmarks to find them quickly here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Starred</h1>
      <BookmarkListView bookmarks={bookmarks as BookmarkData[]} />

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
