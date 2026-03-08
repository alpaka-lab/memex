"use client";

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
  X,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/bookmarks", label: "All Bookmarks", icon: Bookmark },
  { href: "/bookmarks/starred", label: "Starred", icon: Star },
  { href: "/bookmarks/recent", label: "Recent", icon: Clock },
  { href: "/bookmarks/archive", label: "Archive", icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:relative md:z-auto md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:-ml-64"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/bookmarks" className="text-lg font-semibold">
            Memex
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-2">
          {/* Main navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/bookmarks" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) close();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3" />

          {/* Collections section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
                Collections
              </span>
              <Button variant="ghost" size="icon-xs">
                <Plus className="size-3" />
              </Button>
            </div>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <FolderOpen className="size-4" />
              <span>+ New Collection</span>
            </button>
          </div>

          <Separator className="my-3" />

          {/* Tags section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-semibold uppercase text-sidebar-foreground/50">
                Tags
              </span>
              <ChevronRight className="size-3 text-sidebar-foreground/50" />
            </div>
            <div className="px-3 py-2 text-xs text-sidebar-foreground/40">
              <Tag className="mb-1 inline size-3" /> Tags will appear here
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Settings link at bottom */}
        <div className="p-3">
          <Link
            href="/settings"
            onClick={() => {
              if (window.innerWidth < 768) close();
            }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
