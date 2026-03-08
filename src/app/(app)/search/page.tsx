"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  id: string;
  url: string;
  title: string;
  description: string | null;
  note: string | null;
  ogImage: string | null;
  favicon: string | null;
  domain: string;
  createdAt: string;
  titleSnippet: string;
  descriptionSnippet: string;
  noteSnippet: string;
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");

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

      {query && !isLoading && results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {results.map((result) => (
              <a
                key={result.id}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <h3
                  className="text-sm font-semibold"
                  dangerouslySetInnerHTML={{ __html: result.titleSnippet || result.title }}
                />
                {result.descriptionSnippet && (
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.descriptionSnippet }}
                  />
                )}
                {result.noteSnippet && (
                  <p
                    className="mt-1 text-xs italic text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.noteSnippet }}
                  />
                )}
                <span className="mt-2 block text-xs text-muted-foreground">
                  {result.domain}
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
