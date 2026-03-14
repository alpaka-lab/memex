"use client";

import Image from "next/image";
import {
  Star,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookmarkData } from "./bookmark-card";

interface BookmarkRowProps {
  bookmark: BookmarkData;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (bookmark: BookmarkData) => void;
}

export function BookmarkRow({
  bookmark,
  selected,
  onSelect,
  onToggleStar,
  onEdit,
  onArchive,
  onDelete,
  onClick,
}: BookmarkRowProps) {
  const formattedDate = new Date(bookmark.createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  );

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/50",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onClick?.(bookmark)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <button
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(bookmark.id);
          }}
        >
          {selected && (
            <svg className="size-3" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {/* Favicon */}
      <div className="flex size-5 shrink-0 items-center justify-center">
        {bookmark.favicon ? (
          <Image
            src={bookmark.favicon}
            alt=""
            width={16}
            height={16}
            className="rounded-sm"
            unoptimized
          />
        ) : (
          <ExternalLink className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {bookmark.title}
      </span>

      {/* Domain */}
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {bookmark.domain}
      </span>

      {/* Tags */}
      <div className="hidden items-center gap-1 md:flex">
        {bookmark.tags?.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="rounded-md px-1.5 py-0 text-[10px] font-medium"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Date */}
      <span className="hidden shrink-0 text-xs text-muted-foreground lg:inline">
        {formattedDate}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(bookmark.id);
          }}
        >
          <Star
            className={cn(
              "size-3.5",
              bookmark.isStarred
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-6 cursor-pointer items-center justify-center rounded-md opacity-0 outline-none transition-opacity hover:bg-accent group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(bookmark.url);
                toast.success("Link copied");
              }}
            >
              <Copy className="mr-2 size-3.5" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(bookmark.id);
              }}
            >
              <Pencil className="mr-2 size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.(bookmark.id);
              }}
            >
              <Archive className="mr-2 size-3.5" />
              {bookmark.isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(bookmark.id);
              }}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
