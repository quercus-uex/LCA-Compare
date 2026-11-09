import { type FormEvent, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiSend } from 'react-icons/fi';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import { formatList } from '../../common/format.ts';
import { useAuth } from '../../hooks/auth.hook.tsx';
import { organizacionApi, type OrganizacionDetalle } from '../../hooks/organizacion.hook.tsx';
import { campaniasSolicitables, describeOrganizacionError } from './organizaciones.utils.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormError = { field: 'email' | 'anios' | 'form'; message: string };

type Props = {
  organizacion: OrganizacionDetalle;
  /** Tras enviar, para recargar los miembros */
  onSent: () => void;
};

export const OrganizacionSolicitar = ({ organizacion, onSent }: Props) => {
  const { t } = useTranslation();
  const { usuario } = useAuth();
  const id = useId();
  const anios = useMemo(() => campaniasSolicitables(), []);
  const [email, setEmail] = useState('');
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [error, setError] = useState<FormError | null>(null);
  const [sending, setSending] = useState(false);

  // Si el email ya es de un miembro, sus campañas pendientes o aceptadas no se pueden volver a pedir
  const normalizedEmail = email.trim().toLowerCase();
  const miembro = organizacion.miembros.find((m) => m.usuario.email.toLowerCase() === normalizedEmail);
  const yaActivas = new Map(
    (miembro?.campanias ?? [])
      .filter((c) => c.estado === 'aceptado' || c.estado === 'pendiente')
      .map((c) => [c.anio, c.estado]),
  );
  const elegidas = [...seleccion].filter((a) => !yaActivas.has(a)).sort((a, b) => a - b);

  const toggle = (anio: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(anio)) next.delete(anio);
      else next.add(anio);
      return next;
    });
    if (error?.field === 'anios') setError(null);
  };

  const describeError = (e: unknown): FormError => {
    if (e instanceof ApiError && e.status === 404) {
      return { field: 'email', message: t('organizaciones.solicitar.errors.userNotFound') };
    }
    if (e instanceof ApiError && e.status === 400) {
      return { field: 'form', message: t('organizaciones.solicitar.errors.invalid') };
    }
    return { field: 'form', message: describeOrganizacionError(e, t) };
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError({ field: 'email', message: t('organizaciones.solicitar.errors.email') });
      return;
    }
    if (normalizedEmail === usuario?.email.toLowerCase()) {
      setError({ field: 'email', message: t('organizaciones.solicitar.errors.ownEmail') });
      return;
    }
    if (elegidas.length === 0) {
      setError({ field: 'anios', message: t('organizaciones.solicitar.errors.years') });
      return;
    }

    setSending(true);
    setError(null);
    try {
      const { solicitados, omitidos } = await organizacionApi.solicitar(organizacion.id, {
        email: email.trim(),
        anios: elegidas,
      });
      const description = omitidos.length > 0
        ? t('organizaciones.solicitar.skipped', { count: omitidos.length, anios: formatList(omitidos) })
        : undefined;
      if (solicitados.length > 0) {
        toast.success(
          t('organizaciones.solicitar.sent', { count: solicitados.length, anios: formatList(solicitados), email: email.trim() }),
          { description },
        );
      } else {
        toast.info(t('organizaciones.solicitar.nothingSent'), { description });
      }
      setEmail('');
      setSeleccion(new Set());
      onSent();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSending(false);
    }
  };

  const errorId = `${id}-error`;

  return (
    <form className="card bg-base-100 shadow-sm" noValidate onSubmit={(e) => void submit(e)}>
      <div className="card-body max-w-2xl gap-5 p-4 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">{t('organizaciones.solicitar.title')}</h2>
          <p className="text-sm text-base-content/70">{t('organizaciones.solicitar.description')}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-email`} className="text-sm font-medium">{t('organizaciones.solicitar.email')}</label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="off"
            className={`input w-full ${error?.field === 'email' ? 'input-error' : ''}`}
            placeholder={t('organizaciones.solicitar.emailPlaceholder')}
            value={email}
            aria-invalid={error?.field === 'email'}
            aria-describedby={error?.field === 'email' ? errorId : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error?.field === 'email') setError(null);
            }}
          />
          {error?.field === 'email' && (
            <span id={errorId} role="alert" className="text-sm font-medium text-red-700">{error.message}</span>
          )}
        </div>

        <fieldset className="flex flex-col gap-2" aria-describedby={error?.field === 'anios' ? errorId : `${id}-anios-hint`}>
          <legend className="mb-1 text-sm font-medium">{t('organizaciones.solicitar.years')}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {anios.map((anio) => {
              const activa = yaActivas.get(anio);
              const selected = !activa && seleccion.has(anio);
              return (
                <button
                  key={anio}
                  type="button"
                  className={`btn btn-sm tabular-nums ${selected ? 'btn-primary' : 'btn-outline'}`}
                  aria-pressed={selected}
                  disabled={!!activa}
                  title={activa ? t('organizaciones.solicitar.alreadyActive', { estado: t(`organizaciones.estados.${activa}`) }) : undefined}
                  onClick={() => toggle(anio)}
                >
                  {selected && <FiCheck aria-hidden />}
                  {anio}
                  {activa && <span className="sr-only">: {t(`organizaciones.estados.${activa}`)}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSeleccion(new Set(anios))}>
              {t('organizaciones.solicitar.selectAll')}
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSeleccion(new Set())}>
              {t('organizaciones.solicitar.selectNone')}
            </button>
            <span id={`${id}-anios-hint`} className="ml-1 text-base-content/70" aria-live="polite">
              {t('organizaciones.solicitar.selected', { count: elegidas.length })}
            </span>
          </div>
          {miembro && yaActivas.size > 0 && (
            <p className="text-sm text-base-content/70">
              {t('organizaciones.solicitar.memberHint', { nombre: miembro.usuario.nombre })}
            </p>
          )}
          {error?.field === 'anios' && (
            <span id={errorId} role="alert" className="text-sm font-medium text-red-700">{error.message}</span>
          )}
        </fieldset>

        {error?.field === 'form' && <div role="alert" className="alert alert-error text-sm">{error.message}</div>}

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={sending}>
            {sending ? <span className="loading loading-spinner loading-sm" aria-hidden /> : <FiSend aria-hidden />}
            {t('organizaciones.solicitar.submit')}
          </button>
        </div>
      </div>
    </form>
  );
};
