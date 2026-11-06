import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

type Props = {
  trigger: ReactNode;
  triggerClassName: string;
  /** Clases extra del panel (ancho, sobre todo) */
  contentClassName?: string;
  label?: string;
  title?: string;
  children: ReactNode;
};

// Los desplegables de DaisyUI se abren con el foco, así que se cierran quitándolo
const close = () => (document.activeElement as HTMLElement | null)?.blur();

const closeOnItem = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('a, button')) close();
};

const closeOnEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

/** Desplegable alineado a la derecha que se cierra al elegir una opción o con Escape */
export const Dropdown = ({ trigger, triggerClassName, contentClassName = '', label, title, children }: Props) => (
  // Los manejadores solo delegan los eventos de los botones y enlaces que contiene
  <div className="dropdown dropdown-end" role="presentation" onKeyDown={closeOnEscape}>
    <button type="button" tabIndex={0} className={triggerClassName} aria-label={label} title={title}>
      {trigger}
    </button>
    <div
      role="presentation"
      tabIndex={-1}
      className={`dropdown-content z-[1000] mt-2 rounded-box bg-base-100 p-2 shadow-sm ${contentClassName}`}
      onClick={closeOnItem}
    >
      {children}
    </div>
  </div>
);
