"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Star,
  StarOff,
  Trash2,
  FolderInput,
  X,
  CheckSquare,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useCollections } from "@/lib/hooks/use-collections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionBarProps {
  totalCount: number;
  allIds: string[];
}

export function BulkActionBar({ totalCount, allIds }: BulkActionBarProps) {
  const { selectedIds, selectAll, clear } = useSelectionStore();
  const { data: collections } = useCollections();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const count = selectedIds.size;

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      data,
    }: {
      action: string;
      data?: { collectionId?: string | null };
    }) => {
      const res = await fetch("/api/bookmarks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action, data }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return res.json();
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      clear();
      setConfirmDelete(false);

      const labels: Record<string, string> = {
        delete: "deleted",
        archive: "archived",
        unarchive: "unarchived",
        star: "starred",
        unstar: "unstarred",
        move: "moved",
      };
      toast.success(
        `${result.affected} bookmark${result.affected > 1 ? "s" : ""} ${labels[variables.action] ?? "updated"}`
      );
    },
    onError: () => {
      toast.error("Bulk action failed");
    },
  });

  if (count === 0) return null;

  const allSelected = count === totalCount && totalCount > 0;

  return (
    <div className="sticky top-14 z-20 flex items-center gap-2 rounded-lg border bg-background/95 px-4 py-2 shadow-sm backdrop-blur-sm">
      {/* Select all / deselect */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (allSelected ? clear() : selectAll(allIds))}
      >
        <CheckSquare className="mr-1.5 size-4" />
        {allSelected ? "Deselect all" : "Select all"}
      </Button>

      <span className="text-sm text-muted-foreground">
        {count} selected
      </span>

      <div className="mx-2 h-5 w-px bg-border" />

      {/* Actions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => bulkMutation.mutate({ action: "star" })}
        disabled={bulkMutation.isPending}
      >
        <Star className="mr-1.5 size-4" />
        Star
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => bulkMutation.mutate({ action: "unstar" })}
        disabled={bulkMutation.isPending}
      >
        <StarOff className="mr-1.5 size-4" />
        Unstar
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => bulkMutation.mutate({ action: "archive" })}
        disabled={bulkMutation.isPending}
      >
        <Archive className="mr-1.5 size-4" />
        Archive
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => bulkMutation.mutate({ action: "unarchive" })}
        disabled={bulkMutation.isPending}
      >
        <ArchiveRestore className="mr-1.5 size-4" />
        Unarchive
      </Button>

      {/* Move to collection */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          disabled={bulkMutation.isPending}
        >
          <FolderInput className="size-4" />
          Move
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              bulkMutation.mutate({ action: "move", data: { collectionId: null } })
            }
          >
            No collection
          </DropdownMenuItem>
          {collections.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() =>
                bulkMutation.mutate({ action: "move", data: { collectionId: c.id } })
              }
            >
              {c.icon ? `${c.icon} ` : ""}{c.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkMutation.mutate({ action: "delete" })}
            disabled={bulkMutation.isPending}
          >
            <Trash2 className="mr-1.5 size-4" />
            Confirm ({count})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
          disabled={bulkMutation.isPending}
        >
          <Trash2 className="mr-1.5 size-4" />
          Delete
        </Button>
      )}

      {/* Close */}
      <div className="ml-auto">
        <Button variant="ghost" size="icon" className="size-7" onClick={clear}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
