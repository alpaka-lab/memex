"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useModalStore } from "@/lib/stores/modal-store";
import { useCollections } from "@/lib/hooks/use-collections";
import { useTags } from "@/lib/hooks/use-tags";
import { useAiSettings } from "@/lib/hooks/use-ai-settings";
import { useAiGenerateTags, useAiGenerateSummary, useAiApplyTags } from "@/lib/hooks/use-ai";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MetadataResponse {
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
  domain?: string;
}

export function QuickAddModal() {
  const { isQuickAddOpen, closeQuickAdd } = useModalStore();
  const queryClient = useQueryClient();
  const { data: collections } = useCollections();
  const { data: tags } = useTags();
  const { data: aiSettings } = useAiSettings();
  const generateTagsMutation = useAiGenerateTags();
  const generateSummaryMutation = useAiGenerateSummary();
  const applyTagsMutation = useAiApplyTags();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [favicon, setFavicon] = useState("");
  const [domain, setDomain] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isQuickAddOpen) {
          closeQuickAdd();
        } else {
          useModalStore.getState().openQuickAdd();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isQuickAddOpen, closeQuickAdd]);

  const resetForm = useCallback(() => {
    setUrl("");
    setTitle("");
    setDescription("");
    setOgImage("");
    setFavicon("");
    setDomain("");
    setCollectionId("");
    setSelectedTags([]);
    setNote("");
    setMetadataFetched(false);
  }, []);

  const fetchMetadata = useCallback(async (inputUrl: string) => {
    if (!inputUrl) return;

    try {
      new URL(inputUrl);
    } catch {
      return;
    }

    setIsFetchingMetadata(true);
    try {
      const res = await fetch(
        `/api/metadata?url=${encodeURIComponent(inputUrl)}`
      );
      if (!res.ok) throw new Error("Failed to fetch metadata");

      const data: MetadataResponse = await res.json();
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setOgImage(data.ogImage ?? "");
      setFavicon(data.favicon ?? "");
      setDomain(data.domain ?? "");
      setMetadataFetched(true);
    } catch {
      toast.error("Could not fetch metadata for this URL");
    } finally {
      setIsFetchingMetadata(false);
    }
  }, []);

  const handleUrlBlur = () => {
    if (url && !metadataFetched) {
      fetchMetadata(url);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && url && !metadataFetched) {
      e.preventDefault();
      fetchMetadata(url);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: title || url,
          description: description || null,
          ogImage: ogImage || null,
          favicon: favicon || null,
          domain: domain || new URL(url).hostname,
          note: note || null,
          collectionId: collectionId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save bookmark");
      return res.json();
    },
    onSuccess: async (bookmark) => {
      // Add tags to the bookmark
      for (const tagId of selectedTags) {
        await fetch(`/api/bookmarks/${bookmark.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark saved");

      // Fire-and-forget AI features
      if (aiSettings?.hasApiKey && aiSettings?.provider) {
        if (aiSettings.autoTagEnabled) {
          generateTagsMutation.mutate(bookmark.id, {
            onSuccess: (data) => {
              if (data.suggestions.length > 0) {
                const tagNames = data.suggestions.map((s) => s.name);
                applyTagsMutation.mutate(
                  { bookmarkId: bookmark.id, tags: tagNames },
                  { onSuccess: () => toast.success(`AI suggested ${tagNames.length} tags`) }
                );
              }
            },
          });
        }
        if (aiSettings.autoSummaryEnabled) {
          generateSummaryMutation.mutate(bookmark.id, {
            onSuccess: () => toast.success("AI summary generated"),
          });
        }
      }

      resetForm();
      closeQuickAdd();
    },
    onError: () => {
      toast.error("Failed to save bookmark");
    },
  });

  const handleSave = () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    saveMutation.mutate();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      closeQuickAdd();
    }
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setMetadataFetched(false);
                }}
                onBlur={handleUrlBlur}
                onKeyDown={handleUrlKeyDown}
                autoFocus
              />
              {isFetchingMetadata && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Metadata Preview */}
          {metadataFetched && ogImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={ogImage}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Page title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Page description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Collection */}
          <div className="space-y-2">
            <Label>Collection</Label>
            <Select value={collectionId} onValueChange={(value) => setCollectionId(value ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
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
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                  {selectedTags.includes(tag.id) && (
                    <X className="ml-1 size-3" />
                  )}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Add a personal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!url || saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
