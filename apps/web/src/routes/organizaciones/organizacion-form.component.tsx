import type { CreateOrganizacionDto } from 'common/organizacion';
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { describeOrganizacionError } from './organizaciones.utils.ts';

const NOMBRE_MAX = 120;
const DESCRIPCION_MAX = 500;

type Props = {
  initial?: { nombre: string; descripcion: string | null };
  submitLabel: string;
  onSubmit: (dto: Required<CreateOrganizacionDto>) => Promise<void>;
  /** Botones extra junto al de enviar (p. ej. cancelar en un modal) */
  extraActions?: ReactNode;
};

/** Nombre y descripción de una organización, para crearla o editarla */
export const OrganizacionForm = ({ initial, submitLabel, onSubmit, extraActions }: Props) => {
  const { t } = useTranslation();
  const id = useId();
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [nombreError, setNombreError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setNombreError(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // La descripción vacía llega como texto vacío: quien llama decide si omitirla
      await onSubmit({ nombre: nombreLimpio, descripcion: descripcion.trim() });
    } catch (err) {
      setError(describeOrganizacionError(err, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void submit(e)}>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-nombre`} className="text-sm font-medium">
          {t('organizaciones.form.nombre')}
          <span className="text-base-content/70" aria-hidden> *</span>
        </label>
        <input
          id={`${id}-nombre`}
          className={`input w-full ${nombreError ? 'input-error' : ''}`}
          value={nombre}
          maxLength={NOMBRE_MAX}
          required
          aria-invalid={nombreError}
          aria-describedby={nombreError ? `${id}-nombre-error` : undefined}
          onChange={(e) => {
            setNombre(e.target.value);
            if (e.target.value.trim()) setNombreError(false);
          }}
        />
        {nombreError && (
          <span id={`${id}-nombre-error`} className="text-sm font-medium text-red-700">
            {t('organizaciones.form.nombreRequired')}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-descripcion`} className="text-sm font-medium">
          {t('organizaciones.form.descripcion')}
        </label>
        <textarea
          id={`${id}-descripcion`}
          className="textarea w-full"
          rows={3}
          value={descripcion}
          maxLength={DESCRIPCION_MAX}
          aria-describedby={`${id}-descripcion-hint`}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <span id={`${id}-descripcion-hint`} className="text-sm text-base-content/70">
          {t('organizaciones.form.descripcionHint')}
        </span>
      </div>

      {error && <div role="alert" className="alert alert-error text-sm">{error}</div>}

      <div className="flex flex-wrap justify-end gap-2">
        {extraActions}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <span className="loading loading-spinner loading-sm" aria-hidden />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
