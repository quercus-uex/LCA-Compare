import type { CreateOrganizacionDto } from 'common/organizacion';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Callout, Field, Input, Textarea } from '../../components/ui/index.ts';
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
      <Field
        label={t('organizaciones.form.nombre')}
        error={nombreError ? t('organizaciones.form.nombreRequired') : undefined}
        required
      >
        <Input
          value={nombre}
          maxLength={NOMBRE_MAX}
          onChange={(e) => {
            setNombre(e.target.value);
            if (e.target.value.trim()) setNombreError(false);
          }}
        />
      </Field>

      <Field label={t('organizaciones.form.descripcion')} hint={t('organizaciones.form.descripcionHint')}>
        <Textarea
          rows={3}
          value={descripcion}
          maxLength={DESCRIPCION_MAX}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Field>

      {error && <Callout tone="error" live>{error}</Callout>}

      <div className="flex flex-wrap justify-end gap-2">
        {extraActions}
        <Button variant="primary" type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
};
