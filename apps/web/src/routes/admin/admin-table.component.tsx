import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiChevronDown, FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { safeString } from '../../common/utils.ts';
import { useCropTypeLabel } from '../../hooks/use-crop-type-label.ts';
import { CONFIG, ENTITY_DISPLAY, type ColumnConfig, type Entity, type Item } from './admin.config.ts';

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

const formatUtcDate = (value: unknown, locale: string) => {
  const str = safeString(value);
  if (!str) return null;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  // Las fechas de campaña se guardan a medianoche UTC
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

const Empty = () => <span className="text-base-content/40">—</span>;

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
  const { t, i18n } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();
  const config = CONFIG[entity];
  const expandable = entity === 'parcelas';
  const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 });

  const renderCell = (column: ColumnConfig, item: Item) => {
    const raw = item[column.key];
    switch (column.kind) {
      case 'text': {
        const value = column.value(item);
        if (!value) return <Empty />;
        if (column.primary) {
          return (
            <button
              type="button"
              className="font-medium text-left hover:text-primary hover:underline underline-offset-2"
              onClick={() => onEdit(item)}
            >
              {value}
            </button>
          );
        }
        return <span className={column.mono ? 'font-mono text-xs' : ''}>{value}</span>;
      }
      case 'role':
        return (
          <span className={`badge badge-sm ${raw === 'admin' ? 'badge-secondary' : 'badge-ghost'}`}>
            {t(`admin.roles.${safeString(raw) ?? 'usuario'}`)}
          </span>
        );
      case 'boolean':
        return raw === true ? (
          <span className="badge badge-sm badge-success">{t('common.yes')}</span>
        ) : (
          <span className="text-base-content/50 text-sm">{t('common.no')}</span>
        );
      case 'date':
        return formatUtcDate(raw, i18n.language) ?? <Empty />;
      case 'number': {
        if (typeof raw !== 'number') return <Empty />;
        return (
          <span className="tabular-nums">
            {numberFormat.format(raw)}
            {column.unitKey && <span className="text-base-content/60 text-xs"> {t(column.unitKey)}</span>}
          </span>
        );
      }
      case 'crop':
        return typeof raw === 'string' ? (
          <button
            type="button"
            className="font-medium text-left hover:text-primary hover:underline underline-offset-2"
            onClick={() => onEdit(item)}
          >
            {getCropTypeLabel(raw)}
          </button>
        ) : (
          <Empty />
        );
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
                <span className="text-base-content/60">{String(label)}</span>{' '}
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
            <span className="badge badge-sm badge-warning gap-1">
              <FiAlertTriangle aria-hidden />
              {t(column.missingKey)}
            </span>
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
            {detail && <span className="block text-xs text-base-content/60">{detail}</span>}
          </button>
        );
      }
    }
  };

  const actions = (item: Item, target?: Entity) => {
    const isSelf = (target ?? entity) === 'usuarios' && item.id === currentUserId;
    return (
      <div className="flex justify-end gap-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square tooltip tooltip-left"
          data-tip={t('common.actions.edit')}
          aria-label={t('common.actions.edit')}
          onClick={() => onEdit(item, target)}
        >
          <FiEdit2 aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square tooltip tooltip-left hover:bg-error hover:text-error-content disabled:bg-transparent"
          data-tip={isSelf ? t('admin.delete.ownAccount') : t('common.actions.delete')}
          aria-label={t('common.actions.delete')}
          disabled={isSelf}
          onClick={() => onDelete(item, target)}
        >
          <FiTrash2 aria-hidden />
        </button>
      </div>
    );
  };

  if (!loaded) {
    return (
      <div className="flex flex-col gap-2 p-4" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    const Icon = config.icon;
    return (
      <div className="flex flex-col items-center text-center gap-3 py-16 px-4">
        <div className="size-12 rounded-full bg-base-200 flex items-center justify-center">
          <Icon className="size-5 text-base-content/60" aria-hidden />
        </div>
        <div>
          <p className="font-medium">{filtered ? t('common.empty.noResults') : t('admin.empty.title')}</p>
          <p className="text-sm text-base-content/60">
            {filtered ? t('admin.empty.filtered') : t('admin.empty.create')}
          </p>
        </div>
        {!filtered && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
            <FiPlus aria-hidden /> {t(`admin.createTitles.${config.titleKey}`)}
          </button>
        )}
      </div>
    );
  }

  const colSpan = config.columns.length + (expandable ? 2 : 1);

  return (
    <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
      <table className="table">
        <thead>
          <tr className="text-base-content/60">
            {expandable && <th className="w-10" aria-label={t('admin.viewCrops')} />}
            {config.columns.map((column) => (
              <th key={column.key} className="font-medium">
                {t(column.labelKey)}
              </th>
            ))}
            <th className="w-24 text-right font-medium">{t('common.fields.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const id = item.id as string;
            const cultivos = Array.isArray(item.cultivos) ? (item.cultivos as Item[]) : [];
            const isExpanded = expandable && expanded.has(id);
            return (
              <Fragment key={id}>
                <tr className="hover:bg-base-200/50">
                  {expandable && (
                    <td className="px-2">
                      {cultivos.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square"
                          aria-expanded={isExpanded}
                          aria-label={t('admin.viewCrops')}
                          title={t('admin.viewCrops')}
                          onClick={() => toggleExpand(id)}
                        >
                          {isExpanded ? <FiChevronDown aria-hidden /> : <FiChevronRight aria-hidden />}
                        </button>
                      )}
                    </td>
                  )}
                  {config.columns.map((column) => (
                    <td key={column.key}>{renderCell(column, item)}</td>
                  ))}
                  <td>{actions(item)}</td>
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
                              <tr className="text-base-content/60">
                                <th className="font-medium">{t('admin.fields.tipo')}</th>
                                <th className="font-medium">{t('admin.fields.fechaInicioCampania')}</th>
                                <th className="font-medium">{t('admin.fields.superficieCultivada')}</th>
                                <th className="font-medium">{t('admin.fields.produccion')}</th>
                                <th className="font-medium">{t('admin.fields.consumoAgua')}</th>
                                <th className="font-medium">{t('admin.fields.ciclo')}</th>
                                <th className="w-24 text-right font-medium">{t('common.fields.actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cultivos.map((c) => (
                                <tr key={c.id as string}>
                                  <td>{typeof c.tipo === 'string' ? getCropTypeLabel(c.tipo) : <Empty />}</td>
                                  <td>{formatUtcDate(c.fechaInicioCampania, i18n.language) ?? <Empty />}</td>
                                  {(
                                    [
                                      ['superficieCultivada', 'common.units.hectares'],
                                      ['produccion', 'common.units.tonsPerHectare'],
                                      ['consumoAgua', 'common.units.litersPerHectare'],
                                      ['ciclo', 'common.units.days'],
                                    ] as const
                                  ).map(([key, unit]) => {
                                    const value = c[key];
                                    return (
                                    <td key={key} className="tabular-nums">
                                      {typeof value === 'number' ? (
                                        <>
                                          {numberFormat.format(value)}
                                          <span className="text-base-content/60 text-xs"> {t(unit)}</span>
                                        </>
                                      ) : (
                                        <Empty />
                                      )}
                                    </td>
                                    );
                                  })}
                                  <td>{actions({ ...c, parcela: { id, nombre: item.nombre } }, 'cultivos')}</td>
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
