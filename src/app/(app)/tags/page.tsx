"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Pencil, Trash2, Hash } from "lucide-react";
import { useTags } from "@/lib/hooks/use-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export default function TagsPage() {
  const router = useRouter();
  const { data: tags, isLoading, create, update, delete: deleteTag, isCreating, isUpdating, isDeleting } = useTags();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [editId, setEditId] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const resetForm = () => {
    setName("");
    setColor("");
    setEditId("");
    setDeleteId("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create({ name: name.trim(), color: color || undefined });
    setCreateOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!name.trim() || !editId) return;
    await update({ id: editId, name: name.trim(), color: color || undefined });
    setEditOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTag(deleteId);
    setDeleteOpen(false);
    resetForm();
  };

  const openEdit = (tag: { id: string; name: string; color?: string | null }) => {
    setEditId(tag.id);
    setName(tag.name);
    setColor(tag.color ?? "");
    setEditOpen(true);
  };

  const openDelete = (tag: { id: string; name: string }) => {
    setDeleteId(tag.id);
    setName(tag.name);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tags</h1>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 size-4" />
          New Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No tags yet"
          description="Create tags to organize and categorize your bookmarks."
          actionLabel="New Tag"
          onAction={() => { resetForm(); setCreateOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3"
                onClick={() => router.push(`/tags/${encodeURIComponent(tag.name)}`)}
              >
                {tag.color ? (
                  <span
                    className="size-4 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                ) : (
                  <Hash className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm font-medium">{tag.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => openEdit(tag)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => openDelete(tag)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>Add a new tag for your bookmarks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                placeholder="Tag name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`size-7 rounded-full transition-all ${color === c ? "ring-2 ring-ring ring-offset-2" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(color === c ? "" : c)}
                  />
                ))}
              </div>
              {color && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Preview:
                  <Badge style={{ backgroundColor: color }} className="text-white">
                    {name || "tag"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update this tag&apos;s name or color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Name</Label>
              <Input
                id="edit-tag-name"
                placeholder="Tag name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`size-7 rounded-full transition-all ${color === c ? "ring-2 ring-ring ring-offset-2" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(color === c ? "" : c)}
                  />
                ))}
              </div>
              {color && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Preview:
                  <Badge style={{ backgroundColor: color }} className="text-white">
                    {name || "tag"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!name.trim() || isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{name}&quot;? This will remove the tag from all bookmarks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
