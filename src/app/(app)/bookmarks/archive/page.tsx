"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive } from "lucide-react";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
import { BookmarkCardSkeleton } from "@/components/bookmarks/bookmark-card-skeleton";
import { BookmarkRowSkeleton } from "@/components/bookmarks/bookmark-row-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

export default function ArchivePage() {
  const { view } = useViewStore();
  const { detailBookmarkId, openDetail, closeDetail } = useModalStore();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["bookmarks", "archived"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ archived: "1" });
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/bookmarks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch archived bookmarks");
      return res.json() as Promise<{ data: BookmarkData[]; nextCursor: string | null }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const bookmarks = data?.pages.flatMap((page) => page.data) ?? [];
  const selectedBookmark = bookmarks.find((b) => b.id === detailBookmarkId) ?? null;

  const toggleStar = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: bookmark?.isStarred ? 0 : 1 }),
      });
      if (!res.ok) throw new Error('Failed to toggle star');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const archiveBookmark = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: bookmark?.isArchived ? 0 : 1 }),
      });
      if (!res.ok) throw new Error('Failed to archive');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark archived');
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark deleted');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Archive</h1>
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
        <h1 className="text-2xl font-bold">Archive</h1>
        <EmptyState
          icon={Archive}
          title="No archived bookmarks"
          description="Bookmarks you archive will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Archive</h1>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onClick={(b) => openDetail(b.id)}
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
              onClick={(b) => openDetail(b.id)}
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
