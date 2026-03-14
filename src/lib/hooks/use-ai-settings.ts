"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AiSettings {
  provider: string | null;
  hasApiKey: boolean;
  autoTagEnabled: boolean;
  autoSummaryEnabled: boolean;
}

interface UpdateAiSettings {
  provider?: string;
  apiKey?: string;
  autoTagEnabled?: boolean;
  autoSummaryEnabled?: boolean;
}

export function useAiSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<AiSettings>({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/ai");
      if (!res.ok) throw new Error("Failed to fetch AI settings");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAiSettings) => {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update AI settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("AI settings saved");
    },
    onError: () => {
      toast.error("Failed to save AI settings");
    },
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
