import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SmartPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const SmartPagination = ({ page, totalPages, total, onPageChange }: SmartPaginationProps) => {
  const [jumpValue, setJumpValue] = useState('');
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    if (page <= 2) {
      pages.push(0, 1, 2, 3, 4);
      pages.push('ellipsis-end');
    } else if (page >= totalPages - 3) {
      pages.push('ellipsis-start');
      pages.push(totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push('ellipsis-start');
      pages.push(page - 2, page - 1, page, page + 1, page + 2);
      pages.push('ellipsis-end');
    }

    return pages;
  };

  const handleJump = () => {
    const target = Number(jumpValue);
    if (isNaN(target) || target < 1) {
      onPageChange(0);
    } else if (target > totalPages) {
      onPageChange(totalPages - 1);
    } else {
      onPageChange(target - 1);
    }
    setJumpValue('');
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
      <p className="text-sm text-base-content/60">
        {t('admin.pagination.summary', { total, page: page + 1, totalPages })}
      </p>

      <div className="flex items-center gap-2">
        <div className="join">
          <button
            className="join-item btn btn-sm"
            disabled={page === 0}
            onClick={() => onPageChange(0)}
            title={t('admin.pagination.first')}
          >
            «
          </button>
          <button
            className="join-item btn btn-sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </button>

          {visiblePages.map((item, idx) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span key={item} className="join-item btn btn-sm btn-disabled pointer-events-none">
                  …
                </span>
              );
            }
            return (
              <button
                key={idx}
                className={`join-item btn btn-sm ${item === page ? 'btn-active' : ''}`}
                onClick={() => onPageChange(item)}
              >
                {item + 1}
              </button>
            );
          })}

          <button
            className="join-item btn btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </button>
          <button
            className="join-item btn btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(totalPages - 1)}
            title={t('admin.pagination.last')}
          >
            »
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-base-content/60 hidden sm:inline">{t('admin.pagination.jump')}</span>
          <input
            type="number"
            className="input input-bordered input-xs w-16"
            placeholder={t('admin.pagination.pagePlaceholder')}
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJump();
            }}
          />
        </div>
      </div>
    </div>
  );
};
