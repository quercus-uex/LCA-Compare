import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMapPin } from 'react-icons/fi';
import { Link, useLocation } from 'react-router';
import { MapPreview } from '../../components/map-preview.component.tsx';
import type { ParcelaDetalle } from '../../hooks/parcela.hook.tsx';
import { formatPoblacion, type ParcelaLinkState } from './parcelas.utils.ts';

type Crumb = { label: string; to?: string };

/** Migas desde «Mis parcelas»; el último elemento es la página actual */
export const ParcelaBreadcrumbs = ({ items = [] }: { items?: Crumb[] }) => {
  const { t } = useTranslation();
  const location = useLocation();
  // Vuelve al listado con la búsqueda, los filtros y la vista con que se dejó
  const listUrl = `/parcelas${(location.state as ParcelaLinkState | null)?.listSearch ?? ''}`;
  const crumbs: Crumb[] = [{ label: t('parcelas.title'), to: listUrl }, ...items];

  return (
    <nav className="breadcrumbs text-sm [&>ul]:flex-wrap [&>ul]:whitespace-normal" aria-label={t('parcelas.detail.breadcrumb')}>
      <ul>
        {crumbs.map((c, i) => (
          <li key={i} aria-current={i === crumbs.length - 1 && i > 0 ? 'page' : undefined}>
            {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}
          </li>
        ))}
      </ul>
    </nav>
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
    <div className="card bg-base-100 shadow-sm lg:card-side">
      <figure className="lg:w-96 lg:shrink-0 lg:self-stretch">
        <MapPreview
          polygon={parcela.geom ?? undefined}
          satellite
          className="h-64 w-full sm:h-80 lg:h-full lg:min-h-96"
        />
      </figure>
      <div className="card-body gap-5 min-w-0">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            {eyebrow && (
              <div className="text-sm font-semibold uppercase tracking-wide text-base-content/70">{eyebrow}</div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold break-words">{parcela.nombre}</h1>
              {parcela.esParcelaReferencia && (
                <span className="badge badge-success">{t('parcelas.referenceBadge')}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-base-content/70">
              <FiMapPin aria-hidden />
              {formatPoblacion(parcela.poblacion, t)}
            </div>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
};
