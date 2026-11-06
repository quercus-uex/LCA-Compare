import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMapPin } from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { CopyToClipboardBtn } from '../../components/copy-to-clipboard.btn.component.tsx';
import { MapPreview } from '../../components/map-preview.component.tsx';
import { PAGE_CLASS } from '../../components/page-header.component.tsx';
import { type ParcelaDetalle, useParcela } from '../../hooks/parcela.hook.tsx';
import { CampaniasTable } from './campanias-table.component.tsx';
import { CompararParcelaDropdown } from './comparar-parcela.component.tsx';
import { CultivoActual } from './cultivo-actual.component.tsx';
import { ParcelaEvolucion } from './parcela-evolucion.component.tsx';
import { LoadErrorAlert, ParcelaDetailSkeleton } from './parcelas-states.component.tsx';
import { formatPoblacion, getIdentificadores, type ParcelaLinkState } from './parcelas.utils.ts';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; parcela: ParcelaDetalle };

export const ParcelaRoute = () => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const p = useParcela();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { t } = useTranslation();
  // Vuelve al listado con la búsqueda, los filtros y la vista con que se dejó
  const listUrl = `/parcelas${(location.state as ParcelaLinkState | null)?.listSearch ?? ''}`;

  const load = useCallback(() => {
    if (!id) return;
    setState({ status: 'loading' });
    p.getById(id)
      .then((parcela) => setState({ status: 'ready', parcela }))
      .catch((e: unknown) => {
        // Una parcela ajena se trata igual que una inexistente
        if (e instanceof ApiError && (e.status === 404 || e.status === 401)) {
          void navigate('/404', { replace: true });
        } else {
          setState({ status: 'error' });
        }
      });
  }, [id, navigate, p]);

  useEffect(load, [load]);

  const breadcrumbs = (nombre?: string) => (
    <nav className="breadcrumbs text-sm [&>ul]:flex-wrap [&>ul]:whitespace-normal" aria-label={t('parcelas.detail.breadcrumb')}>
      <ul>
        <li><Link to={listUrl}>{t('parcelas.title')}</Link></li>
        {nombre && <li aria-current="page">{nombre}</li>}
      </ul>
    </nav>
  );

  if (state.status === 'loading') return <ParcelaDetailSkeleton />;

  if (state.status === 'error') {
    return (
      <div className={PAGE_CLASS}>
        {breadcrumbs()}
        <LoadErrorAlert message={t('parcelas.detail.loadError')} onRetry={load} />
      </div>
    );
  }

  const { parcela } = state;
  const [cultivoActual] = parcela.cultivos;
  const identificadores = getIdentificadores(parcela, t);

  return (
    <div className={PAGE_CLASS}>
      {breadcrumbs(parcela.nombre)}

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

            {cultivoActual && <CompararParcelaDropdown parcela={parcela} />}
          </header>

          {identificadores.length > 0 && (
            <dl className="flex flex-col gap-1">
              {identificadores.map((i) => (
                <div key={i.key} className="flex flex-wrap items-center gap-2">
                  <dt className="font-semibold">{i.label}:</dt>
                  <dd className="font-mono break-all">{i.value}</dd>
                  <CopyToClipboardBtn text={i.value} label={i.label} />
                </div>
              ))}
            </dl>
          )}

          {cultivoActual
            ? <CultivoActual cultivo={cultivoActual} />
            : <div className="rounded-box bg-base-200 p-4 text-base-content/70">{t('parcelas.detail.noCrops')}</div>}
        </div>
      </div>

      {parcela.cultivos.length > 1 && <ParcelaEvolucion cultivos={parcela.cultivos} />}

      {parcela.cultivos.length > 0 && <CampaniasTable cultivos={parcela.cultivos} />}
    </div>
  );
};
