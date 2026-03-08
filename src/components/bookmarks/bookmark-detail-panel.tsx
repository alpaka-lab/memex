"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Star,
  Archive,
  Trash2,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useCollections } from "@/lib/hooks/use-collections";
import { useTags } from "@/lib/hooks/use-tags";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { BookmarkData } from "./bookmark-card";

interface BookmarkDetailPanelProps {
  bookmark: BookmarkData | null;
  onClose: () => void;
}

const NONE_VALUE = "__none__";

export function BookmarkDetailPanel({
  bookmark,
  onClose,
}: BookmarkDetailPanelProps) {
  const queryClient = useQueryClient();
  const { data: collections } = useCollections();
  const { data: allTags } = useTags();

  const [note, setNote] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch tags for this bookmark
  const { data: bookmarkTags = [], refetch: refetchTags } = useQuery<
    Array<{ id: string; name: string; color?: string | null }>
  >({
    queryKey: ["bookmark-tags", bookmark?.id],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks/${bookmark!.id}/tags`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    enabled: !!bookmark,
  });

  useEffect(() => {
    if (bookmark) {
      setNote((bookmark as BookmarkData & { note?: string }).note ?? "");
      setCollectionId(
        (bookmark as BookmarkData & { collectionId?: string }).collectionId ?? ""
      );
      setShowDeleteConfirm(false);
    }
  }, [bookmark]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/bookmarks/${bookmark!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update bookmark");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark updated");
    },
    onError: () => {
      toast.error("Failed to update bookmark");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookmarks/${bookmark!.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete bookmark");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark deleted");
      onClose();
    },
    onError: () => {
      toast.error("Failed to delete bookmark");
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/bookmarks/${bookmark!.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) throw new Error("Failed to add tag");
      return res.json();
    },
    onSuccess: () => {
      refetchTags();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/bookmarks/${bookmark!.id}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) throw new Error("Failed to remove tag");
      return res.json();
    },
    onSuccess: () => {
      refetchTags();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const handleToggleStar = useCallback(() => {
    if (!bookmark) return;
    updateMutation.mutate({
      isStarred: bookmark.isStarred ? 0 : 1,
    });
  }, [bookmark, updateMutation]);

  const handleToggleArchive = useCallback(() => {
    if (!bookmark) return;
    updateMutation.mutate({
      isArchived: bookmark.isArchived ? 0 : 1,
    });
  }, [bookmark, updateMutation]);

  const handleNoteBlur = () => {
    if (!bookmark) return;
    const currentNote =
      (bookmark as BookmarkData & { note?: string }).note ?? "";
    if (note !== currentNote) {
      updateMutation.mutate({ note: note || null });
    }
  };

  const handleCollectionChange = (value: string | null) => {
    const newValue = !value || value === NONE_VALUE ? "" : value;
    setCollectionId(newValue);
    updateMutation.mutate({ collectionId: newValue || null });
  };

  const handleToggleTag = (tagId: string) => {
    const isAttached = bookmarkTags.some((t) => t.id === tagId);
    if (isAttached) {
      removeTagMutation.mutate(tagId);
    } else {
      addTagMutation.mutate(tagId);
    }
  };

  if (!bookmark) return null;

  return (
    <Sheet open={!!bookmark} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="line-clamp-2 text-left">
            {bookmark.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* OG Image */}
          {bookmark.ogImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={bookmark.ogImage}
                alt={bookmark.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* URL */}
          <div>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              {bookmark.url}
            </a>
          </div>

          {/* Domain */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {bookmark.favicon && (
              <Image
                src={bookmark.favicon}
                alt=""
                width={16}
                height={16}
                className="rounded-sm"
                unoptimized
              />
            )}
            {bookmark.domain}
          </div>

          {/* Description */}
          {bookmark.description && (
            <p className="text-sm text-muted-foreground">
              {bookmark.description}
            </p>
          )}

          <Separator />

          {/* Star & Archive toggles */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStar}
              disabled={updateMutation.isPending}
            >
              <Star
                className={cn(
                  "mr-1.5 size-4",
                  bookmark.isStarred && "fill-yellow-400 text-yellow-400"
                )}
              />
              {bookmark.isStarred ? "Starred" : "Star"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              disabled={updateMutation.isPending}
            >
              <Archive className="mr-1.5 size-4" />
              {bookmark.isArchived ? "Unarchive" : "Archive"}
            </Button>
          </div>

          <Separator />

          {/* Collection */}
          <div className="space-y-2">
            <Label>Collection</Label>
            <Select
              value={collectionId || NONE_VALUE}
              onValueChange={handleCollectionChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>No collection</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isAttached = bookmarkTags.some((t) => t.id === tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isAttached ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.name}
                    {isAttached && <X className="ml-1 size-3" />}
                  </Badge>
                );
              })}
              {allTags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="detail-note">Note</Label>
            <Textarea
              id="detail-note"
              placeholder="Add a personal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              rows={3}
            />
          </div>

          <Separator />

          {/* Delete */}
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-destructive">
                  Delete this bookmark?
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-4" />
                  )}
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Delete bookmark
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
