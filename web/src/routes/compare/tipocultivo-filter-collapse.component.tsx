import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { useEffect, useState } from 'react';

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
    <div
      className={`collapse bg-base-100 border-base-300 border ${enabled ? 'collapse-open' : ''}`}
    >
      <div className="flex p-5">
        <div className="flex gap-2 items-center justify-between w-full">
          <p className="font-semibold text-lg">Tipo de cultivo</p>
          <input
            type="checkbox"
            className="toggle toggle-lg"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </div>
      </div>
      <div className="collapse-content">
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
      </div>
    </div>
  );
}