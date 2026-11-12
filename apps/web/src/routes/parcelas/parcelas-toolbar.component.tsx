import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiGrid, FiList, FiMap, FiSearch, FiSliders } from 'react-icons/fi';
import { Badge, Button, Card, Input, SegmentedControl, Select, Toggle } from '../../components/ui/index.ts';
import type { ParcelaPoblacion } from '../../hooks/parcela.hook.tsx';
import { useCropTypeLabel } from '../../hooks/use-crop-type-label.ts';
import {
  hasActiveFilters,
  PARCELAS_SORTS,
  type ParcelasQuery,
  type ParcelasView,
} from './parcelas.utils.ts';

const VIEW_OPTIONS: Array<{ value: ParcelasView; labelKey: string; icon: IconType }> = [
  { value: 'tarjetas', labelKey: 'parcelas.views.cards', icon: FiGrid },
  { value: 'tabla', labelKey: 'parcelas.views.table', icon: FiList },
  { value: 'mapa', labelKey: 'parcelas.views.map', icon: FiMap },
];

type Props = {
  query: ParcelasQuery;
  onChange: (patch: Partial<ParcelasQuery>, options?: { replace?: boolean }) => void;
  onClear: () => void;
  tipos: string[];
  poblaciones: ParcelaPoblacion[];
};

export const ParcelasToolbar = ({ query, onChange, onClear, tipos, poblaciones }: Props) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();
  // En móvil los filtros y el orden van plegados para que las parcelas se vean antes;
  // desde md siempre están a la vista
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const activeFilters = [query.tipo, query.poblacion, query.soloReferencia].filter(Boolean).length;

  return (
    <Card density="compact" className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex gap-2 md:flex-1">
          <Input
            icon={FiSearch}
            type="search"
            className="flex-1"
            aria-label={t('parcelas.searchLabel')}
            placeholder={t('parcelas.searchPlaceholder')}
            value={query.q}
            // Escribir no debe llenar el historial con una entrada por tecla
            onChange={(e) => onChange({ q: e.target.value }, { replace: true })}
          />
          <Button
            variant={filtersOpen ? 'primary' : 'outline'}
            icon={FiSliders}
            className="md:hidden"
            aria-label={activeFilters > 0 ? `${t('parcelas.filters.toggle')} (${activeFilters})` : t('parcelas.filters.toggle')}
            title={t('parcelas.filters.toggle')}
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            {/* Cuántos filtros hay puestos, para no olvidarlos con el panel plegado */}
            {activeFilters > 0 && <Badge tone={filtersOpen ? 'neutral' : 'secondary'} size="xs" aria-hidden>{activeFilters}</Badge>}
          </Button>
        </div>

        <div className="w-full md:w-auto">
          <SegmentedControl
            label={t('parcelas.views.label')}
            size="sm"
            mdSize="md"
            block
            options={VIEW_OPTIONS.map(({ value, labelKey, icon }) => ({ value, icon, label: t(labelKey) }))}
            value={query.vista}
            onChange={(vista) => onChange({ vista })}
          />
        </div>
      </div>

      <div id={filtersId} className={`${filtersOpen ? 'flex' : 'hidden'} flex-wrap items-center gap-3 md:flex`}>
        <Select
          size="sm"
          className="sm:w-auto"
          aria-label={t('parcelas.filters.cropType')}
          value={query.tipo}
          onChange={(e) => onChange({ tipo: e.target.value })}
        >
          <option value="">{t('parcelas.filters.allCropTypes')}</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>{getCropTypeLabel(tipo)}</option>
          ))}
        </Select>

        <Select
          size="sm"
          className="sm:w-auto"
          aria-label={t('parcelas.filters.poblacion')}
          value={query.poblacion}
          onChange={(e) => onChange({ poblacion: e.target.value })}
        >
          <option value="">{t('parcelas.filters.allPoblaciones')}</option>
          {poblaciones.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.provincia.nombre})</option>
          ))}
        </Select>

        <Toggle
          size="sm"
          label={t('parcelas.filters.onlyReference')}
          checked={query.soloReferencia}
          onChange={(e) => onChange({ soloReferencia: e.target.checked })}
        />

        {hasActiveFilters(query) && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('parcelas.filters.clear')}
          </Button>
        )}

        {query.vista !== 'mapa' && (
          <label className="flex items-center gap-2 text-sm sm:ml-auto">
            <span>{t('parcelas.sort.label')}</span>
            <Select
              size="sm"
              // `Select` ocupa todo el ancho: aquí se ajusta a la opción elegida
              className="max-w-fit"
              value={query.orden}
              onChange={(e) => onChange({ orden: e.target.value as ParcelasQuery['orden'] })}
            >
              {PARCELAS_SORTS.map((s) => (
                <option key={s} value={s}>{t(`parcelas.sort.${s}`)}</option>
              ))}
            </Select>
          </label>
        )}
      </div>
    </Card>
  );
};
