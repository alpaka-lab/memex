"use client";

import { useCallback } from "react";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useBookmarkMutations } from "@/lib/hooks/use-bookmark-mutations";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
import { BulkActionBar } from "@/components/bookmarks/bulk-action-bar";
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

interface BookmarkListViewProps {
  bookmarks: BookmarkData[];
}

export function BookmarkListView({ bookmarks }: BookmarkListViewProps) {
  const { view } = useViewStore();
  const { detailBookmarkId, openDetail, closeDetail } = useModalStore();
  const { selectedIds, toggle: toggleSelection, isSelecting } =
    useSelectionStore();
  const { toggleStar, archiveBookmark, deleteBookmark } =
    useBookmarkMutations(bookmarks);

  const handleClick = useCallback(
    (bookmark: BookmarkData) => {
      if (isSelecting) {
        toggleSelection(bookmark.id);
      } else {
        openDetail(bookmark.id);
      }
    },
    [isSelecting, toggleSelection, openDetail]
  );

  const selectedBookmark =
    bookmarks.find((b) => b.id === detailBookmarkId) ?? null;
  const allIds = bookmarks.map((b) => b.id);

  return (
    <>
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

      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </>
  );
}
