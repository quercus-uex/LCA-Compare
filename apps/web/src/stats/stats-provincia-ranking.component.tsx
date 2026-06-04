import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import type { ProvinciaRankingItemDto } from './stats.hook.tsx';
import { formatNumber } from './stats-formatters.ts';
import { StatsRankingPanels } from './stats-ranking-list.component.tsx';
import { useNavigate } from 'react-router';

type Props = {
  ranking: ProvinciaRankingItemDto[];
  selectedCategory?: EfCategoryId;
};

export const StatsProvinciaRanking = ({
  ranking,
  selectedCategory,
}: Props) => {
  const navigate = useNavigate();

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
        `${item.numParcelas} parcelas · ${formatNumber(item.superficieTotal, 1)} Ha`
      }
      categoryLabel={selectedCategoryData?.spanishName}
      impactUnit={selectedCategoryData?.unit}
      emptyLabel="Sin datos"
      onActivate={handleActivate}
    />
  );
};
