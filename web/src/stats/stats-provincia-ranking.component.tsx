import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { formatNumber } from './stats-formatters.ts';
import { StatsRankingPanels } from './stats-ranking-list.component.tsx';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  selectedCategory?: EfCategoryId;
};

export const StatsProvinciaRanking = ({
  ranking,
  selectedCategory,
}: Props) => {
  const getValue = (item: ProvinciaRankingItemDto) => {
    if (selectedCategory) {
      return item.impactosPorCategoria[selectedCategory] ?? 0;
    }
    return item.impactoTotalMedio;
  };

  const catLabel = selectedCategory
    ? EF_CATEGORIES.find((c) => c.id === selectedCategory)?.spanishName
    : undefined;

  return (
    <StatsRankingPanels
      ranking={ranking}
      getId={(item) => item.idProvincia}
      getValue={getValue}
      renderPrimary={(item) => item.nombreProvincia}
      renderSecondary={(item) =>
        `${item.numParcelas} parcelas · ${formatNumber(item.superficieTotal, 1)} Ha`
      }
      categoryLabel={catLabel}
      emptyLabel="Sin datos"
    />
  );
};
