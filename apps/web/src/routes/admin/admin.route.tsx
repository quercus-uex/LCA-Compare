import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiFilter, FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ADMIN_PAGE_SIZE } from '../../common/constants.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useDebouncedValue } from '../../hooks/use-debounced-value.ts';
import { fetchPage, fetchSummary, type FormMode, type Summary } from './admin-api.ts';
import { AdminFormModal } from './admin-form-modal.component.tsx';
import { AdminTable } from './admin-table.component.tsx';
import { CONFIG, ENTITIES, ENTITY_GROUPS, isEntity, type Entity, type Item } from './admin.config.ts';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.component.tsx';
import { SmartPagination } from './smart-pagination.component.tsx';

type FormTarget = { entity: Entity; mode: FormMode; item: Item | null };
type DeleteTarget = { entity: Entity; item: Item };

export const AdminRoute = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();

  // La vista vive en la URL: recargar o compartir el enlace conserva la pestaña y los filtros
  const tabParam = params.get('tab');
  const entity: Entity = isEntity(tabParam) ? tabParam : 'usuarios';
  const query = params.get('q') ?? '';
  const page = Math.max(0, Number(params.get('page') ?? '1') - 1 || 0);
  const idFilter = params.get('id');
  const idLabel = params.get('idLabel');
  const sinPoblacion = entity === 'parcelas' && params.get('sinPoblacion') === '1';

  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [data, setData] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const isAdmin = auth.usuario?.rol === 'admin';
  const config = CONFIG[entity];
  const numberFormat = new Intl.NumberFormat(i18n.language);

  useEffect(() => {
    if (!auth.loading && !isAdmin) void navigate('/parcelas');
  }, [auth.loading, isAdmin, navigate]);

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Aplica la búsqueda escrita (con retardo) y vuelve a la primera página. Solo
  // reacciona a cambios del texto: al cambiar de pestaña el valor con retardo aún
  // es el anterior y no debe volver a aplicarse
  const lastDebouncedRef = useRef(debouncedSearch);
  const appliedQueryRef = useRef(query);
  useEffect(() => {
    if (lastDebouncedRef.current === debouncedSearch) return;
    lastDebouncedRef.current = debouncedSearch;
    const next = debouncedSearch.trim();
    if (next !== query) {
      appliedQueryRef.current = next;
      updateParams({ q: next, page: null, id: null, idLabel: null });
    }
  }, [debouncedSearch, query, updateParams]);

  // Atrás/Adelante cambian la búsqueda desde fuera: la refleja en el cuadro
  useEffect(() => {
    if (query === appliedQueryRef.current) return;
    appliedQueryRef.current = query;
    setSearchInput(query);
  }, [query]);

  const listKey = `${entity}|${idFilter ?? query}|${page}|${sinPoblacion}`;

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    setLoading(true);
    fetchPage(
      entity,
      { search: idFilter ?? query, skip: page * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, sinPoblacion },
      controller.signal,
    )
      .then((res) => {
        // Si se borró el último registro de una página, retrocede
        if (res.data.length === 0 && page > 0 && res.total > 0) {
          updateParams({ page: String(Math.ceil(res.total / ADMIN_PAGE_SIZE)) });
          return;
        }
        setData(res.data);
        setTotal(res.total);
        setLoadedKey(listKey);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        toast.error(t('admin.messages.loadError'));
        setLoading(false);
      });
    return () => controller.abort();
  }, [isAdmin, entity, query, idFilter, page, sinPoblacion, reloadKey, listKey, updateParams, t]);

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    fetchSummary(controller.signal)
      .then(setSummary)
      .catch(() => undefined);
    return () => controller.abort();
  }, [isAdmin, reloadKey]);

  const selectEntity = (next: Entity) => {
    setSearchInput('');
    setExpanded(new Set());
    setParams({ tab: next }, { replace: false });
  };

  const navigateToRelated = (target: Entity, id: string, label: string) => {
    setSearchInput('');
    setExpanded(new Set());
    setParams({ tab: target, id, idLabel: label });
  };

  const refresh = () => setReloadKey((k) => k + 1);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (auth.loading || !isAdmin) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="skeleton w-64 h-9" />
        <div className="skeleton w-full h-96" />
      </div>
    );
  }

  const filtered = Boolean(query || idFilter || sinPoblacion);
  const Icon = config.icon;
  const sinPoblacionCount = summary.parcelasSinPoblacion ?? 0;

  return (
    <div className="w-full flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <p className="text-base-content/70">{t('admin.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Navegación: menú lateral en escritorio, selector en móvil */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-5">
          <label className="lg:hidden select w-full">
            <span className="label">{t('admin.section')}</span>
            <select value={entity} onChange={(e) => selectEntity(e.target.value as Entity)}>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {t(CONFIG[e].labelKey)}
                  {summary[e] !== undefined ? ` (${numberFormat.format(summary[e])})` : ''}
                </option>
              ))}
            </select>
          </label>

          <nav className="hidden lg:block card bg-base-100 shadow-sm" aria-label={t('admin.title')}>
            <div className="card-body p-3 gap-3">
              {ENTITY_GROUPS.map((group) => (
                <ul key={group.labelKey} className="menu w-full p-0 gap-0.5">
                  <li className="menu-title px-3 pt-1 pb-1 text-xs uppercase tracking-wide">{t(group.labelKey)}</li>
                  {group.entities.map((e) => {
                    const EntityIcon = CONFIG[e].icon;
                    const active = e === entity;
                    return (
                      <li key={e}>
                        <button
                          type="button"
                          className={`flex items-center gap-3 ${active ? 'menu-active' : ''}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => selectEntity(e)}
                        >
                          <EntityIcon aria-hidden className="size-4" />
                          <span className="flex-1">{t(CONFIG[e].labelKey)}</span>
                          {summary[e] !== undefined && (
                            <span className={`text-xs tabular-nums ${active ? '' : 'text-base-content/50'}`}>
                              {numberFormat.format(summary[e])}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          </nav>

          {sinPoblacionCount > 0 && (
            <button
              type="button"
              className="hidden lg:flex mt-3 w-full text-left card bg-warning text-warning-content p-3 flex-row gap-3 items-start hover:brightness-95"
              onClick={() => setParams({ tab: 'parcelas', sinPoblacion: '1' })}
            >
              <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0" />
              <span className="text-sm">{t('admin.alerts.sinPoblacion', { count: sinPoblacionCount })}</span>
            </button>
          )}
        </aside>

        <section className="card bg-base-100 shadow-sm w-full min-w-0">
          <div className="card-body gap-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-box bg-primary/15 text-secondary flex items-center justify-center shrink-0">
                  <Icon aria-hidden className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {t(config.labelKey)}
                    {loadedKey !== null && (
                      <span className="badge badge-sm badge-ghost tabular-nums">{numberFormat.format(total)}</span>
                    )}
                  </h2>
                  <p className="text-sm text-base-content/60">{t(config.descriptionKey)}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary shrink-0"
                onClick={() => setFormTarget({ entity, mode: 'create', item: null })}
              >
                <FiPlus aria-hidden /> {t(`admin.createTitles.${config.titleKey}`)}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <label className="input w-full md:max-w-md">
                <FiSearch aria-hidden className="opacity-50" />
                <input
                  type="search"
                  className="grow"
                  placeholder={t(`admin.searchPlaceholders.${entity}`)}
                  aria-label={t('common.actions.search')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setSearchInput('')}
                    aria-label={t('admin.clearSearch')}
                  >
                    <FiX aria-hidden />
                  </button>
                )}
              </label>

              {entity === 'parcelas' && (
                <label className="label cursor-pointer gap-2 text-sm text-base-content px-2">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-warning"
                    checked={sinPoblacion}
                    onChange={(e) => updateParams({ sinPoblacion: e.target.checked ? '1' : null, page: null })}
                  />
                  {t('admin.parcelas.onlyNoPoblacion')}
                  {sinPoblacionCount > 0 && <span className="badge badge-sm badge-warning">{sinPoblacionCount}</span>}
                </label>
              )}

              {idFilter && (
                <span className="badge badge-lg badge-secondary gap-2 max-w-full">
                  <FiFilter aria-hidden className="shrink-0" />
                  <span className="truncate">{idLabel ?? idFilter}</span>
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => updateParams({ id: null, idLabel: null, page: null })}
                    aria-label={t('admin.removeFilter')}
                    title={t('admin.removeFilter')}
                  >
                    <FiX aria-hidden />
                  </button>
                </span>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square ml-auto tooltip tooltip-left"
                data-tip={t('admin.refresh')}
                aria-label={t('admin.refresh')}
                onClick={refresh}
              >
                <FiRefreshCw aria-hidden className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="rounded-box border border-base-200 overflow-hidden">
              <AdminTable
                entity={entity}
                data={loadedKey?.startsWith(`${entity}|`) ? data : []}
                loading={loading}
                loaded={loadedKey?.startsWith(`${entity}|`) ?? false}
                filtered={filtered}
                expanded={expanded}
                currentUserId={auth.usuario?.id}
                toggleExpand={toggleExpand}
                onEdit={(item, target) => setFormTarget({ entity: target ?? entity, mode: 'edit', item })}
                onDelete={(item, target) => setDeleteTarget({ entity: target ?? entity, item })}
                onCreate={() => setFormTarget({ entity, mode: 'create', item: null })}
                onNavigate={navigateToRelated}
              />
            </div>

            {loadedKey !== null && total > 0 && (
              <SmartPagination
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={total}
                onPageChange={(p) => updateParams({ page: p === 0 ? null : String(p + 1) })}
              />
            )}
          </div>
        </section>
      </div>

      {formTarget && (
        <AdminFormModal
          key={`${formTarget.entity}-${typeof formTarget.item?.id === 'string' ? formTarget.item.id : 'new'}`}
          entity={formTarget.entity}
          mode={formTarget.mode}
          item={formTarget.item}
          currentUserId={auth.usuario?.id}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            toast.success(t(formTarget.mode === 'create' ? 'admin.messages.created' : 'admin.messages.updated'));
            setFormTarget(null);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          entity={deleteTarget.entity}
          item={deleteTarget.item}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            toast.success(t('admin.messages.deleted'));
            setDeleteTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};
