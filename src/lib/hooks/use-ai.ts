"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TagSuggestion {
  name: string;
  confidence: number;
}

export function useAiGenerateTags() {
  return useMutation({
    mutationFn: async (bookmarkId: string) => {
      const res = await fetch("/api/ai/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate tags");
      }
      return res.json() as Promise<{ suggestions: TagSuggestion[] }>;
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAiGenerateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookmarkId: string) => {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate summary");
      }
      return res.json() as Promise<{ summary: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAiApplyTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookmarkId, tags }: { bookmarkId: string; tags: string[] }) => {
      const res = await fetch("/api/ai/apply-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkId, tags }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to apply tags");
      }
      return res.json() as Promise<{ applied: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
