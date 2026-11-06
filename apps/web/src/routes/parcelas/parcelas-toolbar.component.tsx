import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiGrid, FiList, FiMap, FiSearch } from 'react-icons/fi';
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
    <div className="flex w-full flex-col gap-3 rounded-box bg-base-100 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="input w-full md:flex-1">
          <FiSearch aria-hidden className="opacity-60" />
          <input
            type="search"
            aria-label={t('parcelas.searchLabel')}
            placeholder={t('parcelas.searchPlaceholder')}
            value={query.q}
            // Escribir no debe llenar el historial con una entrada por tecla
            onChange={(e) => onChange({ q: e.target.value }, { replace: true })}
          />
        </label>

        <div role="group" aria-label={t('parcelas.views.label')} className="join w-full md:w-auto">
          {VIEW_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={`btn join-item btn-sm flex-1 md:btn-md md:flex-none ${query.vista === value ? 'btn-primary' : ''}`}
              aria-pressed={query.vista === value}
              onClick={() => onChange({ vista: value })}
            >
              <Icon aria-hidden />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="select select-sm w-full sm:w-auto"
          aria-label={t('parcelas.filters.cropType')}
          value={query.tipo}
          onChange={(e) => onChange({ tipo: e.target.value })}
        >
          <option value="">{t('parcelas.filters.allCropTypes')}</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>{getCropTypeLabel(tipo)}</option>
          ))}
        </select>

        <select
          className="select select-sm w-full sm:w-auto"
          aria-label={t('parcelas.filters.poblacion')}
          value={query.poblacion}
          onChange={(e) => onChange({ poblacion: e.target.value })}
        >
          <option value="">{t('parcelas.filters.allPoblaciones')}</option>
          {poblaciones.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.provincia.nombre})</option>
          ))}
        </select>

        <label className="label cursor-pointer gap-2 text-sm text-base-content">
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-success"
            checked={query.soloReferencia}
            onChange={(e) => onChange({ soloReferencia: e.target.checked })}
          />
          {t('parcelas.filters.onlyReference')}
        </label>

        {hasActiveFilters(query) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            {t('parcelas.filters.clear')}
          </button>
        )}

        {query.vista !== 'mapa' && (
          <label className="flex items-center gap-2 text-sm sm:ml-auto">
            <span>{t('parcelas.sort.label')}</span>
            <select
              className="select select-sm w-auto"
              value={query.orden}
              onChange={(e) => onChange({ orden: e.target.value as ParcelasQuery['orden'] })}
            >
              {PARCELAS_SORTS.map((s) => (
                <option key={s} value={s}>{t(`parcelas.sort.${s}`)}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
};
