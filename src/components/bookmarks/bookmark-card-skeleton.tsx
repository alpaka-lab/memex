import { Skeleton } from "@/components/ui/skeleton";

export function BookmarkCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full rounded-none" />

      <div className="p-3">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />

        {/* Description */}
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />

        {/* Domain */}
        <div className="mt-2 flex items-center gap-1.5">
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Tags */}
        <div className="mt-2 flex gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 pb-3">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="size-5 rounded" />
      </div>
    </div>
  );
}
