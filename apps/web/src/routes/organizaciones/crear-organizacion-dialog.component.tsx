import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { organizacionApi } from '../../hooks/organizacion.hook.tsx';
import { AdminDialog } from '../admin/admin-dialog.component.tsx';
import { OrganizacionForm } from './organizacion-form.component.tsx';
import { organizacionUrl } from './organizaciones.utils.ts';

/** Modal de creación; al crearla abre su panel */
export const CrearOrganizacionDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const titleId = useId();

  return (
    <AdminDialog labelledBy={titleId} onClose={onClose} className="max-w-lg">
      <div className="flex items-start justify-between gap-4 border-b border-base-200 px-6 pb-4 pt-6">
        <div>
          <h3 id={titleId} className="text-lg font-semibold">{t('organizaciones.form.createTitle')}</h3>
          <p className="text-sm text-base-content/70">{t('organizaciones.form.createHelp')}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          onClick={onClose}
          aria-label={t('common.actions.close')}
        >
          <FiX aria-hidden />
        </button>
      </div>
      <div className="px-6 py-5">
        <OrganizacionForm
          submitLabel={t('common.actions.create')}
          extraActions={
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('common.actions.cancel')}
            </button>
          }
          onSubmit={async ({ nombre, descripcion }) => {
            const creada = await organizacionApi.create({ nombre, descripcion: descripcion || undefined });
            toast.success(t('organizaciones.form.created'));
            void navigate(organizacionUrl(creada.id));
          }}
        />
      </div>
    </AdminDialog>
  );
};
