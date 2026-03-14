"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Star,
  Clock,
  Archive,
  FolderOpen,
  Tag,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  Settings,
  Brain,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useCollections } from "@/lib/hooks/use-collections";
import { useTags } from "@/lib/hooks/use-tags";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/bookmarks", label: "All Bookmarks", icon: Bookmark },
  { href: "/bookmarks/starred", label: "Starred", icon: Star },
  { href: "/bookmarks/recent", label: "Recent", icon: Clock },
  { href: "/bookmarks/archive", label: "Archive", icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) close();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:relative md:z-auto md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:-ml-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/bookmarks"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Brain className="size-5" />
            <span>Memex</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 md:hidden"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-3">
          {/* Main navigation */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/bookmarks" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Collections section */}
          <div className="mt-6 flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-3 py-1.5">
              <button
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground"
                onClick={() => setCollectionsExpanded(!collectionsExpanded)}
              >
                {collectionsExpanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                Collections
              </button>
              <Link href="/collections" onClick={handleLinkClick}>
                <Button variant="ghost" size="icon" className="size-5">
                  <Plus className="size-3" />
                </Button>
              </Link>
            </div>

            {collectionsExpanded && (
              <>
                {collectionsLoading ? (
                  <div className="space-y-1 px-3">
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-3/4" />
                  </div>
                ) : collections.length === 0 ? (
                  <Link
                    href="/collections"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <FolderOpen className="size-4" />
                    <span>New Collection</span>
                  </Link>
                ) : (
                  collections.map((collection) => {
                    const isActive = pathname === `/collections/${collection.id}`;
                    return (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <span className="flex size-4 items-center justify-center text-sm">
                          {collection.icon || <FolderOpen className="size-4" />}
                        </span>
                        <span className="truncate">{collection.name}</span>
                      </Link>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Tags section */}
          <div className="mt-6 flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-3 py-1.5">
              <button
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground"
                onClick={() => setTagsExpanded(!tagsExpanded)}
              >
                {tagsExpanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                Tags
              </button>
              <Link href="/tags" onClick={handleLinkClick}>
                <Button variant="ghost" size="icon" className="size-5">
                  <Plus className="size-3" />
                </Button>
              </Link>
            </div>

            {tagsExpanded && (
              <>
                {tagsLoading ? (
                  <div className="space-y-1 px-3">
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-3/4" />
                  </div>
                ) : tags.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground/50">
                    <Tag className="mb-0.5 mr-1 inline size-3" />
                    No tags yet
                  </div>
                ) : (
                  tags.map((tag) => {
                    const isActive =
                      pathname === `/tags/${encodeURIComponent(tag.name)}`;
                    return (
                      <Link
                        key={tag.id}
                        href={`/tags/${encodeURIComponent(tag.name)}`}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {tag.color ? (
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        ) : (
                          <Hash className="size-3.5" />
                        )}
                        <span className="truncate">{tag.name}</span>
                      </Link>
                    );
                  })
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Settings link at bottom */}
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
