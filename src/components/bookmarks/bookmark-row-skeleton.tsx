import { Skeleton } from "@/components/ui/skeleton";

export function BookmarkRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      {/* Favicon */}
      <Skeleton className="size-5 shrink-0 rounded-sm" />

      {/* Title */}
      <Skeleton className="h-4 flex-1" />

      {/* Domain */}
      <Skeleton className="hidden h-3 w-20 sm:block" />

      {/* Tags */}
      <div className="hidden items-center gap-1 md:flex">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Date */}
      <Skeleton className="hidden h-3 w-14 lg:block" />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="size-5 rounded" />
      </div>
    </div>
  );
}
