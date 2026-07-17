import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../common/api.ts';
import { ADMIN_LOOKUP_TAKE } from '../../common/constants.ts';
import { safeString } from '../../common/utils.ts';

export interface FkConfig {
  entity: string;
  displayFields: string[];
  endpoint: string;
}

interface IdLookupFieldProps {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  fkConfig: FkConfig;
  disabled?: boolean;
}

interface LookupOption {
  id: string;
  label: string;
}

export const IdLookupField = ({ name, value, onChange, fkConfig, disabled }: IdLookupFieldProps) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const found = options.find((o) => o.id === value);
    return found?.label ?? value;
  }, [value, options]);

  const loadOptions = useCallback(async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams();
      params.set('skip', '0');
      params.set('take', String(ADMIN_LOOKUP_TAKE));
      const res = await apiRequest(`/admin/${fkConfig.endpoint}?${params}`, { signal });
      setError(false);
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data?: Record<string, unknown>[] };
      if (signal?.aborted) return;
      const data = json.data ?? [];
      const mapped: LookupOption[] = data.map((item) => ({
        id: safeString(item.id) ?? '',
        label: fkConfig.displayFields
          .map((f) => safeString(item[f]) ?? '')
          .filter(Boolean)
          .join(' '),
      }));
      setOptions(mapped);
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
      setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [fkConfig.endpoint, fkConfig.displayFields]);

  useEffect(() => {
    const controller = new AbortController();
    void loadOptions(controller.signal);
    return () => controller.abort();
  }, [loadOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = (option: LookupOption) => {
    onChange(name, option.id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(name, '');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-1">
        <input
          type="text"
          className="input input-bordered w-full cursor-pointer"
          placeholder={t('common.actions.search')}
          value={open ? search : selectedLabel}
          readOnly={!open}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              setSearch('');
            }
          }}
          onChange={(e) => setSearch(e.target.value)}
        />
        {value && !disabled && !open && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square shrink-0"
            onClick={handleClear}
            title={t('common.actions.clearSelection')}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-box shadow-lg max-h-60 overflow-hidden">
          <div className="px-2 pt-2 pb-1">
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Filtrar..."
              value={search}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: focus search on open
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto max-h-48">
            {loading && (
              <div className="p-4">
                <div className="skeleton w-full h-8 mb-1" />
                <div className="skeleton w-full h-8 mb-1" />
                <div className="skeleton w-3/4 h-8" />
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-error text-sm">
                <p>{t('admin.messages.optionsError')}</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs mt-1"
                  onClick={() => { setLoading(true); void loadOptions(); }}
                >
                  {t('common.actions.retry')}
                </button>
              </div>
            )}

            {!loading && !error && filteredOptions.length === 0 && (
              <p className="p-3 text-center text-base-content/50 text-sm">
                {search ? t('common.empty.noResults') : t('common.empty.noOptions')}
              </p>
            )}

            {!loading &&
              !error &&
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                    option.id === value ? 'bg-base-200 font-semibold' : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <span className="text-base-content/50 text-xs mr-2">#{option.id}</span>
                  {option.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
