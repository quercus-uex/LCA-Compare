import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiCheck, FiClock, FiSlash, FiX, FiXCircle } from 'react-icons/fi';
import type { ConsentimientoEstado } from '../../hooks/organizacion.hook.tsx';

// El estado se distingue por color y por icono, no solo por color
const ESTADO_STYLE: Record<ConsentimientoEstado, { className: string; icon: IconType }> = {
  aceptado: { className: 'badge-success', icon: FiCheck },
  pendiente: { className: 'badge-warning', icon: FiClock },
  rechazado: { className: 'badge-error badge-outline', icon: FiXCircle },
  revocado: { className: 'badge-ghost text-base-content/70', icon: FiSlash },
};

type Props = {
  anio: number;
  estado: ConsentimientoEstado;
  /** Botón para retirar la campaña (revocar o cancelar), dentro del propio chip */
  action?: { label: string; onClick: () => void };
};

/** Año de campaña con el estado de su consentimiento */
export const CampaniaChip = ({ anio, estado, action }: Props) => {
  const { t } = useTranslation();
  const { className, icon: Icon } = ESTADO_STYLE[estado];
  const estadoLabel = t(`organizaciones.estados.${estado}`);

  return (
    <span className={`badge gap-1 tabular-nums ${className} ${action ? 'pr-0.5' : ''}`} title={estadoLabel}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {anio}
      <span className="sr-only">: {estadoLabel}</span>
      {action && (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle size-5 min-h-0"
          aria-label={action.label}
          title={action.label}
          onClick={action.onClick}
        >
          <FiX aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
};

/** Solo el estado, para tablas en las que el año va en otra columna */
export const EstadoBadge = ({ estado }: { estado: ConsentimientoEstado }) => {
  const { t } = useTranslation();
  const { className, icon: Icon } = ESTADO_STYLE[estado];
  return (
    <span className={`badge badge-sm gap-1 ${className}`}>
      <Icon aria-hidden className="size-3 shrink-0" />
      {t(`organizaciones.estados.${estado}`)}
    </span>
  );
};

/** Leyenda de los estados, para las listas de chips */
export const CampaniaLegend = ({ estados }: { estados: readonly ConsentimientoEstado[] }) => {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/70" aria-label={t('organizaciones.legend')}>
      {estados.map((estado) => {
        const { icon: Icon } = ESTADO_STYLE[estado];
        return (
          <li key={estado} className="flex items-center gap-1">
            <Icon aria-hidden />
            {t(`organizaciones.estados.${estado}`)}
          </li>
        );
      })}
    </ul>
  );
};
