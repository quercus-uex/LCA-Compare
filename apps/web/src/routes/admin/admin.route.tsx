import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../../common/constants.ts';
import { toast } from 'sonner';
import { SmartPagination } from './smart-pagination.component.tsx';
import { IdLookupField, type FkConfig } from './id-lookup-field.component.tsx';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 15;

const ENTITIES = [
  'usuarios',
  'parcelas',
  'cultivos',
  'metodos-impacto',
  'paises',
  'provincias',
  'poblaciones',
] as const;

type Entity = (typeof ENTITIES)[number];

const ENTITY_LABEL_KEYS: Record<Entity, string> = {
  usuarios: 'admin.entities.usuarios',
  parcelas: 'admin.entities.parcelas',
  cultivos: 'admin.entities.cultivos',
  'metodos-impacto': 'admin.entities.metodosImpacto',
  paises: 'admin.entities.paises',
  provincias: 'admin.entities.provincias',
  poblaciones: 'admin.entities.poblaciones',
};

type FieldConfig = {
  name: string;
  labelKey: string;
  type: 'text' | 'email' | 'password' | 'number' | 'datetime-local';
  optional?: boolean;
};

const CONFIG: Record<
  Entity,
  { tableFields: string[]; formFields: FieldConfig[] }
> = {
  usuarios: {
    tableFields: ['nombre', 'apellidos', 'email', 'rol'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'apellidos', labelKey: 'admin.fields.apellidos', type: 'text' },
      { name: 'email', labelKey: 'admin.fields.email', type: 'email' },
      {
        name: 'passwordHash',
        labelKey: 'admin.fields.passwordHash',
        type: 'password',
        optional: true,
      },
      { name: 'rol', labelKey: 'admin.fields.rol', type: 'text' },
    ],
  },
  parcelas: {
    tableFields: ['nombre', 'sigpac', 'refCat', 'idPropietario'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'sigpac', labelKey: 'admin.fields.sigpac', type: 'text' },
      { name: 'refCat', labelKey: 'admin.fields.refCat', type: 'text' },
      { name: 'ptIdParcela', labelKey: 'admin.fields.ptIdParcela', type: 'text' },
      { name: 'idPropietario', labelKey: 'admin.fields.idPropietario', type: 'text' },
      { name: 'idPoblacion', labelKey: 'admin.fields.idPoblacion', type: 'text' },
    ],
  },
  cultivos: {
    tableFields: [
      'tipo',
      'fechaInicioCampania',
      'superficieCultivada',
      'produccion',
    ],
    formFields: [
      { name: 'tipo', labelKey: 'admin.fields.tipo', type: 'text' },
      {
        name: 'fechaInicioCampania',
        labelKey: 'admin.fields.fechaInicioCampania',
        type: 'datetime-local',
      },
      { name: 'superficieCultivada', labelKey: 'admin.fields.superficieCultivada', type: 'number' },
      { name: 'produccion', labelKey: 'admin.fields.produccion', type: 'number' },
      { name: 'consumoAgua', labelKey: 'admin.fields.consumoAgua', type: 'number' },
      { name: 'ciclo', labelKey: 'admin.fields.ciclo', type: 'number' },
      { name: 'idParcela', labelKey: 'admin.fields.idParcela', type: 'text' },
    ],
  },
  'metodos-impacto': {
    tableFields: ['id', 'nombre'],
    formFields: [
      { name: 'id', labelKey: 'admin.fields.id', type: 'text' },
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
    ],
  },
  paises: {
    tableFields: ['nombre', 'codigo'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'codigo', labelKey: 'admin.fields.codigo', type: 'text' },
    ],
  },
  provincias: {
    tableFields: ['nombre', 'idCatastro', 'idPais'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number' },
      { name: 'idPais', labelKey: 'admin.fields.idPais', type: 'text' },
    ],
  },
  poblaciones: {
    tableFields: ['nombre', 'idCatastro', 'idProvincia'],
    formFields: [
      { name: 'nombre', labelKey: 'admin.fields.nombre', type: 'text' },
      { name: 'idCatastro', labelKey: 'admin.fields.idCatastro', type: 'number' },
      { name: 'idProvincia', labelKey: 'admin.fields.idProvincia', type: 'text' },
    ],
  },
};

const ROLES = ['admin', 'usuario'] as const;

const TABLE_FK_LINKS: Record<string, Entity> = {
  idPropietario: 'usuarios',
  idPoblacion: 'poblaciones',
  idPais: 'paises',
  idProvincia: 'provincias',
};

const FK_REFERENCES: Record<string, FkConfig> = {
  idPropietario: { entity: 'usuarios', displayFields: ['nombre', 'apellidos'], endpoint: 'usuarios' },
  idPoblacion: { entity: 'poblaciones', displayFields: ['nombre'], endpoint: 'poblaciones' },
  idParcela: { entity: 'parcelas', displayFields: ['nombre'], endpoint: 'parcelas' },
  idPais: { entity: 'paises', displayFields: ['nombre'], endpoint: 'paises' },
  idProvincia: { entity: 'provincias', displayFields: ['nombre'], endpoint: 'provincias' },
};

export const AdminRoute = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<Entity>('usuarios');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalEntity, setModalEntity] = useState<Entity | null>(null);
  const [currentItem, setCurrentItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);
  const pendingSearchRef = useRef<string | null>(null);

  const token = `Bearer ${localStorage.getItem('token')}`;
  const getEntity = () => modalEntity ?? activeTab;
  const getEntityLabel = (entity: Entity) => t(ENTITY_LABEL_KEYS[entity]);
  const getFieldLabel = (field: FieldConfig) => t(field.labelKey);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('skip', String(page * PAGE_SIZE));
      params.set('take', String(PAGE_SIZE));

      const res = await fetch(`${API_BASE_URL}/admin/${activeTab}?${params}`, {
        headers: { Authorization: token },
      });
      const json = (await res.json()) as { data?: Record<string, unknown>[]; total?: number };
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      initialLoadDone.current = true;
    } catch {
      toast.error(t('admin.messages.loadError'));
    }
    setLoading(false);
  }, [activeTab, search, page, token, t]);

  useEffect(() => {
    if (!auth.loading && (!auth.usuario || auth.usuario.rol !== 'admin')) {
      void navigate('/parcelas');
      return;
    }
    if (auth.usuario?.rol === 'admin') {
      void fetchData();
    }
  }, [auth.loading, auth.usuario, fetchData, navigate]);

  useEffect(() => {
    if (pendingSearchRef.current !== null) {
      setSearch(pendingSearchRef.current);
      pendingSearchRef.current = null;
    } else {
      setSearch('');
    }
    setPage(0);
    setExpanded(new Set());
    initialLoadDone.current = false;
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setModalEntity(null);
    setCurrentItem(null);
    setForm({});
    setModalOpen(true);
  };

  const openEditModal = (item: Record<string, unknown>, entity?: Entity) => {
    setModalMode('edit');
    setModalEntity(entity ?? null);
    setCurrentItem(item);
    const config = CONFIG[entity ?? activeTab];
    const initial: Record<string, string> = {};
    for (const f of config.formFields) {
      const raw = item[f.name];
      let val = '';
      if (raw !== null && raw !== undefined && typeof raw !== 'object') {
        val = String(raw);
      }
      if (f.type === 'datetime-local' && val) {
        val = new Date(val).toISOString().slice(0, 16);
      }
      initial[f.name] = val;
    }
    setForm(initial);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalEntity(null);
    setCurrentItem(null);
    setForm({});
  };

  const navigateToTab = (entity: Entity, query: string) => {
    pendingSearchRef.current = String(query);
    setActiveTab(entity);
    setPage(0);
  };

  const formatCell = (field: string, raw: unknown): string | null => {
    if (raw === null || raw === undefined || typeof raw === 'object') return null;
    const formField = CONFIG[activeTab].formFields.find((f) => f.name === field);
    if (formField?.type === 'datetime-local' && raw) {
      const d = new Date(raw as string);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return String(raw);
  };

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getSubmitBody = (): Record<string, string | number | null> => {
    const config = CONFIG[getEntity()];
    const body: Record<string, string | number | null> = {};
    for (const f of config.formFields) {
      const val = form[f.name] ?? '';
      if (f.optional === true && !val && modalMode === 'edit') continue;
      if (f.type === 'number') {
        body[f.name] = val === '' ? null : Number(val);
      } else if (f.type === 'datetime-local') {
        body[f.name] = val ? new Date(val).toISOString() : null;
      } else {
        body[f.name] = val;
      }
    }
    return body;
  };

  const handleSubmit = async () => {
    const body = getSubmitBody();
    const entity = getEntity();

    try {
      if (modalMode === 'create') {
        const res = await fetch(`${API_BASE_URL}/admin/${entity}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t('admin.messages.created'));
      } else {
        const id = currentItem?.id as string;
        const res = await fetch(`${API_BASE_URL}/admin/${entity}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t('admin.messages.updated'));
      }
      closeModal();
      void fetchData();
    } catch {
      toast.error(t('admin.messages.saveError'));
    }
  };

  const handleDelete = async (id: string, entity?: Entity) => {
    const e = entity ?? getEntity();
    if (!window.confirm(t('admin.deleteConfirm'))) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/${e}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token },
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.messages.deleted'));
      if (data.length === 1 && page > 0) setPage((p) => p - 1);
      else void fetchData();
    } catch {
      toast.error(t('admin.messages.deleteError'));
    }
  };

  if (auth.loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="skeleton w-56 h-8" />
        <div className="skeleton w-full h-12" />
        <div className="skeleton w-full h-64" />
      </div>
    );
  }

  if (!auth.usuario || auth.usuario.rol !== 'admin') return null;

  const config = CONFIG[activeTab];

  return (
    <div className="w-full">
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body">
          <h1 className="card-title text-xl mb-2">{t('admin.title')}</h1>

          <div role="tablist" className="tabs tabs-lifted tabs-md gap-1">
            {ENTITIES.map((entity) => (
              <a
                key={entity}
                role="tab"
                className={`tab transition-colors duration-200 ${
                  activeTab === entity
                    ? 'tab-active [--tab-border-color:oklch(var(--p))] [--tab-bg:oklch(var(--b2))]'
                    : ''
                }`}
                onClick={() => setActiveTab(entity)}
              >
                {getEntityLabel(entity)}
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold shrink-0">
                {getEntityLabel(activeTab)}
              </h2>
              {initialLoadDone.current && (
                <span className="badge badge-ghost badge-sm">{t('admin.total', { total })}</span>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                className="input input-bordered input-sm flex-1 sm:w-64"
                placeholder={t('admin.searchPlaceholder', { entity: getEntityLabel(activeTab).toLowerCase() })}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
              <button
                className="btn btn-primary btn-sm gap-1"
                onClick={openCreateModal}
              >
                <span className="text-lg leading-none">+</span> {t('admin.new')}
              </button>
            </div>
          </div>

            <div className="overflow-hidden rounded-box border border-base-300">
            {loading && !initialLoadDone.current ? (
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
                    const isExpanded =
                      activeTab === 'parcelas' && expanded.has(id);
                    const cultivos = item.cultivos as
                      | Record<string, unknown>[]
                      | undefined;
                    const colSpan =
                      config.tableFields.length +
                      (activeTab === 'parcelas' ? 1 : 0) +
                      1;

                    return (
                      <>
                        <tr key={id} className="hover:bg-base-200/70 transition-colors duration-150">
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
                                    {cultivos.map((c: Record<string, unknown>) => (
                                      <tr key={c.id as string}>
                                        <td>{c.tipo != null && typeof c.tipo !== 'object' ? String(c.tipo) : '—'}</td>
                                        <td>
                                          {c.fechaInicioCampania
                                              ? new Date(c.fechaInicioCampania as string).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                              : '—'}
                                        </td>
                                        <td>
                                          {c.superficieCultivada != null && typeof c.superficieCultivada !== 'object'
                                            ? String(c.superficieCultivada)
                                            : '—'}
                                        </td>
                                        <td>
                                          {c.produccion != null && typeof c.produccion !== 'object'
                                            ? String(c.produccion)
                                            : '—'}
                                        </td>
                                        <td>
                                          {c.consumoAgua != null && typeof c.consumoAgua !== 'object'
                                            ? String(c.consumoAgua)
                                            : '—'}
                                        </td>
                                        <td>{c.ciclo != null && typeof c.ciclo !== 'object' ? String(c.ciclo) : '—'}</td>
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
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <SmartPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>

      {modalOpen && (() => {
            const modalCfg = CONFIG[getEntity()];
            const modalLabel = getEntityLabel(getEntity());
            return (
        <div className="modal modal-open backdrop:transition-opacity backdrop:duration-200">
          <div className="modal-box max-w-lg transition-transform duration-200">
            <h3 className="font-bold text-lg mb-1">
              {modalMode === 'create'
                ? t('admin.newEntity', { entity: modalLabel.slice(0, -1).toLowerCase() })
                : t('admin.editEntity', { entity: modalLabel.slice(0, -1).toLowerCase() })}
            </h3>
            <p className="text-sm text-base-content/50 mb-4">
              {modalMode === 'create'
                ? t('admin.createHelp')
                : t('admin.editHelp')}
            </p>

            <div className="flex flex-col gap-3">
              {modalCfg.formFields.map((field) => {
                const fkConfig = FK_REFERENCES[field.name];
                const isIdField =
                  field.name === 'id' && getEntity() === 'metodos-impacto';
                const isPassword = field.name === 'passwordHash';
                const isDisabled = isIdField && modalMode === 'edit';

                if (field.name === 'rol') {
                  return (
                    <label key={field.name} className="form-control w-full">
                      <div className="label py-0.5">
                        <span className="label-text">{getFieldLabel(field)}</span>
                      </div>
                      <select
                        className="select select-bordered w-full"
                        value={form[field.name] ?? ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                      >
                        <option value="" disabled>{t('admin.selectRole')}</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (fkConfig) {
                  return (
                    <label key={field.name} className="form-control w-full">
                      <div className="label py-0.5">
                        <span className="label-text">{getFieldLabel(field)}</span>
                      </div>
                      <IdLookupField
                        name={field.name}
                        value={form[field.name] ?? ''}
                        onChange={handleChange}
                        fkConfig={fkConfig}
                        disabled={isDisabled}
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.name} className="form-control w-full">
                    <div className="label py-0.5">
                      <span className="label-text">
                        {getFieldLabel(field)}
                        {field.optional && modalMode === 'edit'
                          ? ` (${t('admin.optional')})`
                          : ''}
                      </span>
                    </div>
                    <input
                      type={
                        isPassword
                          ? 'password'
                          : field.type === 'datetime-local'
                            ? 'datetime-local'
                            : field.type
                      }
                      className="input input-bordered w-full"
                      placeholder={getFieldLabel(field)}
                      value={form[field.name] ?? ''}
                      disabled={isDisabled}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="modal-action mt-6 pt-3 border-t border-base-300">
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>
                {t('common.actions.cancel')}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleSubmit(); }}>
                {modalMode === 'create' ? t('common.actions.create') : t('common.actions.save')}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModal}>
            <button className="opacity-0">close</button>
          </div>
        </div>
          );
        })()}
    </div>
  );
};
