"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/use-bookmarks";
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
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

function groupBookmarksByDate(bookmarks: BookmarkData[]) {
  const groups: Record<string, BookmarkData[]> = {};
  const order = ["Today", "Yesterday", "This Week", "Older"];

  for (const bookmark of bookmarks) {
    const group = getDateGroup(bookmark.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(bookmark);
  }

  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, bookmarks: groups[label] }));
}

export default function RecentPage() {
  const { view } = useViewStore();
  const { detailBookmarkId, openDetail, closeDetail } = useModalStore();
  const { selectedIds, toggle: toggleSelection, isSelecting } =
    useSelectionStore();

  const { data: bookmarks, isLoading } = useBookmarks({});
  const grouped = useMemo(
    () => groupBookmarksByDate(bookmarks as BookmarkData[]),
    [bookmarks]
  );

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
        <h1 className="text-2xl font-bold">Recent</h1>
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
        <h1 className="text-2xl font-bold">Recent</h1>
        <EmptyState
          icon={Clock}
          title="No recent bookmarks"
          description="Bookmarks you add will appear here sorted by date."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recent</h1>

      <BulkActionBar totalCount={bookmarks.length} allIds={allIds} />

      {grouped.map((group) => (
        <div key={group.label} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.label}
          </h2>

          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.bookmarks.map((bookmark) => (
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
              {group.bookmarks.map((bookmark) => (
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
        </div>
      ))}

      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </div>
  );
}
