import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../../common/constants.ts';
import { toast } from 'sonner';

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

const LABELS: Record<Entity, string> = {
  usuarios: 'Usuarios',
  parcelas: 'Parcelas',
  cultivos: 'Cultivos',
  'metodos-impacto': 'Met. Impacto',
  paises: 'Países',
  provincias: 'Provincias',
  poblaciones: 'Poblaciones',
};

type FieldConfig = {
  name: string;
  label: string;
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
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'apellidos', label: 'Apellidos', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      {
        name: 'passwordHash',
        label: 'Contraseña',
        type: 'password',
        optional: true,
      },
      { name: 'rol', label: 'Rol', type: 'text' },
    ],
  },
  parcelas: {
    tableFields: ['nombre', 'sigpac', 'refCat', 'idPropietario'],
    formFields: [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'sigpac', label: 'SIGPAC', type: 'text' },
      { name: 'refCat', label: 'Ref. Catastral', type: 'text' },
      { name: 'ptIdParcela', label: 'PT ID', type: 'text' },
      { name: 'idPropietario', label: 'ID Propietario', type: 'text' },
      { name: 'idPoblacion', label: 'ID Población', type: 'text' },
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
      { name: 'tipo', label: 'Tipo', type: 'text' },
      {
        name: 'fechaInicioCampania',
        label: 'Fecha Inicio Campaña',
        type: 'datetime-local',
      },
      { name: 'superficieCultivada', label: 'Superficie (ha)', type: 'number' },
      { name: 'produccion', label: 'Producción (kg)', type: 'number' },
      { name: 'consumoAgua', label: 'Consumo Agua (m³)', type: 'number' },
      { name: 'ciclo', label: 'Ciclo', type: 'number' },
      { name: 'idParcela', label: 'ID Parcela', type: 'text' },
    ],
  },
  'metodos-impacto': {
    tableFields: ['id', 'nombre'],
    formFields: [
      { name: 'id', label: 'ID', type: 'text' },
      { name: 'nombre', label: 'Nombre', type: 'text' },
    ],
  },
  paises: {
    tableFields: ['nombre', 'codigo'],
    formFields: [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'codigo', label: 'Código', type: 'text' },
    ],
  },
  provincias: {
    tableFields: ['nombre', 'idCatastro', 'idPais'],
    formFields: [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'idCatastro', label: 'ID Catastro', type: 'number' },
      { name: 'idPais', label: 'ID País', type: 'text' },
    ],
  },
  poblaciones: {
    tableFields: ['nombre', 'idCatastro', 'idProvincia'],
    formFields: [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'idCatastro', label: 'ID Catastro', type: 'number' },
      { name: 'idProvincia', label: 'ID Provincia', type: 'text' },
    ],
  },
};

export const AdminRoute = () => {
  const auth = useAuth();
  const navigate = useNavigate();

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

  const token = `Bearer ${localStorage.getItem('token')}`;
  const getEntity = () => modalEntity ?? activeTab;

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
      toast.error('Error al cargar datos');
    }
    setLoading(false);
  }, [activeTab, search, page, token]);

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
    setSearch('');
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
        toast.success('Creado correctamente');
      } else {
        const id = currentItem?.id as string;
        const res = await fetch(`${API_BASE_URL}/admin/${entity}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success('Actualizado correctamente');
      }
      closeModal();
      void fetchData();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: string, entity?: Entity) => {
    const e = entity ?? getEntity();
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/${e}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token },
      });
      if (!res.ok) throw new Error();
      toast.success('Eliminado correctamente');
      if (data.length === 1 && page > 0) setPage((p) => p - 1);
      else void fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (auth.loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="skeleton w-full h-12" />
        <div className="skeleton w-full h-64" />
      </div>
    );
  }

  if (!auth.usuario || auth.usuario.rol !== 'admin') return null;

  const config = CONFIG[activeTab];

  return (
    <div className="w-full">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title text-xl mb-2">Panel de Administración</h1>

          <div role="tablist" className="tabs tabs-bordered">
            {ENTITIES.map((entity) => (
              <a
                key={entity}
                role="tab"
                className={`tab ${activeTab === entity ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(entity)}
              >
                {LABELS[entity]}
              </a>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 gap-4">
            <h2 className="text-lg font-semibold shrink-0">
              {LABELS[activeTab]}
            </h2>
            <div className="flex gap-2 flex-1 justify-end">
              <input
                type="text"
                className="input input-bordered input-sm w-64"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={openCreateModal}
              >
                + Nuevo
              </button>
            </div>
          </div>

            <div className="overflow-hidden">
            {loading && !initialLoadDone.current ? (
              <div className="skeleton w-full h-48" />
            ) : data.length === 0 ? (
              <p className="text-center text-base-content/50 py-8">
                {search ? 'Sin resultados' : 'Sin registros'}
              </p>
            ) : (
              <table className={`table table-zebra table-fixed w-full ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <thead>
                  <tr>
                    {activeTab === 'parcelas' && <th className="w-8" />}
                    {config.tableFields.map((field) => (
                      <th key={field} className="truncate">{field}</th>
                    ))}
                    <th className="w-36">Acciones</th>
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
                        <tr key={id} className="hover">
                          {activeTab === 'parcelas' && (
                            <td className="w-8 px-0">
                              {cultivos && cultivos.length > 0 && (
                                <button
                                  className="btn btn-ghost btn-xs btn-circle"
                                  onClick={() => toggleExpand(id)}
                                  title="Ver cultivos"
                                >
                                  {isExpanded ? '▾' : '▸'}
                                </button>
                              )}
                            </td>
                          )}
                        {config.tableFields.map((field) => (
                          <td key={field} className="truncate">
                            {item[field] != null && typeof item[field] !== 'object'
                                ? String(item[field])
                                : '—'}
                            </td>
                          ))}
                          <td>
                            <div className="flex gap-1">
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => openEditModal(item)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => { void handleDelete(id); }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && cultivos && cultivos.length > 0 && (
                          <tr key={`exp-${id}`}>
                            <td colSpan={colSpan} className="p-0">
                              <div className="bg-base-200 rounded-box p-3 m-1">
                                <h4 className="text-sm font-semibold mb-2">
                                  Cultivos de {(item.nombre as string) ?? id}
                                </h4>
                                <table className="table table-xs table-fixed w-full">
                                  <thead>
                                    <tr>
                                      <th>Tipo</th>
                                      <th>Inicio Campaña</th>
                                      <th>Superficie (ha)</th>
                                      <th>Producción (kg)</th>
                                      <th>Consumo Agua (m³)</th>
                                      <th>Ciclo</th>
                                      <th className="w-36">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cultivos.map((c: Record<string, unknown>) => (
                                      <tr key={c.id as string}>
                                        <td>{c.tipo != null && typeof c.tipo !== 'object' ? String(c.tipo) : '—'}</td>
                                        <td>
                                          {c.fechaInicioCampania
                                            ? new Date(c.fechaInicioCampania as string).toLocaleDateString()
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
                                          <div className="flex gap-1">
                                            <button
                                              className="btn btn-ghost btn-xs"
                                              onClick={() => openEditModal(c, 'cultivos')}
                                            >
                                              Editar
                                            </button>
                                            <button
                                              className="btn btn-ghost btn-xs text-error"
                                              onClick={() => { void handleDelete(c.id as string, 'cultivos'); }}
                                            >
                                              Eliminar
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

          {/* Paginación */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-base-content/60">
                {total} resultados · Página {page + 1} de {totalPages}
              </p>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`join-item btn btn-sm ${i === page ? 'btn-active' : ''}`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="join-item btn btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (() => {
            const modalCfg = CONFIG[getEntity()];
            const modalLabel = LABELS[getEntity()];
            return (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {modalMode === 'create'
                ? `Nuevo ${modalLabel.slice(0, -1)}`
                : `Editar ${modalLabel.slice(0, -1)}`}
            </h3>

            <div className="flex flex-col gap-3">
              {modalCfg.formFields.map((field) => {
                const isIdField =
                  field.name === 'id' && getEntity() === 'metodos-impacto';
                const isPassword = field.name === 'passwordHash';
                const isDisabled = isIdField && modalMode === 'edit';

                return (
                  <label key={field.name} className="form-control w-full">
                    <div className="label py-0.5">
                      <span className="label-text">
                        {field.label}
                        {field.optional && modalMode === 'edit'
                          ? ' (opcional)'
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
                      placeholder={field.label}
                      value={form[field.name] ?? ''}
                      disabled={isDisabled}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => { void handleSubmit(); }}>
                {modalMode === 'create' ? 'Crear' : 'Guardar'}
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
