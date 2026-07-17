import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { useState } from 'react';
import { useLocation } from 'react-router';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import { exportJSON, exportCSV, omitNullish } from '../../common/utils.ts';
import { CompareResultCard } from './compare-result-card.component.tsx';
import { buildCompareCSV, buildCompareExportPayload } from './compare-export.utils.ts';
import type { Parcela } from '../../hooks/parcela.hook.tsx';
import type { Poblacion, Provincia } from '../../hooks/location.hook.tsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  const compare = useCompare();
  const { t } = useTranslation();

  return (
    <div className="flex gap-5 w-full justify-center min-w-0 max-xl:flex-col">
      <CompareFilterCard
        name={t('compare.filters.reference')}
        required
        initialFilters={initialReferenciaFilters}
        onSubmit={async (data) => {
          const d = omitNullish(data!) as CompareFilterType;
          setFiltersRef(d);
          try {
            const result = filtersObj
              ? await compare.compare(d, filtersObj)
              : await compare.compareSingle(d);
            setResult(result);
          } catch {
            toast.error(t('compare.result.insufficientData'));
          }
        }}
      />
      <div className="flex flex-col gap-2 max-w-full flex-3">
        {result && (
          <div className="flex gap-2 justify-end flex-wrap">
            {result.impacto_total[0].tarAmount && (
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await compare.generateReport(filtersRef, filtersObj!);
                  } catch {
                    toast.error(t('compare.result.insufficientData'));
                  }
                }}
              >
                {t('compare.actions.generateReport')}
              </button>
            )}

            <div className="dropdown dropdown-end">
              <button
                type="button"
                className="btn btn-accent"
                tabIndex={0}
              >
                {t('common.actions.export')}
              </button>
              <ul
                tabIndex={-1}
                className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-56 p-2 shadow-sm"
              >
                {result.impacto_total[0].tarAmount && (
                  <>
                    <li className="menu-title">{t('compare.actions.exportComparison')}</li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          exportJSON({
                            metadata: {
                              reference: filtersRef,
                              target: filtersObj,
                            },
                            result: buildCompareExportPayload(result, 'full'),
                          })
                        }
                      >
                        JSON
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          exportCSV(
                            `comparativa-${Date.now()}.csv`,
                            buildCompareCSV(result, 'full', t),
                          )
                        }
                      >
                        CSV
                      </button>
                    </li>
                  </>
                )}
                {result.impacto_total[0].tarAmount && (
                  <>
                    <li className="menu-title">{t('compare.actions.exportTarget')}</li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          exportJSON({
                            metadata: filtersObj,
                            result: buildCompareExportPayload(result, 'target'),
                          })
                        }
                      >
                        JSON
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          exportCSV(
                            `objetivo-${Date.now()}.csv`,
                            buildCompareCSV(result, 'target', t),
                          )
                        }
                      >
                        CSV
                      </button>
                    </li>
                  </>
                )}
                <li className="menu-title">{t('compare.actions.exportReference')}</li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      exportJSON({
                        metadata: filtersRef,
                        result: buildCompareExportPayload(result, 'reference'),
                      })
                    }
                  >
                    JSON
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      exportCSV(
                        `referencia-${Date.now()}.csv`,
                        buildCompareCSV(result, 'reference', t),
                      )
                    }
                  >
                    CSV
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
        <CompareResultCard result={result} />
      </div>

      <CompareFilterCard
        name={t('compare.filters.target')}
        initialFilters={initialObjetivoFilters}
        onSubmit={async (data) => {
          if (!data) return setFiltersObj(data);
          const d = omitNullish(data) as CompareFilterType;
          setFiltersObj(d);
          try {
            const result = await compare.compare(filtersRef, d);
            setResult(result);
          } catch {
            toast.error(t('compare.result.insufficientData'));
          }
        }}
      />
    </div>
  );
}
