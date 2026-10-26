export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-[#e7e2d7] ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="hcm-page space-y-5" aria-busy="true" aria-label="Loading workspace">
      <Skeleton className="h-48 rounded-[30px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
