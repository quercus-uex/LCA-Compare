import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button, Dialog } from '../../components/ui/index.ts';
import { organizacionApi } from '../../hooks/organizacion.hook.tsx';
import { OrganizacionForm } from './organizacion-form.component.tsx';
import { organizacionUrl } from './organizaciones.utils.ts';

/** Modal de creación; al crearla abre su panel */
export const CrearOrganizacionDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog title={t('organizaciones.form.createTitle')} description={t('organizaciones.form.createHelp')} onClose={onClose}>
      <OrganizacionForm
        submitLabel={t('common.actions.create')}
        extraActions={<Button variant="ghost" onClick={onClose}>{t('common.actions.cancel')}</Button>}
        onSubmit={async ({ nombre, descripcion }) => {
          const creada = await organizacionApi.create({ nombre, descripcion: descripcion || undefined });
          toast.success(t('organizaciones.form.created'));
          void navigate(organizacionUrl(creada.id));
        }}
      />
    </Dialog>
  );
};
