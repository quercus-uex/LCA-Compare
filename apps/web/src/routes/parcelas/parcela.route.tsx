import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../common/api.ts';
import { CopyToClipboardBtn } from '../../components/copy-to-clipboard.btn.component.tsx';
import { EmptyState, ErrorAlert, Page } from '../../components/ui/index.ts';
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
      <Page>
        <ParcelaBreadcrumbs />
        <ErrorAlert message={t('parcelas.detail.loadError')} onRetry={load} />
      </Page>
    );
  }

  const { parcela } = state;
  const [cultivoActual] = parcela.cultivos;
  const identificadores = getIdentificadores(parcela, t);

  return (
    <Page>
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
                {/* El botón va dentro de <dd>: en una lista de definiciones solo caben <dt> y <dd> */}
                <dd className="flex items-center gap-2">
                  <span className="font-mono break-all">{i.value}</span>
                  <CopyToClipboardBtn text={i.value} label={i.label} />
                </dd>
              </div>
            ))}
          </dl>
        )}

        {cultivoActual
          ? <CultivoActual cultivo={cultivoActual} />
          : <EmptyState variant="inset" icon={false} description={t('parcelas.detail.noCrops')} />}
      </ParcelaHeroCard>

      {parcela.cultivos.length > 1 && <ParcelaEvolucion cultivos={parcela.cultivos} />}

      {parcela.cultivos.length > 0 && <CampaniasTable cultivos={parcela.cultivos} linkState={location.state as unknown} />}
    </Page>
  );
};
