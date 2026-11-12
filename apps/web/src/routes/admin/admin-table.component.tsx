import { CONSENTIMIENTO_ESTADOS, type ConsentimientoEstado } from 'common/organizacion';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiChevronDown, FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatNumericDate, formatQuantity } from '../../common/format.ts';
import { safeString } from '../../common/utils.ts';
import { Badge, Button, EmptyState, IconButton, Skeleton } from '../../components/ui/index.ts';
import { useCropTypeLabel } from '../../hooks/use-crop-type-label.ts';
import { EstadoBadge } from '../organizaciones/campania-chip.component.tsx';
import { canDo, CONFIG, ENTITY_DISPLAY, type ColumnConfig, type Entity, type Item } from './admin.config.ts';

type Props = {
  entity: Entity;
  data: Item[];
  loading: boolean;
  loaded: boolean;
  filtered: boolean;
  expanded: Set<string>;
  currentUserId?: string;
  toggleExpand: (id: string) => void;
  onEdit: (item: Item, entity?: Entity) => void;
  onDelete: (item: Item, entity?: Entity) => void;
  onCreate: () => void;
  onNavigate: (entity: Entity, id: string, label: string) => void;
};

const formatAdminDate = (value: unknown) => {
  const str = safeString(value);
  return str ? formatNumericDate(str) : null;
};

const Empty = () => <span className="text-muted">—</span>;

// Cuando la tabla no cabe y se desplaza en horizontal (móvil, tablet), la columna de
// acciones se queda fija a la derecha para no tener que buscarla. Su fondo es opaco,
// con el mismo tono que el hover de la fila, para que no se vea lo que pasa por debajo;
// la línea de la izquierda la separa de las columnas que se desplazan
const STICKY_ACTIONS =
  'sticky right-0 z-[1] bg-base-100 group-hover:bg-[color-mix(in_oklab,var(--color-base-200)_50%,var(--color-base-100))] max-xl:shadow-[inset_1px_0_0_var(--color-base-200)]';

const isEstado = (value: unknown): value is ConsentimientoEstado =>
  CONSENTIMIENTO_ESTADOS.includes(value as ConsentimientoEstado);

export const AdminTable = ({
  entity,
  data,
  loading,
  loaded,
  filtered,
  expanded,
  currentUserId,
  toggleExpand,
  onEdit,
  onDelete,
  onCreate,
  onNavigate,
}: Props) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();
  const config = CONFIG[entity];
  const expandable = entity === 'parcelas';

  const renderCell = (column: ColumnConfig, item: Item) => {
    const raw = item[column.key];
    switch (column.kind) {
      case 'text': {
        const value = column.value(item);
        if (!value) return <Empty />;
        if (column.primary && canDo(entity, 'edit')) {
          return (
            <button
              type="button"
              className="font-medium text-left hover:text-secondary hover:underline underline-offset-2"
              onClick={() => onEdit(item)}
            >
              {value}
            </button>
          );
        }
        if (column.primary) return <span className="font-medium">{value}</span>;
        return <span className={column.mono ? 'font-mono text-xs' : ''}>{value}</span>;
      }
      case 'role':
        return (
          <Badge tone={raw === 'admin' ? 'secondary' : 'neutral'} size="sm">
            {t(`admin.roles.${safeString(raw) ?? 'usuario'}`)}
          </Badge>
        );
      case 'boolean':
        return raw === true ? (
          <Badge tone="success" size="sm">{t('common.yes')}</Badge>
        ) : (
          <span className="text-muted text-sm">{t('common.no')}</span>
        );
      case 'date':
        return formatAdminDate(raw) ?? <Empty />;
      case 'number': {
        if (typeof raw !== 'number') return <Empty />;
        return (
          <span className="tabular-nums">
            {formatQuantity(raw)}
            {column.unitKey && <span className="text-muted text-xs"> {t(column.unitKey)}</span>}
          </span>
        );
      }
      case 'crop':
        return typeof raw === 'string' ? (
          <button
            type="button"
            className="font-medium text-left hover:text-secondary hover:underline underline-offset-2"
            onClick={() => onEdit(item)}
          >
            {getCropTypeLabel(raw)}
          </button>
        ) : (
          <Empty />
        );
      case 'consentState':
        return isEstado(raw) ? <EstadoBadge estado={raw} /> : <Empty />;
      case 'parcelId': {
        const ids = [
          ['SIGPAC', item.sigpac],
          [t('admin.fields.refCatShort'), item.refCat],
          [t('admin.fields.ptIdShort'), item.ptIdParcela],
        ].filter(([, v]) => typeof v === 'string' && v !== '');
        if (ids.length === 0) return <Empty />;
        return (
          <div className="flex flex-col gap-0.5">
            {ids.map(([label, v]) => (
              <span key={String(label)} className="text-xs">
                <span className="text-muted">{String(label)}</span>{' '}
                <span className="font-mono">{String(v)}</span>
              </span>
            ))}
          </div>
        );
      }
      case 'link': {
        const relatedItem = item[column.relation];
        const id = safeString(raw);
        if (!id) {
          return column.missingKey ? (
            <Badge tone="warning" size="sm" icon={FiAlertTriangle}>
              {t(column.missingKey)}
            </Badge>
          ) : (
            <Empty />
          );
        }
        const display = ENTITY_DISPLAY[column.entity];
        const relatedObj = relatedItem && typeof relatedItem === 'object' ? (relatedItem as Item) : null;
        const label = relatedObj ? display.label(relatedObj) : id;
        const detail = relatedObj ? display.detail?.(relatedObj) : undefined;
        return (
          <button
            type="button"
            className="text-left group"
            title={t('admin.goTo', { entity: t(CONFIG[column.entity].labelKey) })}
            onClick={() => onNavigate(column.entity, id, label)}
          >
            <span className="link link-hover text-secondary">{label}</span>
            {detail && <span className="block text-xs text-muted">{detail}</span>}
          </button>
        );
      }
    }
  };

  const hasActions = canDo(entity, 'edit') || canDo(entity, 'delete');

  const actions = (item: Item, target?: Entity) => {
    const actionEntity = target ?? entity;
    const isSelf = actionEntity === 'usuarios' && item.id === currentUserId;
    return (
      <div className="flex justify-end gap-1">
        {canDo(actionEntity, 'edit') && (
          <IconButton icon={FiEdit2} label={t('common.actions.edit')} onClick={() => onEdit(item, target)} />
        )}
        {canDo(actionEntity, 'delete') && (
          // Un botón desactivado no muestra su tooltip: el motivo va en el contenedor
          <span className="flex" title={isSelf ? t('admin.delete.ownAccount') : undefined}>
            <IconButton
              icon={FiTrash2}
              label={t('common.actions.delete')}
              variant="danger-ghost"
              disabled={isSelf}
              onClick={() => onDelete(item, target)}
            />
          </span>
        )}
      </div>
    );
  };

  if (!loaded) {
    return (
      <div className="flex flex-col gap-2 p-4" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={config.icon}
        headingLevel="h3"
        title={filtered ? t('common.empty.noResults') : t('admin.empty.title')}
        description={
          filtered ? t('admin.empty.filtered') : t(canDo(entity, 'create') ? 'admin.empty.create' : 'admin.empty.readOnly')
        }
        action={
          !filtered &&
          canDo(entity, 'create') && (
            <Button variant="primary" size="sm" icon={FiPlus} onClick={onCreate}>
              {t(`admin.createTitles.${config.titleKey}`)}
            </Button>
          )
        }
        variant="inset"
        className="py-16"
      />
    );
  }

  const colSpan = config.columns.length + (expandable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
      <table className="table">
        <thead>
          <tr className="text-muted">
            {expandable && <th className="w-10" aria-label={t('admin.viewCrops')} />}
            {config.columns.map((column) => (
              <th key={column.key} className="font-medium">
                {t(column.labelKey)}
              </th>
            ))}
            {hasActions && <th className={`w-24 text-right font-medium ${STICKY_ACTIONS}`}>{t('common.fields.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const id = item.id as string;
            const cultivos = Array.isArray(item.cultivos) ? (item.cultivos as Item[]) : [];
            const isExpanded = expandable && expanded.has(id);
            return (
              <Fragment key={id}>
                <tr className="group hover:bg-base-200/50">
                  {expandable && (
                    <td className="px-2">
                      {cultivos.length > 0 && (
                        <IconButton
                          icon={isExpanded ? FiChevronDown : FiChevronRight}
                          label={t('admin.viewCrops')}
                          size="xs"
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpand(id)}
                        />
                      )}
                    </td>
                  )}
                  {config.columns.map((column) => (
                    <td key={column.key}>{renderCell(column, item)}</td>
                  ))}
                  {hasActions && <td className={STICKY_ACTIONS}>{actions(item)}</td>}
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={colSpan} className="bg-base-200/50 p-0">
                      <div className="p-4 pl-12">
                        <p className="text-sm font-medium mb-2">
                          {t('admin.cropsOf', { name: safeString(item.nombre) ?? id, count: cultivos.length })}
                        </p>
                        <div className="rounded-box border border-base-300 bg-base-100 overflow-x-auto">
                          <table className="table table-sm">
                            <thead>
                              <tr className="text-muted">
                                <th className="font-medium">{t('admin.fields.tipo')}</th>
                                <th className="font-medium">{t('admin.fields.fechaInicioCampania')}</th>
                                <th className="font-medium">{t('admin.fields.superficieCultivada')}</th>
                                <th className="font-medium">{t('admin.fields.produccion')}</th>
                                <th className="font-medium">{t('admin.fields.consumoAgua')}</th>
                                <th className="font-medium">{t('admin.fields.ciclo')}</th>
                                <th className={`w-24 text-right font-medium ${STICKY_ACTIONS}`}>{t('common.fields.actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cultivos.map((c) => (
                                <tr key={c.id as string} className="group">
                                  <td>{typeof c.tipo === 'string' ? getCropTypeLabel(c.tipo) : <Empty />}</td>
                                  <td>{formatAdminDate(c.fechaInicioCampania) ?? <Empty />}</td>
                                  {(
                                    [
                                      ['superficieCultivada', 'common.units.hectares'],
                                      ['produccion', 'common.units.kilograms'],
                                      ['consumoAgua', 'common.units.cubicMeters'],
                                      ['ciclo', 'common.units.days'],
                                    ] as const
                                  ).map(([key, unit]) => {
                                    const value = c[key];
                                    return (
                                    <td key={key} className="tabular-nums">
                                      {typeof value === 'number' ? (
                                        <>
                                          {formatQuantity(value)}
                                          <span className="text-muted text-xs"> {t(unit)}</span>
                                        </>
                                      ) : (
                                        <Empty />
                                      )}
                                    </td>
                                    );
                                  })}
                                  <td className={STICKY_ACTIONS}>{actions({ ...c, parcela: { id, nombre: item.nombre } }, 'cultivos')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
