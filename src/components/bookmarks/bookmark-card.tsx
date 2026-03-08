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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={() => onClick?.(bookmark)}
    >
      {/* Thumbnail */}
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {bookmark.ogImage ? (
            <Image
              src={bookmark.ogImage}
              alt={bookmark.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-3xl font-bold uppercase">
                {bookmark.domain.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {/* Title */}
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {bookmark.title}
        </h3>

        {/* Description */}
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {bookmark.description}
          </p>
        )}

        {/* Domain */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {bookmark.favicon && (
            <Image
              src={bookmark.favicon}
              alt=""
              width={14}
              height={14}
              className="rounded-sm"
              unoptimized
            />
          )}
          <span className="truncate">{bookmark.domain}</span>
        </div>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-3 pt-0">
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
      </CardFooter>
    </Card>
  );
}
