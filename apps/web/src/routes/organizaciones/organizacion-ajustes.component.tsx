import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiRepeat, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import {
  organizacionApi,
  type OrganizacionDetalle,
  type OrganizacionResumen,
} from '../../hooks/organizacion.hook.tsx';
import { ConfirmActionDialog } from './confirm-action-dialog.component.tsx';
import { OrganizacionForm } from './organizacion-form.component.tsx';
import { nombreCompleto, tieneAceptadas } from './organizaciones.utils.ts';

type Props = {
  organizacion: OrganizacionDetalle;
  onUpdated: (resumen: OrganizacionResumen) => void;
};

const Section = ({ title, description, danger, children }: { title: string; description: string; danger?: boolean; children: ReactNode }) => (
  <section className={`card bg-base-100 shadow-sm ${danger ? 'border border-red-700/40' : ''}`}>
    <div className="card-body gap-4 p-4 sm:p-6">
      <div>
        <h2 className={`text-xl font-semibold ${danger ? 'text-red-700' : ''}`}>{title}</h2>
        <p className="text-sm text-base-content/70">{description}</p>
      </div>
      {children}
    </div>
  </section>
);

export const OrganizacionAjustes = ({ organizacion, onUpdated }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectId = useId();
  const [idDestino, setIdDestino] = useState('');
  const [dialog, setDialog] = useState<'transferir' | 'eliminar' | null>(null);

  // Solo se puede transferir a quien tenga alguna campaña aceptada
  const candidatos = organizacion.miembros.filter((m) => tieneAceptadas(m.campanias));
  const destino = candidatos.find((m) => m.usuario.id === idDestino);

  return (
    <div className="flex flex-col gap-5">
      <Section title={t('organizaciones.ajustes.general.title')} description={t('organizaciones.ajustes.general.description')}>
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

      <Section title={t('organizaciones.ajustes.transfer.title')} description={t('organizaciones.ajustes.transfer.description')}>
        {candidatos.length === 0 ? (
          <p className="rounded-box bg-base-200 p-3 text-sm text-base-content/70">{t('organizaciones.ajustes.transfer.none')}</p>
        ) : (
          <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label htmlFor={selectId} className="text-sm font-medium">{t('organizaciones.ajustes.transfer.label')}</label>
              <select id={selectId} className="select w-full" value={idDestino} onChange={(e) => setIdDestino(e.target.value)}>
                <option value="">{t('organizaciones.ajustes.transfer.placeholder')}</option>
                {candidatos.map((m) => (
                  <option key={m.usuario.id} value={m.usuario.id}>
                    {nombreCompleto(m.usuario)} ({m.usuario.email})
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-outline" disabled={!destino} onClick={() => setDialog('transferir')}>
              <FiRepeat aria-hidden />
              {t('organizaciones.ajustes.transfer.submit')}
            </button>
          </div>
        )}
      </Section>

      <Section danger title={t('organizaciones.ajustes.delete.title')} description={t('organizaciones.ajustes.delete.description')}>
        <div>
          <button type="button" className="btn btn-error" onClick={() => setDialog('eliminar')}>
            <FiTrash2 aria-hidden />
            {t('organizaciones.ajustes.delete.submit')}
          </button>
        </div>
      </Section>

      {dialog === 'transferir' && destino && (
        <ConfirmActionDialog
          title={t('organizaciones.ajustes.transfer.confirmTitle', {
            organizacion: organizacion.nombre,
            nombre: nombreCompleto(destino.usuario),
          })}
          body={t('organizaciones.ajustes.transfer.confirmBody')}
          confirmLabel={t('organizaciones.ajustes.transfer.submit')}
          onClose={() => setDialog(null)}
          describeError={(e) =>
            e instanceof ApiError && e.status === 400 ? t('organizaciones.ajustes.transfer.invalid') : undefined}
          onConfirm={async () => {
            await organizacionApi.transferir(organizacion.id, { idUsuario: destino.usuario.id });
            toast.success(t('organizaciones.ajustes.transfer.done', { nombre: nombreCompleto(destino.usuario) }));
            // Ya no es el administrador: el panel dejaría de estar disponible
            void navigate('/organizaciones', { replace: true });
          }}
        />
      )}

      {dialog === 'eliminar' && (
        <ConfirmActionDialog
          title={t('organizaciones.ajustes.delete.confirmTitle', { nombre: organizacion.nombre })}
          body={t('organizaciones.ajustes.delete.confirmBody')}
          confirmLabel={t('organizaciones.ajustes.delete.submit')}
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
