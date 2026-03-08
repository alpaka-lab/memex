"use client";

import Image from "next/image";
import {
  Star,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookmarkData } from "./bookmark-card";

interface BookmarkRowProps {
  bookmark: BookmarkData;
  onToggleStar?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (bookmark: BookmarkData) => void;
}

export function BookmarkRow({
  bookmark,
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
      className="group flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted/50"
      onClick={() => onClick?.(bookmark)}
    >
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
          <span className="text-xs font-bold uppercase text-muted-foreground">
            {bookmark.domain.charAt(0)}
          </span>
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
          <Badge key={tag} variant="secondary" className="text-[10px]">
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
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(bookmark.id);
          }}
        >
          <Star
            className={cn(
              "size-3.5",
              bookmark.isStarred && "fill-yellow-400 text-yellow-400"
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-6 cursor-pointer items-center justify-center rounded-md opacity-0 outline-none hover:bg-muted group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
