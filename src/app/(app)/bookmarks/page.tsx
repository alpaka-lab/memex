"use client";

import { useEffect, useRef, useCallback } from "react";
import { Plus, Bookmark } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useBookmarks } from "@/lib/hooks/use-bookmarks";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";

import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkCardSkeleton } from "@/components/bookmarks/bookmark-card-skeleton";
import { BookmarkRowSkeleton } from "@/components/bookmarks/bookmark-row-skeleton";
import { QuickAddModal } from "@/components/bookmarks/quick-add-modal";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

export default function BookmarksPage() {
  const { view, sort } = useViewStore();
  const { openQuickAdd, detailBookmarkId, openDetail, closeDetail } =
    useModalStore();

  const {
    data: bookmarks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBookmarks({ sort });

  const queryClient = useQueryClient();

  const toggleStar = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: bookmark?.isStarred ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed to toggle star");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const archiveBookmark = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: bookmark?.isArchived ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed to archive");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark archived");
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark deleted");
    },
  });

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBookmarkClick = useCallback(
    (bookmark: BookmarkData) => {
      openDetail(bookmark.id);
    },
    [openDetail]
  );

  const selectedBookmark =
    bookmarks.find((b) => b.id === detailBookmarkId) ?? null;

  // Skeleton count for initial load
  const skeletonCount = 6;

  return (
    <>
      {/* Loading state */}
      {isLoading && (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <BookmarkCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <BookmarkRowSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Save your first bookmark by clicking the button below or pressing Cmd+K."
          actionLabel="Add Bookmark"
          onAction={openQuickAdd}
        />
      )}

      {/* Bookmarks grid */}
      {!isLoading && bookmarks.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark as BookmarkData}
              onClick={handleBookmarkClick}
              onEdit={(id) => openDetail(id)}
              onToggleStar={(id) => toggleStar.mutate(id)}
              onArchive={(id) => archiveBookmark.mutate(id)}
              onDelete={(id) => deleteBookmark.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Bookmarks list */}
      {!isLoading && bookmarks.length > 0 && view === "list" && (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark as BookmarkData}
              onClick={handleBookmarkClick}
              onEdit={(id) => openDetail(id)}
              onToggleStar={(id) => toggleStar.mutate(id)}
              onArchive={(id) => archiveBookmark.mutate(id)}
              onDelete={(id) => deleteBookmark.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="py-4">
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <BookmarkCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <BookmarkRowSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* FAB for mobile */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg md:hidden"
        onClick={openQuickAdd}
      >
        <Plus className="size-6" />
      </Button>

      {/* Quick Add Modal */}
      <QuickAddModal />

      {/* Bookmark Detail Panel */}
      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </>
  );
}
