import { Skeleton } from '../../components/ui/index.ts';

export const ParcelasListSkeleton = () => (
  <div className="w-full space-y-4" aria-busy="true">
    <Skeleton className="h-12 rounded-box" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-box" />
      ))}
    </div>
  </div>
);

export const ParcelaDetailSkeleton = () => (
  <div className="w-full space-y-5" aria-busy="true">
    <Skeleton className="h-5 w-48" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
      <Skeleton className="aspect-square rounded-box" />
      <div className="space-y-4">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-24 rounded-box" />
        <Skeleton className="h-40 rounded-box" />
      </div>
    </div>
    <Skeleton className="h-80 rounded-box" />
  </div>
);
