import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiGrid, FiList, FiMap, FiSearch } from 'react-icons/fi';
import { Button, Card, Input, SegmentedControl, Select, Toggle } from '../../components/ui/index.ts';
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

  return (
    <Card density="compact" className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          icon={FiSearch}
          type="search"
          className="md:flex-1"
          aria-label={t('parcelas.searchLabel')}
          placeholder={t('parcelas.searchPlaceholder')}
          value={query.q}
          // Escribir no debe llenar el historial con una entrada por tecla
          onChange={(e) => onChange({ q: e.target.value }, { replace: true })}
        />

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

      <div className="flex flex-wrap items-center gap-3">
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
