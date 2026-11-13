import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiCheck, FiClock, FiSlash, FiX, FiXCircle } from 'react-icons/fi';
import { Badge, type BadgeTone, IconButton } from '../../components/ui/index.ts';
import type { ConsentimientoEstado } from '../../hooks/organizacion.hook.tsx';

// El estado se distingue por color y por icono, no solo por color
const ESTADO_STYLE: Record<ConsentimientoEstado, { tone: BadgeTone; className?: string; icon: IconType }> = {
  aceptado: { tone: 'success', icon: FiCheck },
  pendiente: { tone: 'warning', icon: FiClock },
  rechazado: { tone: 'error', icon: FiXCircle },
  revocado: { tone: 'neutral', className: 'text-muted', icon: FiSlash },
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
  const { tone, className, icon } = ESTADO_STYLE[estado];
  const estadoLabel = t(`organizaciones.estados.${estado}`);

  return (
    <Badge tone={tone} icon={icon} title={estadoLabel} className={`tabular-nums ${className ?? ''} ${action ? 'pr-0.5' : ''}`}>
      {anio}
      <span className="sr-only">: {estadoLabel}</span>
      {action && (
        <IconButton icon={FiX} label={action.label} size="xs" className="size-5 min-h-0" onClick={action.onClick} />
      )}
    </Badge>
  );
};

/** Solo el estado, para tablas en las que el año va en otra columna */
export const EstadoBadge = ({ estado }: { estado: ConsentimientoEstado }) => {
  const { t } = useTranslation();
  const { tone, className, icon } = ESTADO_STYLE[estado];
  return (
    <Badge tone={tone} size="sm" icon={icon} className={className}>
      {t(`organizaciones.estados.${estado}`)}
    </Badge>
  );
};

/** Leyenda de los estados, para las listas de chips */
export const CampaniaLegend = ({ estados }: { estados: readonly ConsentimientoEstado[] }) => {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted" aria-label={t('organizaciones.legend')}>
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
