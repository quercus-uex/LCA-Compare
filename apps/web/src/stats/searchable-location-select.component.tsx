import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';

type Props<T> = {
  items: T[];
  value: T | null;
  onChange: (item: T | null) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  emptyMessage?: string;
};

export function SearchableLocationSelect<T>({
  items,
  value,
  onChange,
  getLabel,
  getId,
  placeholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items
    .filter((item) => {
      if (!query) return true;
      return getLabel(item).toLowerCase().includes(query.toLowerCase());
    })
    .slice(0, 10);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightIndex(0);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  const selectItem = (item: T) => {
    onChange(item);
    setQuery('');
    close();
  };

  const clearSelection = () => {
    onChange(null);
    setQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectItem(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const handleFocus = () => {
    if (items.length > 0 && !value) {
      setIsOpen(true);
    }
  };

  const displayValue = value ? getLabel(value) : '';

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input input-bordered input-sm w-full pr-8"
          placeholder={value ? '' : placeholder}
          value={displayValue || query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(0);
            if (value) onChange(null);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            onClick={clearSelection}
            tabIndex={-1}
          >
            &#x2715;
          </button>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full bg-base-200 border border-base-300 rounded-box shadow-lg max-h-48 overflow-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-base-content/50">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((item, i) => (
              <li
                key={getId(item)}
                className={`px-3 py-1.5 text-sm cursor-pointer ${
                  i === highlightIndex
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-300'
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(item);
                }}
              >
                {getLabel(item)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
