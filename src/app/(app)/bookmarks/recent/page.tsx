"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useMemo } from "react";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
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
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks?limit=50");
      if (!res.ok) throw new Error("Failed to fetch recent bookmarks");
      return res.json() as Promise<{ data: BookmarkData[]; nextCursor: string | null }>;
    },
  });

  const bookmarks = useMemo(() => data?.data ?? [], [data]);
  const grouped = useMemo(() => groupBookmarksByDate(bookmarks), [bookmarks]);
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
        <h1 className="text-2xl font-bold">Recent</h1>
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

      {grouped.map((group) => (
        <div key={group.label} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.label}
          </h2>

          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.bookmarks.map((bookmark) => (
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
              {group.bookmarks.map((bookmark) => (
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
        </div>
      ))}

      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </div>
  );
}
