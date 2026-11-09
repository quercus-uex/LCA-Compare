import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { ADMIN_LOOKUP_TAKE } from '../../common/constants.ts';
import { safeString } from '../../common/utils.ts';
import { useFieldControl } from '../../components/ui/form.component.tsx';
import { Button, IconButton, Skeleton } from '../../components/ui/index.ts';
import { useClickOutside } from '../../hooks/use-click-outside.ts';
import { useDebouncedValue } from '../../hooks/use-debounced-value.ts';
import { fetchOne, fetchPage } from './admin-api.ts';
import { ENTITY_DISPLAY, type Entity, type Item } from './admin.config.ts';

type Props = {
  /** Sin él, toma el del `Field` que lo envuelve */
  id?: string;
  entity: Entity;
  value: string;
  initialLabel?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
};

type Option = { id: string; label: string; detail: string };

const toOption = (entity: Entity, item: Item): Option => ({
  id: safeString(item.id) ?? '',
  label: ENTITY_DISPLAY[entity].label(item),
  detail: ENTITY_DISPLAY[entity].detail?.(item) ?? '',
});

/** Selector de un registro relacionado con búsqueda en el servidor */
export const IdLookupField = ({ id, entity, value, initialLabel, onChange, disabled, clearable }: Props) => {
  const { t } = useTranslation();
  const control = useFieldControl(id);
  const invalid = control['aria-invalid'];
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    value && initialLabel ? { [value]: initialLabel } : {},
  );
  const [reloadKey, setReloadKey] = useState(0);

  // Etiqueta del valor actual cuando no viene con el registro (p. ej. tras un cambio externo)
  useEffect(() => {
    if (!value || labels[value]) return;
    const controller = new AbortController();
    void fetchOne(entity, value, controller.signal)
      .then((item) => setLabels((prev) => ({ ...prev, [value]: ENTITY_DISPLAY[entity].label(item) })))
      .catch(() => undefined);
    return () => controller.abort();
  }, [entity, value, labels]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetchPage(entity, { search: debouncedQuery.trim(), skip: 0, take: ADMIN_LOOKUP_TAKE }, controller.signal)
      .then(({ data }) => {
        setOptions(data.map((item) => toOption(entity, item)));
        setActive(0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [entity, debouncedQuery, open, reloadKey]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);
  useClickOutside(containerRef, close);

  const select = (option: Option) => {
    setLabels((prev) => ({ ...prev, [option.id]: option.label }));
    onChange(option.id);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = options[active];
      if (option) select(option);
    } else if (e.key === 'Escape') {
      // Evita que el Escape cierre también el modal que contiene el campo
      e.stopPropagation();
      close();
    }
  };

  const currentLabel = value ? (labels[value] ?? t('admin.lookup.loading')) : '';

  return (
    <div ref={containerRef} className="relative">
      {/* eslint-disable-next-line no-restricted-syntax -- mismo marco que `Input`, pero con la acción de borrar y el indicador al final */}
      <label className={`input w-full ${invalid ? 'border-danger' : ''}`}>
        {open && <FiSearch className="shrink-0 text-muted" aria-hidden />}
        <input
          id={control.id}
          aria-describedby={control['aria-describedby']}
          aria-invalid={invalid}
          aria-required={control.required}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className="grow min-w-0"
          placeholder={open ? t('admin.lookup.searchPlaceholder') : t('admin.lookup.selectPlaceholder')}
          value={open ? query : currentLabel}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {value && clearable && !disabled && !open && (
          <IconButton icon={FiX} size="xs" label={t('common.actions.clearSelection')} onClick={() => onChange('')} />
        )}
        <FiChevronDown className="shrink-0 text-muted" aria-hidden />
      </label>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-box shadow-lg max-h-64 overflow-y-auto"
        >
          {loading && options.length === 0 && (
            <div className="p-3 flex flex-col gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          )}
          {error && (
            <div className="p-3 text-center text-sm">
              <p>{t('admin.messages.optionsError')}</p>
              <Button variant="ghost" size="xs" className="mt-1" onClick={() => setReloadKey((k) => k + 1)}>
                {t('common.actions.retry')}
              </Button>
            </div>
          )}
          {!loading && !error && options.length === 0 && (
            <p className="p-3 text-center text-sm text-muted">
              {query ? t('common.empty.noResults') : t('common.empty.noOptions')}
            </p>
          )}
          {!error &&
            options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={`w-full text-left px-3 py-2 text-sm flex flex-col transition-colors ${
                  index === active ? 'bg-base-200' : ''
                } ${option.id === value ? 'font-semibold' : ''} ${loading ? 'opacity-60' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => select(option)}
              >
                <span>{option.label}</span>
                {option.detail && <span className="text-xs text-muted">{option.detail}</span>}
              </button>
            ))}
          {!loading && !error && options.length === ADMIN_LOOKUP_TAKE && (
            <p className="px-3 py-2 text-sm text-muted border-t border-base-200">
              {t('admin.lookup.refine')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
