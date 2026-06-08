import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { formatNumber } from './stats-formatters.ts';
import { StatsRankingPanels } from './stats-ranking-list.component.tsx';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  selectedCategory?: EfCategoryId;
};

export const StatsProvinciaRanking = ({
  ranking,
  selectedCategory,
}: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();

  const getValue = (item: ProvinciaRankingItemDto) => {
    if (selectedCategory) {
      return item.impactosPorCategoria[selectedCategory] ?? 0;
    }
    return item.impactoTotalMedio;
  };

  const selectedCategoryData = selectedCategory
    ? EF_CATEGORIES.find((c) => c.id === selectedCategory)
    : undefined;

  const handleActivate = (item: ProvinciaRankingItemDto) => {
    navigate('/compare', {
      state: {
        provinciaReferencia: {
          id: item.idProvincia,
          nombre: item.nombreProvincia,
          idCatastro: 0,
          idPais: '',
        },
      },
    });
  };

  return (
    <StatsRankingPanels
      ranking={ranking}
      getId={(item) => item.idProvincia}
      getValue={getValue}
      renderPrimary={(item) => item.nombreProvincia}
      renderSecondary={(item) =>
        t('stats.ranking.plotsArea', { count: item.numParcelas, area: formatNumber(item.superficieTotal, 1) })
      }
      categoryLabel={selectedCategoryData ? getCategoryLabel(selectedCategoryData.id) : undefined}
      impactUnit={selectedCategoryData?.unit}
      emptyLabel={t('common.empty.noData')}
      onActivate={handleActivate}
    />
  );
};
