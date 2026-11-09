import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { Link, type LinkProps } from 'react-router';
import { Spinner } from './loading.component.tsx';

/**
 * Intención del botón, no su aspecto:
 * - `primary`: la acción principal de la vista o del bloque (una por bloque)
 * - `secondary`: acción destacada que acompaña a la principal o la sustituye
 * - `outline`: acción secundaria visible (ver detalle, exportar, transferir)
 * - `ghost`: acción terciaria o de bajo peso (cancelar, marcar como leído)
 * - `danger`: confirmación de una acción destructiva
 * - `danger-ghost`: acción destructiva que no es la principal (expulsar, cerrar sesión)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  // El primario como texto no llega al contraste AA: el contorno usa el secundario
  outline: 'btn-outline btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-error',
  // Desactivado conserva el gris de DaisyUI
  'danger-ghost': 'btn-ghost enabled:text-danger',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

type StyleProps = {
  variant: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho disponible */
  block?: boolean;
  /** Icono decorativo delante del texto */
  icon?: IconType;
};

/** Clases de botón, para los componentes de `ui` que pintan su propio disparador (el desplegable) */
export const buttonClass = ({ variant, size = 'md', block }: Omit<StyleProps, 'icon'>, extra?: string, shape?: 'circle') =>
  ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], block && 'w-full', shape && 'btn-circle', extra]
    .filter(Boolean)
    .join(' ');

const Content = ({ icon: Icon, loading, children }: { icon?: IconType; loading?: boolean; children?: ReactNode }) => (
  <>
    {loading ? <Spinner /> : Icon && <Icon aria-hidden className="shrink-0" />}
    {children}
  </>
);

type ButtonProps = StyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    /** Muestra un spinner en lugar del icono y desactiva el botón */
    loading?: boolean;
    children: ReactNode;
  };

export const Button = ({ variant, size, block, icon, loading, className, disabled, type = 'button', children, ...rest }: ButtonProps) => (
  <button
    {...rest}
    type={type}
    disabled={disabled || loading}
    className={buttonClass({ variant, size, block }, className)}
  >
    <Content icon={icon} loading={loading}>{children}</Content>
  </button>
);

type ButtonLinkProps = StyleProps & { className?: string; children: ReactNode } & (
  | Omit<LinkProps, 'className' | 'children'>
  /** Enlace externo: se abre en otra pestaña */
  | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
);

/** Enlace con aspecto de botón: navegación interna con `to`, externa con `href` */
export const ButtonLink = ({ variant, size, block, icon, className, children, ...rest }: ButtonLinkProps) => {
  const classes = buttonClass({ variant, size, block }, className);
  const content = <Content icon={icon}>{children}</Content>;
  if ('href' in rest) {
    return <a {...rest} className={classes} target="_blank" rel="noreferrer">{content}</a>;
  }
  return <Link {...rest} className={classes}>{content}</Link>;
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  icon: IconType;
  /** Nombre accesible, también visible como tooltip: un botón de solo icono no puede ir sin él */
  label: string;
  variant?: Extract<ButtonVariant, 'ghost' | 'outline' | 'danger-ghost'>;
  size?: Exclude<ButtonSize, 'lg'>;
};

/** Botón redondo de solo icono */
export const IconButton = ({ icon: Icon, label, variant = 'ghost', size = 'sm', className, type = 'button', ...rest }: IconButtonProps) => (
  <button
    {...rest}
    type={type}
    aria-label={label}
    title={label}
    className={buttonClass({ variant, size }, className, 'circle')}
  >
    <Icon aria-hidden className={size === 'xs' ? 'size-3.5' : 'size-4'} />
  </button>
);

type ToggleButtonProps = Omit<ButtonProps, 'variant' | 'aria-pressed'> & { pressed: boolean };

/** Botón que se activa y desactiva, solo o junto a otros (selección de años, p. ej.) */
export const ToggleButton = ({ pressed, ...rest }: ToggleButtonProps) => (
  <Button {...rest} variant={pressed ? 'primary' : 'outline'} aria-pressed={pressed} />
);

type SegmentedControlProps<T extends string> = {
  /** Nombre accesible del grupo */
  label: string;
  options: readonly { value: T; label: ReactNode }[];
  value: T | undefined;
  onChange: (value: T) => void;
  size?: Exclude<ButtonSize, 'lg'>;
  /** Ocupa todo el ancho y reparte el espacio entre las opciones */
  block?: boolean;
};

// Misma altura total que los botones (24, 32 y 40 px) descontando el borde del contenedor
const SEGMENT_SIZE = {
  xs: 'h-[calc(1.5rem-2px)] px-2 text-xs',
  sm: 'h-[calc(2rem-2px)] px-3 text-xs',
  md: 'h-[calc(2.5rem-2px)] px-4 text-sm',
} as const;

/**
 * Elección única entre pocas opciones contiguas (país, idioma). El marco y los
 * divisores son del contenedor, no de cada opción: así no cambian ni se mueven
 * al elegir otra, solo cambia el relleno.
 */
export const SegmentedControl = <T extends string>({ label, options, value, onChange, size = 'sm', block }: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={`${block ? 'flex w-full' : 'inline-flex'} divide-x divide-secondary overflow-hidden rounded-field border border-secondary`}
  >
    {options.map((option) => {
      const pressed = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={pressed}
          className={`${SEGMENT_SIZE[size]} ${block ? 'flex-1' : ''} inline-flex cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-secondary ${
            pressed ? 'bg-primary text-primary-content' : 'text-secondary hover:bg-secondary/10'
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
