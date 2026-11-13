import { type FormEvent, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiSend } from 'react-icons/fi';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import { formatList } from '../../common/format.ts';
import { Button, Callout, Card, Field, Input, SectionHeader, ToggleButton } from '../../components/ui/index.ts';
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
    <Card>
      <form className="flex max-w-2xl flex-col gap-5" noValidate onSubmit={(e) => void submit(e)}>
        <SectionHeader title={t('organizaciones.solicitar.title')} hint={t('organizaciones.solicitar.description')} />

        <Field
          label={t('organizaciones.solicitar.email')}
          // El error se anuncia al aparecer
          error={error?.field === 'email' ? <span role="alert">{error.message}</span> : undefined}
        >
          <Input
            type="email"
            autoComplete="off"
            placeholder={t('organizaciones.solicitar.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error?.field === 'email') setError(null);
            }}
          />
        </Field>

        <fieldset className="flex flex-col gap-2" aria-describedby={error?.field === 'anios' ? errorId : `${id}-anios-hint`}>
          <legend className="mb-1 text-sm font-medium">{t('organizaciones.solicitar.years')}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {anios.map((anio) => {
              const activa = yaActivas.get(anio);
              const selected = !activa && seleccion.has(anio);
              return (
                <ToggleButton
                  key={anio}
                  size="sm"
                  className="tabular-nums"
                  pressed={selected}
                  icon={selected ? FiCheck : undefined}
                  disabled={!!activa}
                  title={activa ? t('organizaciones.solicitar.alreadyActive', { estado: t(`organizaciones.estados.${activa}`) }) : undefined}
                  onClick={() => toggle(anio)}
                >
                  {anio}
                  {activa && <span className="sr-only">: {t(`organizaciones.estados.${activa}`)}</span>}
                </ToggleButton>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <Button variant="ghost" size="xs" onClick={() => setSeleccion(new Set(anios))}>
              {t('organizaciones.solicitar.selectAll')}
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setSeleccion(new Set())}>
              {t('organizaciones.solicitar.selectNone')}
            </Button>
            <span id={`${id}-anios-hint`} className="ml-1 text-muted" aria-live="polite">
              {t('organizaciones.solicitar.selected', { count: elegidas.length })}
            </span>
          </div>
          {miembro && yaActivas.size > 0 && (
            <p className="text-sm text-muted">
              {t('organizaciones.solicitar.memberHint', { nombre: miembro.usuario.nombre })}
            </p>
          )}
          {error?.field === 'anios' && (
            <span id={errorId} role="alert" className="text-sm font-medium text-danger">{error.message}</span>
          )}
        </fieldset>

        {error?.field === 'form' && <Callout tone="error" live>{error.message}</Callout>}

        <div className="flex justify-end">
          <Button variant="primary" type="submit" icon={FiSend} loading={sending} className="w-full sm:w-auto">
            {t('organizaciones.solicitar.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
