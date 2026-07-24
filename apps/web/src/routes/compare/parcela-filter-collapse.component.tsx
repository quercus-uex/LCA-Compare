import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toggleInArray } from '../../common/utils.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';

export const ParcelaFilterCollapse = (
  {
    filters,
    setFilters,
  }: {
    filters: CompareFilterType,
    setFilters: (f: CompareFilterType) => void,
  }
) => {
  const parcela = useParcela();
  const { usuario } = useAuth();
  const { t } = useTranslation();

  const [enabled, setEnabled] = useState<boolean>(!!(filters.parcelas && filters.parcelas.length > 0));
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (usuario) void parcela.getFromToken().then((p) => setParcelas(p));
  }, [parcela, usuario]);

  const toggleParcela = (p: Parcela) => {
    setFilters({ ...filters, parcelas: toggleInArray(filters.parcelas ?? [], p) });
  };

  return (
    <FilterCollapse
      title={t('compare.filters.plots')}
      enabled={enabled}
      onToggle={(isEnabled) => {
        setEnabled(isEnabled);
        if (!isEnabled) setFilters({ ...filters, parcelas: [] });
      }}
      disabled={!usuario}
    >
      <div className="flex flex-col gap-5 w-full">
        <input
          className="input w-full"
          placeholder={t('compare.filters.placeholders.plot')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ul className="list rounded-box shadow-sm h-40 overflow-auto bg-base-100">
          {parcelas
            .filter((p) =>
              p.nombre.toUpperCase().includes(query.toUpperCase()),
            )
            .map((p) => (
              <li
                key={p.id}
                className={`list-row rounded-none flex items-center hover:bg-base-300 cursor-pointer ${filters.parcelas?.find(i => i.id === p.id) ? 'bg-base-300' : ''}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => toggleParcela(p)}
                >
                  {p.nombre}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </FilterCollapse>
  );
}
