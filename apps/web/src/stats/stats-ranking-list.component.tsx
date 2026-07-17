import { useTranslation } from 'react-i18next';
import { formatImpactValue } from './stats-formatters.ts';
import {
  deriveRankingLists,
  type RankedEntry,
} from './stats-ranking.helpers.ts';

type RankingPanelsProps<T> = {
  ranking: T[];
  getId: (item: T) => string;
  getValue: (item: T) => number;
  renderPrimary: (item: T) => string;
  renderSecondary: (item: T) => string;
  categoryLabel?: string;
  impactUnit?: string;
  emptyLabel?: string;
  onActivate?: (item: T) => void;
};

function RankingEntryContent<T>({
  item,
  position,
  getValue,
  renderPrimary,
  renderSecondary,
  impactUnit,
}: Pick<
  RankingPanelsProps<T>,
  'getValue' | 'renderPrimary' | 'renderSecondary' | 'impactUnit'
> & {
  item: T;
  position: number;
}) {
  return (
    <>
      <span className="font-mono text-xs font-bold w-6">{position}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{renderPrimary(item)}</p>
        <p className="text-xs opacity-70">{renderSecondary(item)}</p>
      </div>
      <span className="text-sm font-mono font-bold whitespace-nowrap">
        {formatImpactValue(getValue(item))}
        {impactUnit && (
          <span className="ml-1 text-xs font-normal opacity-75">
            {impactUnit}
          </span>
        )}
      </span>
    </>
  );
}

function RankingCard<T>({
  title,
  tone,
  entries,
  getId,
  getValue,
  renderPrimary,
  renderSecondary,
  categoryLabel,
  impactUnit,
  emptyLabel,
  onActivate,
}: RankingPanelsProps<T> & {
  title: string;
  tone: 'success' | 'error' | 'neutral';
  entries: RankedEntry<T>[];
}) {
  const { t } = useTranslation();
  const toneClasses =
    tone === 'success'
      ? 'bg-success text-success-content'
      : tone === 'error'
        ? 'bg-error text-error-content'
        : 'bg-base-200 text-base-content';
  const titleClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'error'
        ? 'text-error'
        : 'text-base-content';

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <h3 className={`card-title ${titleClass} text-base`}>
          {title}
          {categoryLabel && (
            <span className="text-xs font-normal text-base-content/50">
              ({categoryLabel})
            </span>
          )}
        </h3>
        <ul className="space-y-1 mt-2">
          {entries.map(({ item, position }) => {
            const entryClasses = `flex w-full items-center gap-2 p-2 rounded text-left ${toneClasses}`;

            return (
              <li key={getId(item)}>
                {onActivate ? (
                  <button
                    type="button"
                    className={`${entryClasses} cursor-pointer transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                    onClick={() => onActivate(item)}
                  >
                    <RankingEntryContent
                      item={item}
                      position={position}
                      getValue={getValue}
                      renderPrimary={renderPrimary}
                      renderSecondary={renderSecondary}
                      impactUnit={impactUnit}
                    />
                  </button>
                ) : (
                  <div className={entryClasses}>
                    <RankingEntryContent
                      item={item}
                      position={position}
                      getValue={getValue}
                      renderPrimary={renderPrimary}
                      renderSecondary={renderSecondary}
                      impactUnit={impactUnit}
                    />
                  </div>
                )}
              </li>
            );
          })}
          {entries.length === 0 && (
            <p className="text-sm text-base-content/50 p-2">{emptyLabel ?? t('common.empty.noData')}</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export function StatsRankingPanels<T>({
  ranking,
  getId,
  getValue,
  renderPrimary,
  renderSecondary,
  categoryLabel,
  impactUnit,
  emptyLabel,
  onActivate,
}: RankingPanelsProps<T>) {
  const { best, worst } = deriveRankingLists(ranking);
  const { t } = useTranslation();

  if (ranking.length < 20) {
    return (
      <RankingCard
        title={t('stats.ranking.top10')}
        tone="neutral"
        entries={best}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        impactUnit={impactUnit}
        emptyLabel={emptyLabel}
        onActivate={onActivate}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <RankingCard
        title={t('stats.ranking.lowerImpact')}
        tone="success"
        entries={best}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        impactUnit={impactUnit}
        emptyLabel={emptyLabel}
        onActivate={onActivate}
      />
      <RankingCard
        title={t('stats.ranking.higherImpact')}
        tone="error"
        entries={worst}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        impactUnit={impactUnit}
        emptyLabel={
          ranking.length > 0
            ? t('stats.ranking.notEnoughData')
            : emptyLabel
        }
        onActivate={onActivate}
      />
    </div>
  );
}
