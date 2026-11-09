import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import { exportJSON, exportCSV, hasTargetSet, omitNullish } from '../../common/utils.ts';
import { Dropdown } from '../../components/dropdown.component.tsx';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import type { Poblacion, Provincia } from '../../hooks/location.hook.tsx';
import { useOrganizacionesAdministradas } from '../../hooks/organizacion.hook.tsx';
import type { Parcela } from '../../hooks/parcela.hook.tsx';
import { buildCompareCSV, buildCompareExportPayload, type CompareExportMode } from './compare-export.utils.ts';
import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { CompareResultCard } from './compare-result-card.component.tsx';

type CompareRouteState = {
  parcelaObjetivo?: Parcela;
  parcelaReferencia?: Parcela;
  provinciaReferencia?: Provincia;
  poblacionReferencia?: Poblacion;
};

export const CompareRoute = () => {
  const location = useLocation();
  const state = location.state as CompareRouteState | null;
  const parcelaObjetivo = state?.parcelaObjetivo;
  const parcelaReferencia = state?.parcelaReferencia;
  const provinciaReferencia = state?.provinciaReferencia;
  const poblacionReferencia = state?.poblacionReferencia;
  const initialReferenciaFilters: CompareFilterType = {
    parcelas: parcelaReferencia ? [parcelaReferencia] : [],
    provincias: provinciaReferencia ? [provinciaReferencia] : [],
    poblaciones: poblacionReferencia ? [poblacionReferencia] : [],
  };
  const initialObjetivoFilters: CompareFilterType | undefined = parcelaObjetivo
    ? { parcelas: [parcelaObjetivo], provincias: [], poblaciones: [] }
    : undefined;

  const [filtersRef, setFiltersRef] = useState<CompareFilterType>(initialReferenciaFilters);
  const [filtersObj, setFiltersObj] = useState<CompareFilterType | undefined>(initialObjetivoFilters);
  const [result, setResult] = useState<CompareResult | undefined>();

  const exportOptions: Array<{
    mode: CompareExportMode;
    titleKey: string;
    filePrefix: string;
    metadata: unknown;
    needsTarget: boolean;
  }> = [
    { mode: 'full', titleKey: 'compare.actions.exportComparison', filePrefix: 'comparativa', metadata: { reference: filtersRef, target: filtersObj }, needsTarget: true },
    { mode: 'target', titleKey: 'compare.actions.exportTarget', filePrefix: 'objetivo', metadata: filtersObj, needsTarget: true },
    { mode: 'reference', titleKey: 'compare.actions.exportReference', filePrefix: 'referencia', metadata: filtersRef, needsTarget: false },
  ];
  const compare = useCompare();
  const organizaciones = useOrganizacionesAdministradas();
  const { t } = useTranslation();

  // 403: el filtro de organización es de una que el usuario ya no administra.
  // Sin datos y con organización, lo más probable es que sus miembros aún no
  // hayan aceptado campañas que encajen con el resto de filtros
  const showCompareError = (e: unknown, ...sets: (CompareFilterType | undefined)[]) => {
    if (e instanceof ApiError && e.status === 403) return toast.error(t('compare.result.organizationForbidden'));
    const conOrganizacion = sets.some((f) => f?.organizacion);
    toast.error(t(conOrganizacion ? 'compare.result.insufficientOrganizationData' : 'compare.result.insufficientData'));
  };

  return (
    <div className="flex gap-5 w-full justify-center min-w-0 max-xl:flex-col">
      <CompareFilterCard
        name={t('compare.filters.reference')}
        required
        initialFilters={initialReferenciaFilters}
        organizaciones={organizaciones}
        onSubmit={async (data) => {
          const d = omitNullish(data!) as CompareFilterType;
          setFiltersRef(d);
          try {
            setResult(await compare.compare(d, filtersObj));
          } catch (e) {
            showCompareError(e, d, filtersObj);
          }
        }}
      />
      <div className="flex flex-col gap-2 max-w-full flex-3">
        {result && (
          <div className="flex gap-2 justify-end flex-wrap">
            {hasTargetSet(result) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  void (async () => {
                    try {
                      await compare.generateReport(filtersRef, filtersObj!);
                    } catch (e) {
                      showCompareError(e, filtersRef, filtersObj);
                    }
                  })();
                }}
              >
                {t('compare.actions.generateReport')}
              </button>
            )}

            <Dropdown triggerClassName="btn btn-accent" contentClassName="w-56" trigger={t('common.actions.export')}>
              <ul className="menu w-full p-0">
                {exportOptions
                  .filter((option) => !option.needsTarget || hasTargetSet(result))
                  .map(({ mode, titleKey, filePrefix, metadata }) => (
                    <Fragment key={mode}>
                      <li className="menu-title">{t(titleKey)}</li>
                      <li>
                        <button
                          type="button"
                          onClick={() => exportJSON({ metadata, result: buildCompareExportPayload(result, mode) })}
                        >
                          JSON
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => exportCSV(`${filePrefix}-${Date.now()}.csv`, buildCompareCSV(result, mode, t))}
                        >
                          CSV
                        </button>
                      </li>
                    </Fragment>
                  ))}
              </ul>
            </Dropdown>
          </div>
        )}
        <CompareResultCard result={result} />
      </div>

      <CompareFilterCard
        name={t('compare.filters.target')}
        initialFilters={initialObjetivoFilters}
        organizaciones={organizaciones}
        onSubmit={async (data) => {
          if (!data) return setFiltersObj(data);
          const d = omitNullish(data) as CompareFilterType;
          setFiltersObj(d);
          try {
            const result = await compare.compare(filtersRef, d);
            setResult(result);
          } catch (e) {
            showCompareError(e, filtersRef, d);
          }
        }}
      />
    </div>
  );
}
