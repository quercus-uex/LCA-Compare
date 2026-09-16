import { useTranslation } from 'react-i18next';

export const StatsLoadingSkeleton = () => (
  <div className="w-full max-w-[96rem] space-y-6">
    <div className="skeleton h-10 w-48" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
    <div className="flex gap-3">
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
      <div className="skeleton h-16 rounded-box flex-1" />
    </div>
    <div className="skeleton h-80 rounded-xl" />
    <div className="skeleton h-96 rounded-xl" />
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-80 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-80 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="skeleton h-60 rounded-xl" />
    </div>
  </div>
);

export const StatsErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-[96rem]">
      <div className="alert alert-error">
        <span>{error}</span>
        <button className="btn btn-sm btn-ghost" onClick={onRetry}>
          {t('common.actions.retry')}
        </button>
      </div>
    </div>
  );
};

export const StatsEmptyState = ({ anio }: { anio?: number }) => {
  const { t } = useTranslation();
  return (
    <div className="alert">
      <span>{anio ? t('stats.noDataForYear', { year: anio }) : t('stats.noData')}</span>
    </div>
  );
};