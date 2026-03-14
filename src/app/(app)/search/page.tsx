"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileSearch } from "lucide-react";
import { useViewStore } from "@/lib/stores/view-store";
import { useModalStore } from "@/lib/stores/modal-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useBookmarkMutations } from "@/lib/hooks/use-bookmark-mutations";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { BookmarkDetailPanel } from "@/components/bookmarks/bookmark-detail-panel";
import { BulkActionBar } from "@/components/bookmarks/bulk-action-bar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookmarkData } from "@/components/bookmarks/bookmark-card";

interface SearchResult {
  id: string;
  url: string;
  title: string;
  description: string | null;
  note: string | null;
  ogImage: string | null;
  favicon: string | null;
  domain: string;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  titleSnippet: string;
  descriptionSnippet: string;
  noteSnippet: string;
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const { view } = useViewStore();
  const { detailBookmarkId, openDetail, closeDetail } = useModalStore();
  const { selectedIds, toggle: toggleSelection, isSelecting } =
    useSelectionStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<SearchResult[]>;
    },
    enabled: query.length > 0,
  });

  const results = data ?? [];
  const bookmarks: BookmarkData[] = results.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    description: r.description,
    ogImage: r.ogImage,
    favicon: r.favicon,
    domain: r.domain,
    isStarred: r.isStarred,
    isArchived: r.isArchived,
    createdAt: r.createdAt,
  }));

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bookmarks..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {!query && (
        <EmptyState
          icon={Search}
          title="Start typing to search"
          description="Search across your bookmark titles, descriptions, and notes."
        />
      )}

      {query && isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      )}

      {query && !isLoading && results.length === 0 && (
        <EmptyState
          icon={FileSearch}
          title="No results found"
          description={`No bookmarks match "${query}". Try a different search term.`}
        />
      )}

      {query && !isLoading && bookmarks.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {bookmarks.length} result{bookmarks.length !== 1 ? "s" : ""}
          </p>

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
        </>
      )}

      <BookmarkDetailPanel
        bookmark={selectedBookmark as BookmarkData | null}
        onClose={closeDetail}
      />
    </div>
  );
}
