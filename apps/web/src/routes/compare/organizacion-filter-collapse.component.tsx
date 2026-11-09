import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import type { OrganizacionResumen } from '../../hooks/organizacion.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

/** Limita el conjunto a las campañas que los miembros han consentido a una organización que administra el usuario */
export const OrganizacionFilterCollapse = ({
  filters,
  setFilters,
  organizaciones,
}: {
  filters: CompareFilterType;
  setFilters: (f: CompareFilterType) => void;
  organizaciones: OrganizacionResumen[];
}) => {
  const { t } = useTranslation();
  const selectId = useId();
  const enabled = filters.organizacion !== undefined;

  const select = (id: string) => {
    const organizacion = organizaciones.find((o) => o.id === id);
    setFilters({ ...filters, organizacion: organizacion && { id: organizacion.id, nombre: organizacion.nombre } });
  };

  return (
    <FilterCollapse
      title={t('compare.filters.organization')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        // Al activarlo se elige la primera para que el filtro se aplique ya
        if (isEnabled) select(organizaciones[0]?.id ?? '');
        else setFilters({ ...filters, organizacion: undefined });
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="sr-only">{t('compare.filters.organization')}</label>
        <select
          id={selectId}
          className="select w-full"
          value={filters.organizacion?.id ?? ''}
          onChange={(e) => select(e.target.value)}
        >
          {organizaciones.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </select>
        <p className="text-sm text-base-content/70">{t('compare.filters.organizationHint')}</p>
      </div>
    </FilterCollapse>
  );
};
