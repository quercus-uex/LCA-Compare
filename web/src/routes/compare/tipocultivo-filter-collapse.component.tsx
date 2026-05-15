import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useEffect, useState } from 'react';
import { FilterCollapse } from './filter-collapse.component';

export const TipocultivoFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) setFilters({ ...filters, tipoCultivo: undefined });
  }, [enabled]);
  
  return (
    <FilterCollapse title="Tipo de cultivo" enabled={enabled} onToggle={setEnabled}>
      <select
        className="select w-full"
        value={filters.tipoCultivo}
        defaultValue="Escoge un tipo..."
        onChange={(e) => {
          setFilters({ ...filters, tipoCultivo: e.target.value });
        }}
      >
        <option disabled>Escoge un tipo...</option>
        <option value="Tomate">Tomate</option>
        <option value="Olivo">Olivo</option>
        <option value="Ciruelo">Ciruelo</option>
        <option value="Viñedo">Viñedo</option>
        <option value="Arroz">Arroz</option>
        <option value="Melocotonero">Melocotonero</option>
      </select>
    </FilterCollapse>
  );
}
