import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import type { IconType } from 'react-icons';

export type TabItem<T extends string> = { id: T; label: string; icon?: IconType };

type TabsProps<T extends string> = {
  /** Prefijo de los ids; el mismo que se pasa a `TabPanel` */
  id: string;
  /** Nombre accesible del grupo de pestañas */
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  /** En móvil ocupan todo el ancho */
  fill?: boolean;
  /** `false` si el contenido no va en un `TabPanel` (el panel no estaría enlazado) */
  withPanel?: boolean;
};

const tabId = (id: string, value: string) => `${id}-tab-${value}`;
const panelId = (id: string) => `${id}-panel`;

/** Pestañas con el patrón de ARIA: flechas, Inicio y Fin mueven el foco entre ellas */
export const Tabs = <T extends string>({ id, label, items, value, onChange, size = 'md', fill, withPanel = true }: TabsProps<T>) => {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const index = items.findIndex((item) => item.id === value);
    const last = items.length - 1;
    const nextIndex = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[e.key];
    const next = nextIndex === undefined ? undefined : items[nextIndex];
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    refs.current.get(next.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      // Siempre en una fila: si no caben, se desplazan en horizontal en lugar de saltar de línea
      className={`tabs tabs-box max-w-full flex-nowrap overflow-x-auto [scrollbar-width:thin] ${size === 'sm' ? 'tabs-sm' : ''} ${fill ? 'w-full sm:w-fit' : 'w-fit'}`}
    >
      {items.map(({ id: itemId, label: itemLabel, icon: Icon }) => {
        const selected = itemId === value;
        return (
          <button
            key={itemId}
            ref={(el) => {
              if (el) refs.current.set(itemId, el);
              else refs.current.delete(itemId);
            }}
            type="button"
            role="tab"
            id={tabId(id, itemId)}
            aria-selected={selected}
            aria-controls={withPanel ? panelId(id) : undefined}
            tabIndex={selected ? 0 : -1}
            className={`tab gap-2 whitespace-nowrap ${fill ? 'flex-1 sm:flex-none' : ''} ${selected ? 'tab-active' : ''}`}
            onClick={() => onChange(itemId)}
            onKeyDown={onKeyDown}
          >
            {Icon && <Icon aria-hidden className="hidden shrink-0 sm:block" />}
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
};

/** Contenido de la pestaña activa, enlazado a ella */
export const TabPanel = ({ tabsId, value, className, children }: {
  tabsId: string;
  value: string;
  className?: string;
  children: ReactNode;
}) => (
  <div role="tabpanel" id={panelId(tabsId)} aria-labelledby={tabId(tabsId, value)} className={className}>
    {children}
  </div>
);
