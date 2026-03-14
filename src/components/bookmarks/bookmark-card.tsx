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

export interface BookmarkData {
  id: string;
  url: string;
  title: string;
  description?: string | null;
  ogImage?: string | null;
  favicon?: string | null;
  domain: string;
  tags?: string[];
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
}

interface BookmarkCardProps {
  bookmark: BookmarkData;
  onToggleStar?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (bookmark: BookmarkData) => void;
}

export function BookmarkCard({
  bookmark,
  onToggleStar,
  onEdit,
  onArchive,
  onDelete,
  onClick,
}: BookmarkCardProps) {
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
      onClick={() => onClick?.(bookmark)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {bookmark.ogImage ? (
          <Image
            src={bookmark.ogImage}
            alt={bookmark.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl font-bold uppercase text-muted-foreground/30">
              {bookmark.domain.charAt(0)}
            </span>
          </div>
        )}

        {/* Star overlay */}
        <button
          className={cn(
            "absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all",
            bookmark.isStarred
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
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
                : "text-foreground"
            )}
          />
        </button>
      </div>

      <div className="p-3">
        {/* Domain */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {bookmark.favicon ? (
            <Image
              src={bookmark.favicon}
              alt=""
              width={14}
              height={14}
              className="rounded-sm"
              unoptimized
            />
          ) : (
            <ExternalLink className="size-3" />
          )}
          <span className="truncate">{bookmark.domain}</span>
        </div>

        {/* Title */}
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug">
          {bookmark.title}
        </h3>

        {/* Description */}
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {bookmark.description}
          </p>
        )}

        {/* Tags + Actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-1 overflow-hidden">
            {bookmark.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-[10px] font-medium"
              >
                {tag}
              </Badge>
            ))}
            {(bookmark.tags?.length ?? 0) > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{(bookmark.tags?.length ?? 0) - 3}
              </span>
            )}
          </div>

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
    </div>
  );
}
