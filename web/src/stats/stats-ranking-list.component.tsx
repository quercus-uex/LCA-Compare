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
  emptyLabel?: string;
};

function RankingCard<T>({
  title,
  tone,
  entries,
  getId,
  getValue,
  renderPrimary,
  renderSecondary,
  categoryLabel,
  emptyLabel = 'Sin datos',
}: RankingPanelsProps<T> & {
  title: string;
  tone: 'success' | 'error' | 'neutral';
  entries: RankedEntry<T>[];
}) {
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
          {entries.map(({ item, position }) => (
            <li
              key={getId(item)}
              className={`flex items-center gap-2 p-2 rounded ${toneClasses}`}
            >
              <span className="font-mono text-xs font-bold w-6">
                {position}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {renderPrimary(item)}
                </p>
                <p className="text-xs opacity-70">{renderSecondary(item)}</p>
              </div>
              <span className="text-sm font-mono font-bold">
                {formatImpactValue(getValue(item))}
              </span>
            </li>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-base-content/50 p-2">{emptyLabel}</p>
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
  emptyLabel,
}: RankingPanelsProps<T>) {
  const { best, worst } = deriveRankingLists(ranking);

  if (ranking.length < 20) {
    return (
      <RankingCard
        title="Top 10"
        tone="neutral"
        entries={best}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        emptyLabel={emptyLabel}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <RankingCard
        title="Top 10 - Menor Impacto"
        tone="success"
        entries={best}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        emptyLabel={emptyLabel}
      />
      <RankingCard
        title="Top 10 - Mayor Impacto"
        tone="error"
        entries={worst}
        ranking={ranking}
        getId={getId}
        getValue={getValue}
        renderPrimary={renderPrimary}
        renderSecondary={renderSecondary}
        categoryLabel={categoryLabel}
        emptyLabel={
          ranking.length > 0
            ? 'No hay suficientes datos para una lista distinta'
            : emptyLabel
        }
      />
    </div>
  );
}
