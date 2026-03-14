"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Bookmark {
  id: string;
  isStarred: boolean | number;
  isArchived: boolean | number;
}

export function useBookmarkMutations(bookmarks: Bookmark[]) {
  const queryClient = useQueryClient();

  const toggleStar = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: bookmark?.isStarred ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed to toggle star");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const archiveBookmark = useMutation({
    mutationFn: async (id: string) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: bookmark?.isArchived ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("Failed to archive");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark archived");
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark deleted");
    },
  });

  return { toggleStar, archiveBookmark, deleteBookmark };
}
