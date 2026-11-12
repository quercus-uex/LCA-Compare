import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiMap } from 'react-icons/fi';
import { toast } from 'sonner';
import { ButtonLink, Card, SectionHeader, ToggleButton } from '../../components/ui/index.ts';
import { organizacionApi, type OrganizacionDetalle } from '../../hooks/organizacion.hook.tsx';
import { campaniasSolicitables, describeOrganizacionError, miembroUrl } from './organizaciones.utils.ts';

type Props = {
  organizacion: OrganizacionDetalle;
  onChange: (organizacion: OrganizacionDetalle) => void;
};

/** Campañas propias que el administrador aporta a la organización, sin solicitud */
export const OrganizacionCampaniasPropias = ({ organizacion, onChange }: Props) => {
  const { t } = useTranslation();
  const id = useId();
  const anios = useMemo(() => campaniasSolicitables(), []);
  const [saving, setSaving] = useState<number | null>(null);
  const aportadas = new Set(organizacion.campaniasAdministrador.map((c) => c.anio));

  const toggle = async (anio: number) => {
    const next = new Set(aportadas);
    const added = !next.delete(anio);
    if (added) next.add(anio);

    setSaving(anio);
    try {
      onChange(await organizacionApi.setCampaniasAdministrador(organizacion.id, { anios: [...next] }));
      toast.success(t(added ? 'organizaciones.propias.added' : 'organizaciones.propias.removed', { anio }));
    } catch (e) {
      toast.error(describeOrganizacionError(e, t));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-3">
        <SectionHeader
          id={`${id}-title`}
          title={t('organizaciones.propias.title')}
          hint={t('organizaciones.propias.hint')}
          actions={aportadas.size > 0 && (
            <ButtonLink
              variant="outline"
              size="sm"
              icon={FiMap}
              to={miembroUrl(organizacion.id, organizacion.administrador.id)}
            >
              {t('organizaciones.miembros.viewPlots')}
            </ButtonLink>
          )}
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby={`${id}-title`}>
          {anios.map((anio) => {
            const pressed = aportadas.has(anio);
            return (
              <ToggleButton
                key={anio}
                size="sm"
                className="tabular-nums"
                pressed={pressed}
                icon={pressed ? FiCheck : undefined}
                loading={saving === anio}
                disabled={saving !== null && saving !== anio}
                onClick={() => void toggle(anio)}
              >
                {anio}
              </ToggleButton>
            );
          })}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {t('organizaciones.propias.count', { count: aportadas.size })}
        </p>
      </div>
    </Card>
  );
};
