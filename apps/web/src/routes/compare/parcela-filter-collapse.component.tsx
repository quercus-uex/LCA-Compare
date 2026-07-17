import { useEffect, useState } from 'react';
import { type Parcela, useParcela } from '../../hooks/parcela.hook.tsx';
import type { CompareFilterType } from '../../hooks/compare.hook.tsx';
import { FilterCollapse } from './filter-collapse.component';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useTranslation } from 'react-i18next';

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
    if (usuario) parcela.getFromToken().then((p) => setParcelas(p));
  }, [parcela, usuario]);

  const toggleParcela = (p: Parcela) => {
    const selected = filters.parcelas!;
    if (selected.find((i) => i.id === p.id)) {
      setFilters({ ...filters, parcelas: selected.filter((i) => i.id !== p.id) });
    } else {
      setFilters({ ...filters, parcelas: [...selected, p] });
    }
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
                className={`list-row rounded-none flex items-center hover:bg-base-300 cursor-pointer ${filters.parcelas!.find(i => i.id === p.id) ? 'bg-base-300' : ''}`}
                onClick={() => toggleParcela(p)}
              >
                {p.nombre}
              </li>
            ))}
        </ul>
      </div>
    </FilterCollapse>
  );
}
