import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowRight } from 'react-icons/fi';
import { formatImpactValue } from './stats-formatters.ts';
import { RANKING_PAGE_SIZE, type RankedEntry } from './stats-ranking.helpers.ts';
import { StatsPlaceholder } from './stats-section.component.tsx';

type Props<T> = {
  /** Ranking completo, de menor a mayor impacto */
  entries: RankedEntry<T>[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getDetail: (item: T) => string;
  getValue: (item: T) => number;
  unit?: string;
  color?: string;
  emptyLabel: string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  onActivate: (item: T) => void;
};

type View = 'best' | 'worst';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function StatsRankingList<T>({
  entries,
  getId,
  getName,
  getDetail,
  getValue,
  unit,
  color,
  emptyLabel,
  searchPlaceholder,
  toolbar,
  onActivate,
}: Props<T>) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('best');
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const isPaged = entries.length > RANKING_PAGE_SIZE;
  const searchTerm = normalize(query.trim());

  let visible: RankedEntry<T>[];
  if (searchTerm) {
    visible = entries.filter(({ item }) =>
      normalize(getName(item)).includes(searchTerm),
    );
  } else if (!isPaged || expanded) {
    visible = view === 'worst' ? [...entries].reverse() : entries;
  } else {
    visible =
      view === 'worst'
        ? entries.slice(-RANKING_PAGE_SIZE).reverse()
        : entries.slice(0, RANKING_PAGE_SIZE);
  }

  const maxAbs = Math.max(...entries.map(({ item }) => Math.abs(getValue(item))), 0);

  return (
    <div className="flex flex-col gap-3">
      {(toolbar || searchPlaceholder) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {toolbar}
          {searchPlaceholder && (
            <input
              type="search"
              className="input input-bordered input-sm w-full"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </div>
      )}

      {isPaged && !searchTerm && (
        <div role="tablist" className="tabs tabs-box tabs-sm w-fit">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'best'}
            className={`tab ${view === 'best' ? 'tab-active' : ''}`}
            onClick={() => setView('best')}
          >
            {t('stats.ranking.lowerImpact')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'worst'}
            className={`tab ${view === 'worst' ? 'tab-active' : ''}`}
            onClick={() => setView('worst')}
          >
            {t('stats.ranking.higherImpact')}
          </button>
        </div>
      )}

      {searchTerm && (
        <p className="text-xs text-base-content/60">
          {t('stats.ranking.searchResults', { count: visible.length })}
        </p>
      )}

      {visible.length === 0 ? (
        <StatsPlaceholder className="h-40">{emptyLabel}</StatsPlaceholder>
      ) : (
        <ol className={`space-y-1 ${expanded ? 'max-h-[32rem] overflow-y-auto pr-1' : ''}`}>
          {visible.map(({ item, position }) => {
            const value = getValue(item);
            const width = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
            return (
              <li key={getId(item)}>
                <button
                  type="button"
                  title={t('stats.ranking.compare')}
                  className="group flex w-full items-center gap-3 rounded-field bg-base-200/60 px-3 py-2 text-left transition hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => onActivate(item)}
                >
                  <span className="w-7 shrink-0 text-right font-mono text-xs font-bold text-base-content/60">
                    {position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{getName(item)}</span>
                    <span className="block truncate text-xs text-base-content/60">
                      {getDetail(item)}
                    </span>
                    <span className="mt-1 block h-1 rounded-full bg-base-300">
                      <span
                        className="block h-1 rounded-full"
                        style={{ width: `${width}%`, backgroundColor: color }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-sm font-bold whitespace-nowrap">
                    {formatImpactValue(value, '0')}
                    {unit && (
                      <span className="block text-[10px] font-normal text-base-content/60">
                        {unit}
                      </span>
                    )}
                  </span>
                  <FiArrowRight
                    aria-hidden
                    className="shrink-0 text-base-content/30 transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {isPaged && !searchTerm && (
        <button
          type="button"
          className="btn btn-ghost btn-xs self-center"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? t('stats.ranking.showLess')
            : t('stats.ranking.showAll', { count: entries.length })}
        </button>
      )}
    </div>
  );
}
