import { useCallback, useRef, useState } from 'react';
import { ADMIN_PAGE_SIZE } from '../../common/constants.ts';
import { apiRequest } from '../../common/api.ts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CONFIG, type Entity } from './admin.config.ts';

type FormState = Record<string, string | boolean>;
type Item = Record<string, unknown>;
type SubmitBody = Record<string, string | number | boolean | null>;

export type UseAdminCrud = {
  data: Item[];
  total: number;
  loading: boolean;
  initialLoadDoneRef: React.MutableRefObject<boolean>;
  fetchData: () => Promise<void>;
  modalOpen: boolean;
  modalMode: 'create' | 'edit';
  modalEntity: Entity | null;
  currentItem: Item | null;
  form: FormState;
  openCreateModal: () => void;
  openEditModal: (item: Item, entity?: Entity) => void;
  closeModal: () => void;
  handleChange: (name: string, value: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  handleDelete: (id: string, entity?: Entity) => Promise<void>;
  getEntity: () => Entity;
};

export const useAdminCrud = (
  activeTab: Entity,
  search: string,
  page: number,
  setPage: (updater: (p: number) => number) => void,
): UseAdminCrud => {
  const { t } = useTranslation();
  const [data, setData] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalEntity, setModalEntity] = useState<Entity | null>(null);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [form, setForm] = useState<FormState>({});
  const initialLoadDoneRef = useRef(false);

  const getEntity = () => modalEntity ?? activeTab;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('skip', String(page * ADMIN_PAGE_SIZE));
      params.set('take', String(ADMIN_PAGE_SIZE));

      const res = await apiRequest(`/admin/${activeTab}?${params}`);
      const json = (await res.json()) as { data?: Item[]; total?: number };
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      initialLoadDoneRef.current = true;
    } catch {
      toast.error(t('admin.messages.loadError'));
    }
    setLoading(false);
  }, [activeTab, search, page, t]);

  const openCreateModal = () => {
    setModalMode('create');
    setModalEntity(null);
    setCurrentItem(null);
    setForm({});
    setModalOpen(true);
  };

  const openEditModal = (item: Item, entity?: Entity) => {
    setModalMode('edit');
    setModalEntity(entity ?? null);
    setCurrentItem(item);
    const config = CONFIG[entity ?? activeTab];
    const initial: FormState = {};
    for (const f of config.formFields) {
      const raw = item[f.name];
      if (f.type === 'checkbox') {
        initial[f.name] = raw === true;
        continue;
      }
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

  const handleChange = (name: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getSubmitBody = (): SubmitBody => {
    const config = CONFIG[getEntity()];
    const body: SubmitBody = {};
    for (const f of config.formFields) {
      const val = form[f.name] ?? '';
      if (f.optional === true && !val && modalMode === 'edit') continue;
      if (f.type === 'checkbox') {
        body[f.name] = val === true || val === 'true';
      } else if (f.type === 'number') {
        body[f.name] = val === '' ? null : Number(val);
      } else if (f.type === 'datetime-local') {
        body[f.name] = val ? new Date(val as string).toISOString() : null;
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
        const res = await apiRequest(`/admin/${entity}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success(t('admin.messages.created'));
      } else {
        const id = currentItem?.id as string;
        const res = await apiRequest(`/admin/${entity}/${id}`, {
          method: 'PUT',
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
      const res = await apiRequest(`/admin/${e}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.messages.deleted'));
      if (data.length === 1 && page > 0) setPage((p) => p - 1);
      else void fetchData();
    } catch {
      toast.error(t('admin.messages.deleteError'));
    }
  };

  return {
    data,
    total,
    loading,
    initialLoadDoneRef,
    fetchData,
    modalOpen,
    modalMode,
    modalEntity,
    currentItem,
    form,
    openCreateModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
    getEntity,
  };
};