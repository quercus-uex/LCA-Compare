import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { useNavigate } from 'react-router';
import { ADMIN_PAGE_SIZE } from '../../common/constants.ts';
import { formatDate } from '../../common/utils.ts';
import { SmartPagination } from './smart-pagination.component.tsx';
import { useTranslation } from 'react-i18next';
import {
  CONFIG,
  ENTITIES,
  ENTITY_LABEL_KEYS,
  type Entity,
  type FieldConfig,
} from './admin.config.ts';
import { useAdminCrud } from './use-admin-crud.hook.ts';
import { AdminTable } from './admin-table.component.tsx';
import { AdminModal } from './admin-modal.component.tsx';

export const AdminRoute = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<Entity>('usuarios');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pendingSearchRef = useRef<string | null>(null);

  const crud = useAdminCrud(activeTab, search, page, setPage);
  const {
    data, total, loading, initialLoadDoneRef, fetchData,
    modalOpen, modalMode, form,
    openCreateModal, openEditModal, closeModal, handleChange, handleSubmit, handleDelete,
    getEntity,
  } = crud;

  const getEntityLabel = (entity: Entity) => t(ENTITY_LABEL_KEYS[entity]);
  const getFieldLabel = (field: FieldConfig) => t(field.labelKey);

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
    initialLoadDoneRef.current = false;
  }, [activeTab, initialLoadDoneRef]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const navigateToTab = (entity: Entity, query: string) => {
    pendingSearchRef.current = String(query);
    setActiveTab(entity);
    setPage(0);
  };

  const formatCell = (field: string, raw: unknown): string | null => {
    if (raw === null || raw === undefined || typeof raw === 'object') return null;
    const formField = CONFIG[activeTab].formFields.find((f) => f.name === field);
    if (formField?.type === 'checkbox') {
      return raw === true ? t('common.yes') : t('common.no');
    }
    if (formField?.type === 'datetime-local' && raw) {
      return formatDate(raw as string) ?? String(raw);
    }
    return String(raw);
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
              {initialLoadDoneRef.current && (
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

            <AdminTable
              activeTab={activeTab}
              data={data}
              loading={loading}
              initialLoadDone={initialLoadDoneRef.current}
              search={search}
              expanded={expanded}
              toggleExpand={toggleExpand}
              formatCell={formatCell}
              navigateToTab={navigateToTab}
              openEditModal={openEditModal}
              handleDelete={handleDelete}
              getEntityLabel={getEntityLabel}
            />

          <SmartPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>

      <AdminModal
        modalOpen={modalOpen}
        modalMode={modalMode}
        form={form}
        getEntity={getEntity}
        getEntityLabel={getEntityLabel}
        getFieldLabel={getFieldLabel}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
      />
    </div>
  );
};
