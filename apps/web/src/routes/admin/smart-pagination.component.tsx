import { useTranslation } from 'react-i18next';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface SmartPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

const getVisiblePages = (page: number, totalPages: number): PageItem[] => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
  if (page <= 2) return [0, 1, 2, 3, 4, 'ellipsis-end'];
  if (page >= totalPages - 3) {
    return ['ellipsis-start', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
  }
  return ['ellipsis-start', page - 2, page - 1, page, page + 1, page + 2, 'ellipsis-end'];
};

export const SmartPagination = ({ page, pageSize, total, onPageChange }: SmartPaginationProps) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-base-content/60">{t('admin.pagination.range', { from, to, total })}</p>

      {totalPages > 1 && (
        <nav className="join" aria-label={t('admin.pagination.label')}>
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost"
            disabled={page === 0}
            onClick={() => onPageChange(0)}
            aria-label={t('admin.pagination.first')}
            title={t('admin.pagination.first')}
          >
            <FiChevronsLeft aria-hidden />
          </button>
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            aria-label={t('admin.pagination.previous')}
            title={t('admin.pagination.previous')}
          >
            <FiChevronLeft aria-hidden />
          </button>
          {getVisiblePages(page, totalPages).map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                className={`join-item btn btn-sm ${item === page ? 'btn-primary' : 'btn-ghost'}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item + 1}
              </button>
            ) : (
              <span key={item} className="join-item btn btn-sm btn-ghost btn-disabled" aria-hidden>
                …
              </span>
            ),
          )}
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('admin.pagination.next')}
            title={t('admin.pagination.next')}
          >
            <FiChevronRight aria-hidden />
          </button>
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(totalPages - 1)}
            aria-label={t('admin.pagination.last')}
            title={t('admin.pagination.last')}
          >
            <FiChevronsRight aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
};
