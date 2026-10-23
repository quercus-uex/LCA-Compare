import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

// Reproduce la disposición del dashboard para que no salte al cargar
export const StatsLoadingSkeleton = () => (
  <div className="w-full max-w-[96rem] space-y-6" aria-busy="true">
    <div className="space-y-2">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-96 max-w-full" />
    </div>
    <div className="skeleton h-16 rounded-box" />
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
      <div className="skeleton h-36 rounded-box" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-box" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-box" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="skeleton h-[28rem] rounded-box" />
      <div className="skeleton h-[28rem] rounded-box" />
    </div>
    <div className="skeleton h-96 rounded-box" />
  </div>
);

export const StatsErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-[96rem]">
      <div role="alert" className="alert alert-error">
        <FiAlertTriangle />
        <span>{t('stats.errors.load')}</span>
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          <FiRefreshCw />
          {t('common.actions.retry')}
        </button>
      </div>
    </div>
  );
};

export const StatsStaleAlert = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <div role="alert" className="alert alert-warning">
      <FiAlertTriangle />
      <span>{t('stats.errors.stale')}</span>
      <button type="button" className="btn btn-sm" onClick={onRetry}>
        <FiRefreshCw />
        {t('common.actions.retry')}
      </button>
    </div>
  );
};

export const StatsEmptyState = ({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body items-center py-16 text-center">
        <p className="text-base-content/70">
          {filtered ? t('stats.noDataForFilters') : t('stats.noData')}
        </p>
        {filtered && (
          <button type="button" className="btn btn-sm btn-primary" onClick={onReset}>
            {t('stats.filters.reset')}
          </button>
        )}
      </div>
    </div>
  );
};
