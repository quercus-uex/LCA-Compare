import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle } from 'react-icons/fi';
import { deleteItem, type AdminError } from './admin-api.ts';
import { AdminDialog } from './admin-dialog.component.tsx';
import { CONFIG, ENTITY_DISPLAY, type Entity, type Item } from './admin.config.ts';

type Props = {
  entity: Entity;
  item: Item;
  onClose: () => void;
  onDeleted: () => void;
};

export const ConfirmDeleteDialog = ({ entity, item, onClose, onDeleted }: Props) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = ENTITY_DISPLAY[entity].label(item) || String(item.id);
  const cultivos = Array.isArray(item.cultivos) ? item.cultivos.length : 0;

  const describeError = (e: AdminError) => {
    if (e.code === 'in-use') return t(`admin.errors.inUse.${entity}`, { defaultValue: t('admin.errors.inUseGeneric') });
    if (e.code === 'not-found') return t('admin.errors.notFound');
    if (e.code === 'validation' && e.message) return e.message;
    return t('admin.errors.unknown');
  };

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteItem(entity, item.id as string);
      if (result) {
        setError(describeError(result));
        return;
      }
      onDeleted();
    } catch {
      setError(t('admin.errors.network'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminDialog labelledBy={titleId} onClose={onClose} locked={deleting} className="max-w-md">
      <div className="p-6 flex gap-4">
        <div className="shrink-0 size-10 rounded-full bg-error flex items-center justify-center text-error-content">
          <FiAlertTriangle aria-hidden />
        </div>
        <div className="flex flex-col gap-2">
          <h3 id={titleId} className="text-lg font-semibold">
            {t(`admin.deleteTitles.${CONFIG[entity].titleKey}`)}
          </h3>
          <p className="text-sm">{t('admin.delete.body', { name })}</p>
          {entity === 'parcelas' && cultivos > 0 && (
            <p className="text-sm font-medium">{t('admin.delete.parcelaCascade', { count: cultivos })}</p>
          )}
          {entity === 'cultivos' && <p className="text-sm">{t('admin.delete.cultivoCascade')}</p>}
          <p className="text-sm text-base-content/60">{t('admin.delete.irreversible')}</p>
          {error && (
            <div role="alert" className="alert alert-error text-sm mt-1">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-base-200 bg-base-200/40">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting}>
          {t('common.actions.cancel')}
        </button>
        <button type="button" className="btn btn-error" onClick={() => void confirm()} disabled={deleting}>
          {deleting && <span className="loading loading-spinner loading-sm" aria-hidden />}
          {t('common.actions.delete')}
        </button>
      </div>
    </AdminDialog>
  );
};
