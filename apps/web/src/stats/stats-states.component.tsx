import { Skeleton } from '../components/ui/index.ts';

// Reproduce la disposición del dashboard para que no salte al cargar
export const StatsLoadingSkeleton = () => (
  <div className="w-full space-y-6">
    <Skeleton className="h-16 rounded-box" />
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
      <Skeleton className="h-36 rounded-box" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-box" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-box" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Skeleton className="h-[28rem] rounded-box" />
      <Skeleton className="h-[28rem] rounded-box" />
    </div>
    <Skeleton className="h-96 rounded-box" />
  </div>
);
