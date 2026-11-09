import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { CopyToClipboardBtn } from '../../components/copy-to-clipboard.btn.component.tsx';
import { LoadErrorAlert } from '../../components/load-error-alert.component.tsx';
import { PAGE_CLASS } from '../../components/page-header.component.tsx';
import { type ParcelaDetalle, useParcela } from '../../hooks/parcela.hook.tsx';
import { CampaniasTable } from './campanias-table.component.tsx';
import { CompararParcelaDropdown } from './comparar-parcela.component.tsx';
import { CultivoActual } from './cultivo-actual.component.tsx';
import { ParcelaEvolucion } from './parcela-evolucion.component.tsx';
import {
  AccesoNote,
  ParcelaBreadcrumbs,
  ParcelaHeroCard,
  useAccesoCrumbs,
  useAccesoEyebrow,
} from './parcela-hero.component.tsx';
import { ParcelaDetailSkeleton } from './parcelas-states.component.tsx';
import { getIdentificadores } from './parcelas.utils.ts';

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
  const acceso = state.status === 'ready' ? state.parcela.acceso : undefined;
  const accesoCrumbs = useAccesoCrumbs(acceso);
  const accesoEyebrow = useAccesoEyebrow(acceso);

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

  if (state.status === 'loading') return <ParcelaDetailSkeleton />;

  if (state.status === 'error') {
    return (
      <div className={PAGE_CLASS}>
        <ParcelaBreadcrumbs />
        <LoadErrorAlert message={t('parcelas.detail.loadError')} onRetry={load} />
      </div>
    );
  }

  const { parcela } = state;
  const [cultivoActual] = parcela.cultivos;
  const identificadores = getIdentificadores(parcela, t);

  return (
    <div className={PAGE_CLASS}>
      <ParcelaBreadcrumbs root={accesoCrumbs} items={[{ label: parcela.nombre }]} />

      <ParcelaHeroCard
        parcela={parcela}
        eyebrow={accesoEyebrow}
        // Comparar por parcela usaría todas sus campañas, también las no consentidas
        actions={cultivoActual && !acceso && <CompararParcelaDropdown parcela={parcela} />}
      >
        {acceso && <AccesoNote acceso={acceso} />}

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
      </ParcelaHeroCard>

      {parcela.cultivos.length > 1 && <ParcelaEvolucion cultivos={parcela.cultivos} />}

      {parcela.cultivos.length > 0 && <CampaniasTable cultivos={parcela.cultivos} linkState={location.state as unknown} />}
    </div>
  );
};
