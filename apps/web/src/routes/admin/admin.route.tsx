import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiFilter, FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ADMIN_PAGE_SIZE } from '../../common/constants.ts';
import { formatQuantity } from '../../common/format.ts';
import {
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MenuTitle,
  Page,
  PageHeader,
  PageHeaderSkeleton,
  Select,
  Skeleton,
  Toggle,
} from '../../components/ui/index.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useDebouncedValue } from '../../hooks/use-debounced-value.ts';
import { fetchPage, fetchSummary, type FormMode, type Summary } from './admin-api.ts';
import { AdminFormModal } from './admin-form-modal.component.tsx';
import { AdminTable } from './admin-table.component.tsx';
import { canDo, CONFIG, ENTITIES, ENTITY_GROUPS, isEntity, type Entity, type Item } from './admin.config.ts';
import { ConfirmDeleteDialog } from './confirm-delete-dialog.component.tsx';
import { SmartPagination } from './smart-pagination.component.tsx';

type FormTarget = { entity: Entity; mode: FormMode; item: Item | null };
type DeleteTarget = { entity: Entity; item: Item };

// Icono de recargar girando mientras se cargan los datos
const RefreshSpinning: IconType = (props) => <FiRefreshCw {...props} className={`${props.className ?? ''} animate-spin`} />;

export const AdminRoute = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      <Page busy>
        <PageHeaderSkeleton />
        <Skeleton className="w-full h-96" />
      </Page>
    );
  }

  const filtered = Boolean(query || idFilter || sinPoblacion);
  const Icon = config.icon;
  const sinPoblacionCount = summary.parcelasSinPoblacion ?? 0;

  return (
    <Page>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Navegación: menú lateral en escritorio, selector en móvil */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-5">
          <Field label={t('admin.section')} className="lg:hidden">
            <Select value={entity} onChange={(e) => selectEntity(e.target.value as Entity)}>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {t(CONFIG[e].labelKey)}
                  {summary[e] !== undefined ? ` (${formatQuantity(summary[e])})` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <nav className="hidden lg:block" aria-label={t('admin.title')}>
            <Card density="compact">
              {ENTITY_GROUPS.map((group) => (
                <Menu key={group.labelKey}>
                  <MenuTitle>
                    <span className="eyebrow">{t(group.labelKey)}</span>
                  </MenuTitle>
                  {group.entities.map((e) => {
                    const EntityIcon = CONFIG[e].icon;
                    const active = e === entity;
                    return (
                      <MenuItem key={e} active={active} onClick={() => selectEntity(e)}>
                        <EntityIcon aria-hidden className="size-4" />
                        <span className="flex-1">{t(CONFIG[e].labelKey)}</span>
                        {summary[e] !== undefined && (
                          <span className={`text-xs tabular-nums ${active ? '' : 'text-muted'}`}>
                            {formatQuantity(summary[e])}
                          </span>
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              ))}
            </Card>
          </nav>

          {sinPoblacionCount > 0 && (
            <button
              type="button"
              className="hidden lg:flex mt-3 w-full items-start gap-3 rounded-box bg-warning p-3 text-left text-warning-content hover:brightness-95"
              onClick={() => setParams({ tab: 'parcelas', sinPoblacion: '1' })}
            >
              <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0" />
              <span className="text-sm">{t('admin.alerts.sinPoblacion', { count: sinPoblacionCount })}</span>
            </button>
          )}
        </aside>

        <Card as="section" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-box bg-primary/15 text-secondary flex items-center justify-center shrink-0">
                <Icon aria-hidden className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {t(config.labelKey)}
                  {loadedKey !== null && (
                    <Badge size="sm" className="tabular-nums">
                      {formatQuantity(total)}
                    </Badge>
                  )}
                </h2>
                <p className="text-sm text-muted">{t(config.descriptionKey)}</p>
              </div>
            </div>
            {canDo(entity, 'create') && (
              <Button
                variant="primary"
                icon={FiPlus}
                className="shrink-0"
                onClick={() => setFormTarget({ entity, mode: 'create', item: null })}
              >
                {t(`admin.createTitles.${config.titleKey}`)}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:max-w-md">
              <Input
                icon={FiSearch}
                type="search"
                className="pr-10"
                placeholder={t(`admin.searchPlaceholders.${entity}`)}
                aria-label={t('common.actions.search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <IconButton
                  icon={FiX}
                  size="xs"
                  label={t('admin.clearSearch')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchInput('')}
                />
              )}
            </div>

            {entity === 'parcelas' && (
              <Toggle
                size="sm"
                className="px-2"
                label={
                  <>
                    {t('admin.parcelas.onlyNoPoblacion')}
                    {sinPoblacionCount > 0 && (
                      <Badge tone="warning" size="sm" className="ml-2">
                        {sinPoblacionCount}
                      </Badge>
                    )}
                  </>
                }
                checked={sinPoblacion}
                onChange={(e) => updateParams({ sinPoblacion: e.target.checked ? '1' : null, page: null })}
              />
            )}

            {idFilter && (
              <Badge tone="secondary" icon={FiFilter} className="max-w-full">
                <span className="truncate">{idLabel ?? idFilter}</span>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer"
                  onClick={() => updateParams({ id: null, idLabel: null, page: null })}
                  aria-label={t('admin.removeFilter')}
                  title={t('admin.removeFilter')}
                >
                  <FiX aria-hidden />
                </button>
              </Badge>
            )}

            <IconButton
              icon={loading ? RefreshSpinning : FiRefreshCw}
              label={t('admin.refresh')}
              className="ml-auto"
              onClick={refresh}
            />
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
        </Card>
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
    </Page>
  );
};
