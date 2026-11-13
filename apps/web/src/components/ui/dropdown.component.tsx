import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Link, type To } from 'react-router';
import { buttonClass, type ButtonSize, type ButtonVariant } from './button.component.tsx';

type Props = {
  trigger: ReactNode;
  variant: ButtonVariant;
  size?: ButtonSize;
  /** Disparador redondo, para iconos y avatares */
  circle?: boolean;
  /** Borde del disparador con el que se alinea el panel: `end` para los de la derecha de la pantalla */
  align?: 'start' | 'end';
  /** Ancho del panel (`w-56`, p. ej.) */
  width?: string;
  /** Nombre accesible del disparador si su contenido no lo da (un icono) */
  label?: string;
  /** Tooltip del disparador; por defecto, `label` */
  title?: string;
  /** Elementos del panel que lo cierran al pulsarlos */
  closeOn?: string;
  /** Clases extra del panel (alto máximo y desplazamiento, p. ej.) */
  contentClassName?: string;
  children: ReactNode;
};

// Los desplegables de DaisyUI se abren con el foco, así que se cierran quitándolo
const close = () => (document.activeElement as HTMLElement | null)?.blur();

const closeOnEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

/** Desplegable que se cierra al elegir una opción o con Escape */
export const Dropdown = ({
  trigger,
  variant,
  size,
  circle,
  align = 'end',
  width = 'w-56',
  label,
  title = label,
  closeOn = 'a, button',
  contentClassName,
  children,
}: Props) => (
  // Los manejadores solo delegan los eventos de los botones y enlaces que contiene
  <div className={`dropdown ${align === 'end' ? 'dropdown-end' : 'dropdown-start'}`} role="presentation" onKeyDown={closeOnEscape}>
    <button
      type="button"
      tabIndex={0}
      className={buttonClass({ variant, size }, undefined, circle ? 'circle' : undefined)}
      aria-label={label}
      title={title}
    >
      {trigger}
    </button>
    <div
      role="presentation"
      tabIndex={-1}
      className={`dropdown-content z-[1000] mt-2 max-w-[calc(100vw-2rem)] rounded-box bg-base-100 p-2 shadow-sm ${width} ${contentClassName ?? ''}`}
      onClick={(e: MouseEvent) => {
        if ((e.target as HTMLElement).closest(closeOn)) close();
      }}
    >
      {children}
    </div>
  </div>
);

/** Lista de opciones de un desplegable */
export const Menu = ({ children }: { children: ReactNode }) => <ul className="menu w-full p-0">{children}</ul>;

/** Encabezado de un grupo de opciones */
export const MenuTitle = ({ children }: { children: ReactNode }) => <li className="menu-title">{children}</li>;

type MenuItemProps = {
  children: ReactNode;
  danger?: boolean;
  /** Opción de la vista actual (sección elegida en un menú lateral, p. ej.) */
  active?: boolean;
} & ({ onClick: () => void } | { to: To } | { href: string });

/** Opción del menú: acción con `onClick`, navegación con `to` o enlace externo con `href` */
export const MenuItem = ({ children, danger, active, ...action }: MenuItemProps) => {
  // Mismo resaltado que los enlaces de la barra de navegación (`ButtonNavLink`)
  const className = [active && 'bg-base-200 font-semibold text-secondary', danger && 'text-danger'].filter(Boolean).join(' ') || undefined;
  const current = active ? 'page' : undefined;
  return (
    <li>
      {'to' in action && <Link to={action.to} className={className} aria-current={current}>{children}</Link>}
      {'href' in action && (
        <a href={action.href} target="_blank" rel="noreferrer" className={className}>{children}</a>
      )}
      {'onClick' in action && (
        <button type="button" className={className} aria-current={current} onClick={action.onClick}>{children}</button>
      )}
    </li>
  );
};
