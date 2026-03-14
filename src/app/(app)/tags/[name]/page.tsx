"use client";

import { useParams } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useBookmarkMutations } from "@/lib/hooks/use-bookmark-mutations";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
import { BulkActionBar } from "@/components/bookmarks/bulk-action-bar";
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
  const { detailBookmarkId, openDetail, closeDetail } = useModalStore();
  const { selectedIds, toggle: toggleSelection, isSelecting } =
    useSelectionStore();

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

  const { toggleStar, archiveBookmark, deleteBookmark } =
    useBookmarkMutations(bookmarks);

  const selectedBookmark =
    bookmarks.find((b) => b.id === detailBookmarkId) ?? null;
  const allIds = bookmarks.map((b) => b.id);

  const handleClick = (bookmark: BookmarkData) => {
    if (isSelecting) {
      toggleSelection(bookmark.id);
    } else {
      openDetail(bookmark.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{tagName}</h1>
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

      <BulkActionBar totalCount={bookmarks.length} allIds={allIds} />

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              selected={selectedIds.has(bookmark.id)}
              onSelect={toggleSelection}
              onClick={handleClick}
              onEdit={(id) => openDetail(id)}
              onToggleStar={(id) => toggleStar.mutate(id)}
              onArchive={(id) => archiveBookmark.mutate(id)}
              onDelete={(id) => deleteBookmark.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark}
              selected={selectedIds.has(bookmark.id)}
              onSelect={toggleSelection}
              onClick={handleClick}
              onEdit={(id) => openDetail(id)}
              onToggleStar={(id) => toggleStar.mutate(id)}
              onArchive={(id) => archiveBookmark.mutate(id)}
              onDelete={(id) => deleteBookmark.mutate(id)}
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

      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </div>
  );
}
