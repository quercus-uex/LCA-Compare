import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { EF_CATEGORIES, type EfCategoryId } from '../common/constants.ts';
import { Button, Card, Field, Select, Spinner } from '../components/ui/index.ts';
import type { OrganizacionResumen } from '../hooks/organizacion.hook.tsx';
import { useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import type { GlobalStatsDto } from './stats.hook.tsx';
import type { StatsFilters } from './use-stats-filters.ts';
import { useTranslatedEfCategories } from './use-translated-ef-categories.ts';

type Props = {
  data: GlobalStatsDto;
  filters: StatsFilters;
  /** Organizaciones que administra el usuario; sin ninguna no se ofrece el filtro */
  organizaciones: OrganizacionResumen[];
  isFetching: boolean;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<StatsFilters>) => void;
  onReset: () => void;
};

export const StatsFiltersBar = ({
  data,
  filters,
  organizaciones,
  isFetching,
  hasActiveFilters,
  onChange,
  onReset,
}: Props) => {
  const { t } = useTranslation();
  const { getCategoryLabel } = useTranslatedEfCategories();
  const getCropTypeLabel = useCropTypeLabel();

  return (
    <Card density="compact" className="z-20 md:sticky md:top-2">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t('stats.filters.category')} className="min-w-56 flex-1 sm:flex-none">
          <Select
            size="sm"
            value={filters.categoria}
            onChange={(e) =>
              onChange({ categoria: e.target.value as EfCategoryId })
            }
          >
            {EF_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryLabel(cat.id)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('stats.filters.crop')} className="min-w-44 flex-1 sm:flex-none">
          <Select
            size="sm"
            value={filters.tipoCultivo ?? ''}
            onChange={(e) =>
              onChange({ tipoCultivo: e.target.value || undefined })
            }
          >
            <option value="">{t('stats.filters.allCrops')}</option>
            {data.tiposCultivoDisponibles.map((tipo) => (
              <option key={tipo} value={tipo}>
                {getCropTypeLabel(tipo)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('stats.filters.year')} className="min-w-40 flex-1 sm:flex-none">
          <Select
            size="sm"
            value={filters.anio ?? ''}
            onChange={(e) =>
              onChange({
                anio: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">{t('stats.filters.allYears')}</option>
            {[...data.aniosDisponibles].reverse().map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </Select>
        </Field>

        {organizaciones.length > 0 && (
          <Field label={t('stats.filters.organization')} className="min-w-48 flex-1 sm:flex-none">
            <Select
              size="sm"
              value={filters.organizacion ?? ''}
              onChange={(e) => onChange({ organizacion: e.target.value || undefined })}
            >
              <option value="">{t('stats.filters.allPlatform')}</option>
              {/* Si la URL trae una que ya no administra, se muestra hasta que se cambie */}
              {filters.organizacion && !organizaciones.some((o) => o.id === filters.organizacion) && (
                <option value={filters.organizacion}>{t('stats.filters.unknownOrganization')}</option>
              )}
              {organizaciones.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </Field>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" icon={FiX} onClick={onReset}>
            {t('stats.filters.reset')}
          </Button>
        )}

        {isFetching && (
          <span
            className="ml-auto flex items-center gap-2 self-center text-xs text-muted"
            role="status"
          >
            <Spinner size="xs" />
            {t('stats.updating')}
          </span>
        )}
      </div>
    </Card>
  );
};
