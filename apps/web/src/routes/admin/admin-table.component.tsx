import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, safeString } from '../../common/utils.ts';
import { CONFIG, TABLE_FK_LINKS, type Entity } from './admin.config.ts';

type Item = Record<string, unknown>;

type Props = {
  activeTab: Entity;
  data: Item[];
  loading: boolean;
  initialLoadDone: boolean;
  search: string;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  formatCell: (field: string, raw: unknown) => string | null;
  navigateToTab: (entity: Entity, query: string) => void;
  openEditModal: (item: Item, entity?: Entity) => void;
  handleDelete: (id: string, entity?: Entity) => void | Promise<void>;
  getEntityLabel: (entity: Entity) => string;
};

export const AdminTable = ({
  activeTab,
  data,
  loading,
  initialLoadDone,
  search,
  expanded,
  toggleExpand,
  formatCell,
  navigateToTab,
  openEditModal,
  handleDelete,
  getEntityLabel,
}: Props) => {
  const { t } = useTranslation();
  const config = CONFIG[activeTab];

  return (
    <div className="overflow-hidden rounded-box border border-base-300">
      {loading && !initialLoadDone ? (
        <div className="p-6 flex flex-col gap-3">
          <div className="skeleton w-full h-8" />
          <div className="skeleton w-full h-8" />
          <div className="skeleton w-full h-8" />
          <div className="skeleton w-3/4 h-8" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/40 text-lg">
            {search ? t('common.empty.noResults') : t('common.empty.noData')}
          </p>
          <p className="text-base-content/30 text-sm mt-1">
            {search
              ? t('admin.emptySearch', { entity: getEntityLabel(activeTab).toLowerCase() })
              : t('admin.emptyCreate')}
          </p>
        </div>
      ) : (
        <table className={`table table-zebra table-fixed w-full ${loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
          <thead>
            <tr className="bg-base-200/80 border-b border-base-300">
              {activeTab === 'parcelas' && <th className="w-8" />}
              {config.tableFields.map((field) => (
                <th key={field} className="truncate text-xs font-semibold uppercase tracking-wide text-base-content/60">{field}</th>
              ))}
              <th className="w-36 text-xs font-semibold uppercase tracking-wide text-base-content/60">{t('common.fields.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const id = item.id as string;
              const isExpanded = activeTab === 'parcelas' && expanded.has(id);
              const cultivos = item.cultivos as Item[] | undefined;
              const colSpan = config.tableFields.length + (activeTab === 'parcelas' ? 1 : 0) + 1;

              return (
                <Fragment key={id}>
                  <tr className="hover:bg-base-200/70 transition-colors duration-150">
                    {activeTab === 'parcelas' && (
                      <td className="w-8 px-0">
                        {cultivos && cultivos.length > 0 && (
                          <button
                            className="btn btn-ghost btn-xs btn-circle"
                            onClick={() => toggleExpand(id)}
                            title={t('admin.viewCrops')}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                        )}
                      </td>
                    )}
                    {config.tableFields.map((field) => {
                      const cellValue = formatCell(field, item[field]);
                      const fkTarget = TABLE_FK_LINKS[field];
                      return (
                        <td key={field} className="truncate">
                          {cellValue === null ? (
                            '—'
                          ) : fkTarget ? (
                            <button
                              className="link link-hover text-primary text-xs"
                              title={t('admin.goTo', { entity: getEntityLabel(fkTarget) })}
                              onClick={() => navigateToTab(fkTarget, String(item[field]))}
                            >
                              {cellValue}
                            </button>
                          ) : (
                            cellValue
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => openEditModal(item)}
                        >
                          {t('common.actions.edit')}
                        </button>
                        <button
                          className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                          onClick={() => { void handleDelete(id); }}
                        >
                          {t('common.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && cultivos && cultivos.length > 0 && (
                    <tr key={`exp-${id}`}>
                      <td colSpan={colSpan} className="p-0">
                        <div className="bg-base-200 rounded-box p-3 m-1">
                          <h4 className="text-sm font-semibold mb-2">
                            {t('admin.cropsOf', { name: (item.nombre as string) ?? id })}
                          </h4>
                          <table className="table table-xs table-fixed w-full">
                            <thead>
                              <tr>
                                <th>{t('admin.fields.tipo')}</th>
                                <th>{t('admin.fields.inicioCampania')}</th>
                                <th>{t('admin.fields.superficieCultivada')}</th>
                                <th>{t('admin.fields.produccion')}</th>
                                <th>{t('admin.fields.consumoAgua')}</th>
                                <th>{t('admin.fields.ciclo')}</th>
                                <th className="w-36">{t('common.fields.actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cultivos.map((c: Item) => (
                                <tr key={c.id as string}>
                                  <td>{safeString(c.tipo) ?? '—'}</td>
                                  <td>
                                    {c.fechaInicioCampania
                                      ? formatDate(c.fechaInicioCampania as string) ?? '—'
                                      : '—'}
                                  </td>
                                  <td>{safeString(c.superficieCultivada) ?? '—'}</td>
                                  <td>{safeString(c.produccion) ?? '—'}</td>
                                  <td>{safeString(c.consumoAgua) ?? '—'}</td>
                                  <td>{safeString(c.ciclo) ?? '—'}</td>
                                  <td>
                                    <div className="flex gap-1.5">
                                      <button
                                        className="btn btn-xs btn-outline"
                                        onClick={() => openEditModal(c, 'cultivos')}
                                      >
                                        {t('common.actions.edit')}
                                      </button>
                                      <button
                                        className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                                        onClick={() => { void handleDelete(c.id as string, 'cultivos'); }}
                                      >
                                        {t('common.actions.delete')}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};