import type { CSSProperties, ReactNode } from 'react';
import type { IconType } from 'react-icons';

/**
 * - `neutral`: dato sin connotación (método de cálculo, rol de usuario)
 * - `primary`: marca o selección (filtro aplicado, campaña actual)
 * - `secondary`: destacado con más peso (administrador, contador)
 * - `success`, `warning`, `error`: estados
 * - `outline`: con borde del color que se pase en `color` (tipos de cultivo)
 */
export type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'badge-ghost',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  outline: 'badge-outline',
};

const SIZE_CLASS = { xs: 'badge-xs', sm: 'badge-sm', md: '' } as const;

type Props = {
  tone?: BadgeTone;
  size?: keyof typeof SIZE_CLASS;
  icon?: IconType;
  /** Color del borde y del icono, solo con `tone="outline"` */
  color?: string;
  title?: string;
  className?: string;
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', size = 'md', icon: Icon, color, title, className, children }: Props) => {
  const style: CSSProperties | undefined = color ? { borderColor: color } : undefined;
  return (
    <span
      title={title}
      style={style}
      className={`badge gap-1 whitespace-nowrap ${TONE_CLASS[tone]} ${SIZE_CLASS[size]} ${className ?? ''}`}
    >
      {Icon && <Icon aria-hidden className={`shrink-0 ${size === 'md' ? 'size-3.5' : 'size-3'}`} style={color ? { color } : undefined} />}
      {children}
    </span>
  );
};

/** Punto de color que identifica una serie o categoría junto a su nombre */
export const ColorDot = ({ color, size = 'md' }: { color: string; size?: 'sm' | 'md' }) => (
  <span aria-hidden className={`shrink-0 rounded-full ${size === 'sm' ? 'size-2' : 'size-2.5'}`} style={{ backgroundColor: color }} />
);
