import type { AccesoOrganizacion } from 'common/organizacion';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMapPin } from 'react-icons/fi';
import { useLocation } from 'react-router';
import { formatList } from '../../common/format.ts';
import { MapPreview } from '../../components/map-preview.component.tsx';
import { Badge, Breadcrumbs, Callout, Card, type Crumb } from '../../components/ui/index.ts';
import type { ParcelaDetalle } from '../../hooks/parcela.hook.tsx';
import { miembroUrl, nombreCompleto, organizacionUrl } from '../organizaciones/organizaciones.utils.ts';
import { formatPoblacion, type ParcelaLinkState } from './parcelas.utils.ts';

/**
 * Migas desde «Mis parcelas», o desde `root` si se indica; el último elemento
 * es la página actual. Los enlaces conservan el estado de navegación para que
 * el detalle de un resultado pueda volver a la parcela por el mismo camino.
 */
export const ParcelaBreadcrumbs = ({ items = [], root }: { items?: Crumb[]; root?: Crumb[] }) => {
  const { t } = useTranslation();
  const location = useLocation();
  // Vuelve al listado con la búsqueda, los filtros y la vista con que se dejó
  const listUrl = `/parcelas${(location.state as ParcelaLinkState | null)?.listSearch ?? ''}`;
  const crumbs: Crumb[] = [...(root ?? [{ label: t('parcelas.title'), to: listUrl }]), ...items];

  return <Breadcrumbs items={crumbs} state={location.state as unknown} />;
};

/**
 * Migas de una parcela ajena: «Organizaciones › organización › miembro». Usa
 * la organización desde la que se llegó si sigue dando acceso; si no, la primera.
 */
export const useAccesoCrumbs = (acceso: AccesoOrganizacion | undefined): Crumb[] | undefined => {
  const { t } = useTranslation();
  const location = useLocation();
  if (!acceso) return undefined;
  const origen = (location.state as ParcelaLinkState | null)?.organizacion;
  const organizacion = acceso.organizaciones.find((o) => o.id === origen?.id) ?? acceso.organizaciones[0];
  const root: Crumb[] = [{ label: t('organizaciones.title'), to: '/organizaciones' }];
  if (!organizacion) return root;
  const search = origen?.id === organizacion.id ? origen.search : '';
  return [
    ...root,
    { label: organizacion.nombre, to: organizacionUrl(organizacion.id) },
    { label: nombreCompleto(acceso.propietario), to: `${miembroUrl(organizacion.id, acceso.propietario.id)}${search}` },
  ];
};

/** Texto de la cabecera de una parcela ajena: de quién es y por qué organizaciones se ve */
export const useAccesoEyebrow = (acceso: AccesoOrganizacion | undefined): string | undefined => {
  const { t } = useTranslation();
  if (!acceso) return undefined;
  return t('organizaciones.acceso.eyebrow', {
    nombre: nombreCompleto(acceso.propietario),
    organizaciones: formatList(acceso.organizaciones.map((o) => o.nombre)),
  });
};

/** Aviso de que de una parcela ajena solo se ven las campañas consentidas */
export const AccesoNote = ({ acceso }: { acceso: AccesoOrganizacion }) => {
  const { t } = useTranslation();
  return (
    <Callout tone="info">
      {t('organizaciones.acceso.note', {
        nombre: nombreCompleto(acceso.propietario),
        count: acceso.anios.length,
        anios: formatList([...acceso.anios].sort((a, b) => a - b)),
      })}
    </Callout>
  );
};

type HeroProps = {
  parcela: ParcelaDetalle;
  /** Texto pequeño sobre el nombre */
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

/** Tarjeta de cabecera de una parcela: mapa, nombre, municipio y acciones */
export const ParcelaHeroCard = ({ parcela, eyebrow, actions, children }: HeroProps) => {
  const { t } = useTranslation();

  return (
    // eslint-disable-next-line no-restricted-syntax -- `card-side` coloca el mapa a la izquierda y redondea solo sus esquinas exteriores
    <Card flush className="lg:card-side">
      <figure className="lg:w-96 lg:shrink-0 lg:self-stretch">
        <MapPreview
          polygon={parcela.geom ?? undefined}
          satellite
          className="h-64 w-full sm:h-80 lg:h-full lg:min-h-96"
        />
      </figure>
      <div className="flex min-w-0 flex-auto flex-col gap-5 p-4 text-sm sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow && (
              <div className="eyebrow">{eyebrow}</div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold break-words">{parcela.nombre}</h1>
              {parcela.esParcelaReferencia && (
                <Badge tone="success">{t('parcelas.referenceBadge')}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <FiMapPin aria-hidden />
              {formatPoblacion(parcela.poblacion, t)}
            </div>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </Card>
  );
};
