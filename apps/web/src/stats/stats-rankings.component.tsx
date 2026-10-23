import { STATS_MIN_PARCELAS } from 'common/stats';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { getEfCategory, type EfCategoryId } from '../common/constants.ts';
import { formatNumber } from './stats-formatters.ts';
import { StatsRankingList } from './stats-ranking-list.component.tsx';
import {
  poblacionToCompareState,
  provinciaToCompareState,
  rankByCategory,
} from './stats-ranking.helpers.ts';
import { StatsSection } from './stats-section.component.tsx';
import type { GlobalStatsDto } from './stats.hook.tsx';

type Props = {
  data: GlobalStatsDto;
  selectedCategory: EfCategoryId;
  provinciaFilter?: string;
  onProvinciaFilterChange: (provinciaId: string | undefined) => void;
};

export const StatsRankings = ({
  data,
  selectedCategory,
  provinciaFilter,
  onProvinciaFilterChange,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const category = getEfCategory(selectedCategory);
  const emptyLabel = t('stats.ranking.noZones', { min: STATS_MIN_PARCELAS });

  const provincias = useMemo(
    () => rankByCategory(data.rankingProvincias, selectedCategory),
    [data.rankingProvincias, selectedCategory],
  );

  // Solo se ofrecen las provincias que tienen poblaciones en el ranking
  const provinciaOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const p of data.rankingPoblaciones) {
      options.set(p.idProvincia, p.nombreProvincia);
    }
    return [...options].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data.rankingPoblaciones]);

  // Las posiciones se calculan después de filtrar por provincia, para que sean
  // el puesto dentro de esa provincia
  const poblaciones = useMemo(
    () =>
      rankByCategory(
        provinciaFilter
          ? data.rankingPoblaciones.filter((p) => p.idProvincia === provinciaFilter)
          : data.rankingPoblaciones,
        selectedCategory,
      ),
    [data.rankingPoblaciones, provinciaFilter, selectedCategory],
  );

  const { provincias: provinciasOcultas, poblaciones: poblacionesOcultas } =
    data.zonasOcultas;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StatsSection
          title={t('stats.sections.provinceRanking')}
          hint={t('stats.sections.rankingHint')}
        >
          <StatsRankingList
            entries={provincias}
            getId={(item) => item.idProvincia}
            getName={(item) => item.nombreProvincia}
            getDetail={(item) =>
              t('stats.ranking.plotsArea', {
                count: item.numParcelas,
                area: formatNumber(item.superficieTotal, 1),
              })
            }
            getValue={(item) => item.impactosPorCategoria[selectedCategory] ?? 0}
            unit={category?.unit}
            color={category?.color}
            emptyLabel={emptyLabel}
            onActivate={(item) =>
              void navigate('/compare', { state: provinciaToCompareState(item) })
            }
          />
        </StatsSection>

        <StatsSection
          title={t('stats.sections.townRanking')}
          hint={t('stats.sections.rankingHint')}
        >
          <StatsRankingList
            entries={poblaciones}
            getId={(item) => item.idPoblacion}
            getName={(item) => item.nombrePoblacion}
            getDetail={(item) =>
              t('stats.ranking.townPlotsArea', {
                provincia: item.nombreProvincia,
                count: item.numParcelas,
                area: formatNumber(item.superficieTotal, 1),
              })
            }
            getValue={(item) => item.impactosPorCategoria[selectedCategory] ?? 0}
            unit={category?.unit}
            color={category?.color}
            emptyLabel={emptyLabel}
            searchPlaceholder={t('stats.filters.searchTown')}
            toolbar={
              <select
                className="select select-bordered select-sm w-full"
                aria-label={t('stats.chart.province')}
                value={provinciaFilter ?? ''}
                onChange={(e) =>
                  onProvinciaFilterChange(e.target.value || undefined)
                }
              >
                <option value="">{t('stats.filters.allProvinces')}</option>
                {provinciaOptions.map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            }
            onActivate={(item) =>
              void navigate('/compare', { state: poblacionToCompareState(item) })
            }
          />
        </StatsSection>
      </div>

      {(provinciasOcultas > 0 || poblacionesOcultas > 0) && (
        <p className="flex items-start gap-2 px-1 text-xs text-base-content/60">
          <FiInfo className="mt-0.5 shrink-0" aria-hidden />
          {t('stats.ranking.hiddenZones', {
            provincias: provinciasOcultas,
            poblaciones: poblacionesOcultas,
            min: STATS_MIN_PARCELAS,
          })}
        </p>
      )}
    </div>
  );
};
