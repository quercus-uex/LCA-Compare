import { useTranslation } from 'react-i18next';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { Button, IconButton } from '../../components/ui/index.ts';

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
      <p className="text-sm text-muted">{t('admin.pagination.range', { from, to, total })}</p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label={t('admin.pagination.label')}>
          <IconButton icon={FiChevronsLeft} label={t('admin.pagination.first')} disabled={page === 0} onClick={() => onPageChange(0)} />
          <IconButton
            icon={FiChevronLeft}
            label={t('admin.pagination.previous')}
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          />
          {getVisiblePages(page, totalPages).map((item) =>
            typeof item === 'number' ? (
              <Button
                key={item}
                variant={item === page ? 'primary' : 'ghost'}
                size="sm"
                className="min-w-8 tabular-nums"
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item + 1}
              </Button>
            ) : (
              <span key={item} className="px-1 text-muted" aria-hidden>
                …
              </span>
            ),
          )}
          <IconButton
            icon={FiChevronRight}
            label={t('admin.pagination.next')}
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          />
          <IconButton
            icon={FiChevronsRight}
            label={t('admin.pagination.last')}
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(totalPages - 1)}
          />
        </nav>
      )}
    </div>
  );
};
