import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiRepeat, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import { Button, Card, ConfirmDialog, Field, Section, Select } from '../../components/ui/index.ts';
import {
  organizacionApi,
  type OrganizacionDetalle,
  type OrganizacionResumen,
} from '../../hooks/organizacion.hook.tsx';
import { OrganizacionForm } from './organizacion-form.component.tsx';
import { describeOrganizacionError, nombreCompleto, tieneAceptadas } from './organizaciones.utils.ts';

type Props = {
  organizacion: OrganizacionDetalle;
  onUpdated: (resumen: OrganizacionResumen) => void;
};

// Section no tiene variante de peligro: el bloque de eliminar marca en rojo su borde y su título
const DangerSection = ({ title, hint, children }: { title: string; hint: string; children: ReactNode }) => {
  const id = useId();
  return (
    <Card as="section" aria-labelledby={id} className="border border-danger/40">
      <header>
        <h2 id={id} className="text-lg font-semibold text-danger">{title}</h2>
        <p className="text-sm text-muted">{hint}</p>
      </header>
      {children}
    </Card>
  );
};

export const OrganizacionAjustes = ({ organizacion, onUpdated }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [idDestino, setIdDestino] = useState('');
  const [dialog, setDialog] = useState<'transferir' | 'eliminar' | null>(null);

  // Solo se puede transferir a quien tenga alguna campaña aceptada
  const candidatos = organizacion.miembros.filter((m) => tieneAceptadas(m.campanias));
  const destino = candidatos.find((m) => m.usuario.id === idDestino);

  return (
    <div className="flex flex-col gap-5">
      <Section title={t('organizaciones.ajustes.general.title')} hint={t('organizaciones.ajustes.general.description')}>
        <div className="max-w-2xl">
          <OrganizacionForm
            key={organizacion.id}
            initial={organizacion}
            submitLabel={t('common.actions.save')}
            onSubmit={async (dto) => {
              onUpdated(await organizacionApi.update(organizacion.id, dto));
              toast.success(t('organizaciones.ajustes.general.saved'));
            }}
          />
        </div>
      </Section>

      <Section title={t('organizaciones.ajustes.transfer.title')} hint={t('organizaciones.ajustes.transfer.description')}>
        {candidatos.length === 0 ? (
          <p className="rounded-box bg-base-200 p-3 text-sm text-muted">{t('organizaciones.ajustes.transfer.none')}</p>
        ) : (
          <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
            <Field label={t('organizaciones.ajustes.transfer.label')} className="min-w-0 flex-1">
              <Select value={idDestino} onChange={(e) => setIdDestino(e.target.value)}>
                <option value="">{t('organizaciones.ajustes.transfer.placeholder')}</option>
                {candidatos.map((m) => (
                  <option key={m.usuario.id} value={m.usuario.id}>
                    {nombreCompleto(m.usuario)} ({m.usuario.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Button variant="outline" icon={FiRepeat} disabled={!destino} onClick={() => setDialog('transferir')}>
              {t('organizaciones.ajustes.transfer.submit')}
            </Button>
          </div>
        )}
      </Section>

      <DangerSection title={t('organizaciones.ajustes.delete.title')} hint={t('organizaciones.ajustes.delete.description')}>
        <div>
          <Button variant="danger" icon={FiTrash2} onClick={() => setDialog('eliminar')}>
            {t('organizaciones.ajustes.delete.submit')}
          </Button>
        </div>
      </DangerSection>

      {dialog === 'transferir' && destino && (
        <ConfirmDialog
          title={t('organizaciones.ajustes.transfer.confirmTitle', {
            organizacion: organizacion.nombre,
            nombre: nombreCompleto(destino.usuario),
          })}
          body={t('organizaciones.ajustes.transfer.confirmBody')}
          confirmLabel={t('organizaciones.ajustes.transfer.submit')}
          onClose={() => setDialog(null)}
          cancelLabel={t('organizaciones.confirm.dismiss')}
          describeError={(e) =>
            e instanceof ApiError && e.status === 400
              ? t('organizaciones.ajustes.transfer.invalid')
              : describeOrganizacionError(e, t)}
          onConfirm={async () => {
            await organizacionApi.transferir(organizacion.id, { idUsuario: destino.usuario.id });
            toast.success(t('organizaciones.ajustes.transfer.done', { nombre: nombreCompleto(destino.usuario) }));
            // Ya no es el administrador: el panel dejaría de estar disponible
            void navigate('/organizaciones', { replace: true });
          }}
        />
      )}

      {dialog === 'eliminar' && (
        <ConfirmDialog
          title={t('organizaciones.ajustes.delete.confirmTitle', { nombre: organizacion.nombre })}
          body={t('organizaciones.ajustes.delete.confirmBody')}
          confirmLabel={t('organizaciones.ajustes.delete.submit')}
          cancelLabel={t('organizaciones.confirm.dismiss')}
          describeError={(e) => describeOrganizacionError(e, t)}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await organizacionApi.remove(organizacion.id);
            toast.success(t('organizaciones.ajustes.delete.done', { nombre: organizacion.nombre }));
            void navigate('/organizaciones', { replace: true });
          }}
        />
      )}
    </div>
  );
};
