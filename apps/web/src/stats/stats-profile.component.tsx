import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EfCategoryId } from '../common/constants.ts';
import { StatsHeatmap } from './stats-heatmap.component.tsx';
import { StatsSection } from './stats-section.component.tsx';
import {
  StatsSpiderChart,
  type ProfileEntity,
  type ProfileMode,
} from './stats-spider-chart.component.tsx';
import type { GlobalStatsDto } from './stats.hook.tsx';

type Props = {
  data: GlobalStatsDto;
  selectedCategory: EfCategoryId;
};

type Selection = {
  mode: ProfileMode;
  /**
   * `undefined`: elección automática (la zona con más impacto frente a la de
   * menos, para que el perfil muestre contraste); `null`: el usuario la quitó
   */
  primaryId: string | null | undefined;
  secondaryId: string | null | undefined;
};

const INITIAL_SELECTION: Selection = {
  mode: 'province',
  primaryId: undefined,
  secondaryId: undefined,
};

/** Mapa de calor y perfil de impacto enlazados: una fila del mapa se abre en el perfil */
export const StatsProfile = ({ data, selectedCategory }: Props) => {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<Selection>(INITIAL_SELECTION);

  const entities = useMemo<ProfileEntity[]>(() => {
    const raw =
      selection.mode === 'province'
        ? data.rankingProvincias.map((p) => ({
            id: p.idProvincia,
            nombre: p.nombreProvincia,
            impactosPorCategoria: p.impactosPorCategoria,
          }))
        : data.rankingPoblaciones.map((p) => ({
            id: p.idPoblacion,
            nombre: `${p.nombrePoblacion} (${p.nombreProvincia})`,
            impactosPorCategoria: p.impactosPorCategoria,
          }));
    return raw.sort(
      (a, b) =>
        (b.impactosPorCategoria[selectedCategory] ?? 0) -
        (a.impactosPorCategoria[selectedCategory] ?? 0),
    );
  }, [data.rankingProvincias, data.rankingPoblaciones, selection.mode, selectedCategory]);

  // Si una zona elegida deja de estar en los datos (al cambiar los filtros), se
  // vuelve a la de mayor impacto
  const findEntity = (id: string | null | undefined) =>
    id ? entities.find((e) => e.id === id) : undefined;
  const primary =
    selection.primaryId === null
      ? null
      : (findEntity(selection.primaryId) ?? entities[0] ?? null);
  const secondaryCandidate =
    selection.secondaryId === undefined
      ? entities[entities.length - 1]
      : findEntity(selection.secondaryId);
  const secondary =
    secondaryCandidate && secondaryCandidate.id !== primary?.id
      ? secondaryCandidate
      : null;

  const handleProvinceClick = (idProvincia: string) => {
    setSelection((prev) => ({
      mode: 'province',
      primaryId: idProvincia,
      secondaryId:
        prev.mode === 'province' && prev.secondaryId !== idProvincia
          ? prev.secondaryId
          : undefined,
    }));
  };

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <StatsSection
        title={t('stats.sections.impactProfile')}
        hint={t('stats.sections.impactProfileHint')}
      >
        <StatsSpiderChart
          mode={selection.mode}
          entities={entities}
          primary={primary}
          secondary={secondary}
          onModeChange={(mode) => setSelection({ ...INITIAL_SELECTION, mode })}
          onPrimaryChange={(entity) =>
            setSelection((prev) => ({ ...prev, primaryId: entity?.id ?? null }))
          }
          onSecondaryChange={(entity) =>
            setSelection((prev) => ({ ...prev, secondaryId: entity?.id ?? null }))
          }
        />
      </StatsSection>

      <StatsSection
        title={t('stats.sections.heatmap')}
        hint={t('stats.sections.heatmapHint')}
      >
        <StatsHeatmap
          ranking={data.rankingProvincias}
          selectedCategory={selectedCategory}
          highlightedIds={
            selection.mode === 'province' ? [primary?.id, secondary?.id] : []
          }
          onProvinceClick={handleProvinceClick}
        />
      </StatsSection>
    </section>
  );
};
