import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { type Provincia, useLocation } from '../hooks/location.hook.tsx';
import type { PoblacionRankingItemDto } from './stats.hook.tsx';
import { formatImpactValue } from './stats-formatters.ts';
import { StatsRankingPanels } from './stats-ranking-list.component.tsx';
import { useTranslation } from 'react-i18next';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';
import { toast } from 'sonner';

type Props = {
  ranking: PoblacionRankingItemDto[];
  selectedCategory?: EfCategoryId;
  provinciaFilter?: string;
  onProvinciaFilterChange: (provinciaId: string | undefined) => void;
};

export const StatsPoblacionRanking = ({
  ranking,
  selectedCategory,
  provinciaFilter,
  onProvinciaFilterChange,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();

  useEffect(() => {
    location.getProvincias()
      .then((p) => setProvincias(p))
      .catch(() => toast.error(t('location.provincesError')));
  }, [location, t]);

  const getValue = (item: PoblacionRankingItemDto) => {
    if (selectedCategory) {
      return item.impactosPorCategoria[selectedCategory] ?? 0;
    }
    return item.impactoTotalMedio;
  };

  const selectedCategoryData = selectedCategory
    ? EF_CATEGORIES.find((c) => c.id === selectedCategory)
    : undefined;

  const handleActivate = (item: PoblacionRankingItemDto) => {
    navigate('/compare', {
      state: {
        poblacionReferencia: {
          id: item.idPoblacion,
          idProvincia: '',
          idCatastro: 0,
          nombre: item.nombrePoblacion,
          provincia: {
            id: '',
            nombre: item.nombreProvincia,
            idCatastro: 0,
            idPais: '',
          },
        },
      },
    });
  };

  const searchResults =
    searchQuery.length > 0
      ? ranking
          .map((item, idx) => ({ item, position: idx + 1 }))
          .filter(({ item }) =>
            item.nombrePoblacion
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
          )
      : null;

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          className="select select-bordered select-sm w-full"
          value={provinciaFilter ?? ''}
          onChange={(e) =>
            onProvinciaFilterChange(
              e.target.value ? e.target.value : undefined,
            )
          }
        >
          <option value="">{t('stats.filters.allProvinces')}</option>
          {provincias.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          className="input input-bordered input-sm w-full"
          placeholder={t('stats.filters.searchTown')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchResults && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title text-base">
              {t('stats.ranking.searchResults', { count: searchResults.length })}
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-sm text-base-content/50 p-2">
                {t('common.empty.noResults')}
              </p>
            ) : (
              <ul className="space-y-1 mt-2">
                {searchResults.map(({ item, position }) => (
                  <li key={item.idPoblacion}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded bg-base-200 p-2 text-left transition hover:bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      onClick={() => handleActivate(item)}
                    >
                      <span className="font-mono text-xs font-bold w-6">
                        {position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.nombrePoblacion}
                        </p>
                        <p className="text-xs opacity-70">
                          {item.nombreProvincia} - {t('stats.ranking.plotsCount', { count: item.numParcelas })}
                        </p>
                      </div>
                      <span className="text-sm font-mono font-bold whitespace-nowrap">
                        {formatImpactValue(getValue(item), '0')}
                        {selectedCategoryData?.unit && (
                          <span className="ml-1 text-xs font-normal opacity-75">
                            {selectedCategoryData.unit}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <StatsRankingPanels
        ranking={ranking}
        getId={(item) => item.idPoblacion}
        getValue={getValue}
        renderPrimary={(item) => item.nombrePoblacion}
        renderSecondary={(item) =>
          `${item.nombreProvincia} - ${t('stats.ranking.plotsCount', { count: item.numParcelas })}`
        }
        categoryLabel={selectedCategoryData ? getCategoryLabel(selectedCategoryData.id) : undefined}
        impactUnit={selectedCategoryData?.unit}
        emptyLabel={t('common.empty.noData')}
        onActivate={handleActivate}
      />
    </div>
  );
};
