import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiInbox, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { Button } from './button.component.tsx';

export type CalloutTone = 'info' | 'warning' | 'error' | 'neutral';

const CALLOUT_STYLE: Record<CalloutTone, { className: string; iconClassName?: string; icon: IconType }> = {
  info: { className: 'bg-info/60', icon: FiInfo },
  warning: { className: 'bg-warning/60', icon: FiAlertTriangle },
  error: { className: 'bg-error/70', icon: FiAlertTriangle },
  neutral: { className: 'bg-base-100 shadow-sm', iconClassName: 'text-secondary', icon: FiInfo },
};

type CalloutProps = {
  tone?: CalloutTone;
  /** Sustituye al icono del tono; `false` lo quita */
  icon?: IconType | false;
  /** Acción a la derecha (reintentar, ir a…) */
  action?: ReactNode;
  /** Se anuncia al aparecer: para errores y avisos que llegan tras una acción */
  live?: boolean;
  className?: string;
  children: ReactNode;
};

/** Nota o aviso en línea dentro de una vista */
export const Callout = ({ tone = 'info', icon, action, live, className, children }: CalloutProps) => {
  const style = CALLOUT_STYLE[tone];
  const Icon = icon === false ? null : (icon ?? style.icon);
  return (
    <div
      role={live ? 'alert' : undefined}
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-box px-4 py-3 text-sm ${style.className} ${className ?? ''}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        {Icon && <Icon aria-hidden className={`mt-0.5 shrink-0 ${style.iconClassName ?? ''}`} />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {action}
    </div>
  );
};

/** Error de carga con la opción de reintentar */
export const ErrorAlert = ({ message, onRetry, tone = 'error' }: {
  message: string;
  onRetry?: () => void;
  /** `warning` cuando aún se muestran datos anteriores */
  tone?: 'error' | 'warning';
}) => {
  const { t } = useTranslation();
  return (
    <Callout
      tone={tone}
      live
      action={onRetry && (
        <Button variant="ghost" size="sm" icon={FiRefreshCw} onClick={onRetry}>
          {t('common.actions.retry')}
        </Button>
      )}
    >
      {message}
    </Callout>
  );
};

type EmptyStateProps = {
  title?: string;
  description: ReactNode;
  icon?: IconType | false;
  action?: ReactNode;
  /** Nivel del título, para que encaje en la jerarquía de la página */
  headingLevel?: 'h2' | 'h3';
  /**
   * `card`: ocupa el lugar de una lista o una página entera.
   * `inset`: dentro de una tarjeta que ya existe (una gráfica sin datos, p. ej.)
   */
  variant?: 'card' | 'inset';
  className?: string;
};

/** Estado sin contenido: nada que mostrar todavía o ningún resultado para los filtros */
export const EmptyState = ({
  title,
  description,
  icon: Icon = FiInbox,
  action,
  headingLevel: Heading = 'h2',
  variant = 'card',
  className,
}: EmptyStateProps) => {
  const inset = variant === 'inset';
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-box p-6 text-center ${
        inset ? 'bg-base-200/50 text-sm' : 'bg-base-100 py-16 shadow-sm'
      } ${className ?? ''}`}
    >
      {Icon && <Icon aria-hidden className={`${inset ? 'size-8' : 'size-12'} text-base-content/40`} />}
      {title && <Heading className={`font-semibold ${inset ? 'text-base' : 'text-lg'}`}>{title}</Heading>}
      <div className="max-w-md text-muted">{description}</div>
      {action}
    </div>
  );
};
