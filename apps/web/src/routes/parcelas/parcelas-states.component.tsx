import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { GiFarmTractor } from 'react-icons/gi';

export const EmptyState = ({
  title,
  description,
  action,
  icon: Icon = GiFarmTractor,
  headingLevel: Heading = 'h2',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconType;
  /** Nivel del título, para que encaje en la jerarquía de la página */
  headingLevel?: 'h2' | 'h3';
}) => (
  <div className="card bg-base-100 shadow-sm w-full">
    <div className="card-body items-center py-16 text-center gap-3">
      <Icon aria-hidden className="size-12 text-base-content/40" />
      <Heading className="text-lg font-semibold">{title}</Heading>
      <p className="text-base-content/70 max-w-md">{description}</p>
      {action}
    </div>
  </div>
);

export const ParcelasListSkeleton = () => (
  <div className="w-full space-y-4" aria-busy="true">
    <div className="skeleton h-12 rounded-box" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-48 rounded-box" />
      ))}
    </div>
  </div>
);

export const ParcelaDetailSkeleton = () => (
  <div className="w-full max-w-[96rem] space-y-5" aria-busy="true">
    <div className="skeleton h-5 w-48" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
      <div className="skeleton aspect-square rounded-box" />
      <div className="space-y-4">
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-24 rounded-box" />
        <div className="skeleton h-40 rounded-box" />
      </div>
    </div>
    <div className="skeleton h-80 rounded-box" />
  </div>
);
