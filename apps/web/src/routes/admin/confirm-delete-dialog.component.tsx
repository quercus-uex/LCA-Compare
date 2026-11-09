import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ui/index.ts';
import { deleteItem, type AdminError } from './admin-api.ts';
import { CONFIG, ENTITY_DISPLAY, type Entity, type Item } from './admin.config.ts';

type Props = {
  entity: Entity;
  item: Item;
  onClose: () => void;
  onDeleted: () => void;
};

export const ConfirmDeleteDialog = ({ entity, item, onClose, onDeleted }: Props) => {
  const { t } = useTranslation();

  const name = ENTITY_DISPLAY[entity].label(item) || String(item.id);
  const cultivos = Array.isArray(item.cultivos) ? item.cultivos.length : 0;

  const describeError = (e: AdminError) => {
    if (e.code === 'in-use') return t(`admin.errors.inUse.${entity}`, { defaultValue: t('admin.errors.inUseGeneric') });
    if (e.code === 'not-found') return t('admin.errors.notFound');
    if (e.code === 'validation' && e.message) return e.message;
    return t('admin.errors.unknown');
  };

  // `deleteItem` devuelve el error en vez de lanzarlo: el diálogo lo muestra si se lanza
  const confirm = async () => {
    let result: AdminError | null;
    try {
      result = await deleteItem(entity, item.id as string);
    } catch {
      throw new Error(t('admin.errors.network'));
    }
    if (result) throw new Error(describeError(result));
    onDeleted();
  };

  return (
    <ConfirmDialog
      title={t(`admin.deleteTitles.${CONFIG[entity].titleKey}`)}
      body={
        <>
          <p>{t('admin.delete.body', { name })}</p>
          {entity === 'parcelas' && cultivos > 0 && (
            <p className="font-medium">{t('admin.delete.parcelaCascade', { count: cultivos })}</p>
          )}
          {entity === 'cultivos' && <p>{t('admin.delete.cultivoCascade')}</p>}
          {entity === 'organizaciones' && <p>{t('admin.delete.organizacionCascade')}</p>}
          <p className="text-muted">{t('admin.delete.irreversible')}</p>
        </>
      }
      confirmLabel={t('common.actions.delete')}
      onConfirm={confirm}
      onClose={onClose}
      describeError={(e) => (e instanceof Error ? e.message : undefined)}
    />
  );
};
