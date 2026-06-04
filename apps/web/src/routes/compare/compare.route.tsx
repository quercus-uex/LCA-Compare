import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { useState } from 'react';
import { useLocation } from 'react-router';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import { exportJSON, omitNullish } from '../../common/utils.ts';
import { CompareResultCard } from './compare-result-card.component.tsx';
import type { Parcela } from '../../hooks/parcela.hook.tsx';
import type { Poblacion, Provincia } from '../../hooks/location.hook.tsx';

type CompareRouteState = {
  parcelaObjetivo?: Parcela;
  provinciaReferencia?: Provincia;
  poblacionReferencia?: Poblacion;
};

export const CompareRoute = () => {
  const location = useLocation();
  const state = location.state as CompareRouteState | null;
  const parcelaObjetivo = state?.parcelaObjetivo;
  const provinciaReferencia = state?.provinciaReferencia;
  const poblacionReferencia = state?.poblacionReferencia;
  const initialReferenciaFilters: CompareFilterType = {
    parcelas: [],
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

  return (
    <div className="flex gap-5 w-full justify-center min-w-0 max-xl:flex-col">
      <CompareFilterCard
        name="Referencia"
        required
        initialFilters={initialReferenciaFilters}
        onSubmit={async (data) => {
          const d = omitNullish(data!) as CompareFilterType;
          setFiltersRef(d);
          if (filtersObj) {
            const result = await compare.compare(d, filtersObj);
            setResult(result);
          } else {
            const result = await compare.compareSingle(d);
            setResult(result);
          }
        }}
      />
      <div className="flex flex-col gap-2 max-w-full flex-3">
        {result && (
          <div className="flex gap-2 justify-end flex-wrap">
            {result.impacto_total[0].tarAmount && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    await compare.generateReport(filtersRef, filtersObj!);
                  }}
                >
                  Generar informe
                </button>

                <button
                  className="btn btn-accent"
                  onClick={() =>
                    exportJSON({
                      metadata: {
                        reference: filtersRef,
                        target: filtersObj,
                      },
                      result,
                    })
                  }
                >
                  Exportar comparativa
                </button>
              </>
            )}
            {result.impacto_total[0].tarAmount && (
              <button
                className="btn btn-accent"
                onClick={() =>
                  exportJSON({
                    metadata: filtersObj,
                    result: {
                      impacto_total: result?.impacto_total.map((i) => ({
                        unit: i.unit,
                        category: i.category,
                        amount: i.tarAmount,
                      })),
                      impacto_fertilizantes: result?.impacto_fertilizantes.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.tarAmount,
                        }),
                      ),
                      impacto_sistema_riego: result?.impacto_sistema_riego.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.tarAmount,
                        }),
                      ),
                      impacto_pesticidas: result?.impacto_pesticidas.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.tarAmount,
                        }),
                      ),
                      impacto_manejo_cultivo:
                        result?.impacto_manejo_cultivo.map((i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.tarAmount,
                        })),
                    },
                  })
                }
              >
                Exportar objetivo
              </button>
            )}
            {result && (
              <button
                className="btn btn-accent"
                onClick={() =>
                  exportJSON({
                    metadata: filtersRef,
                    result: {
                      impacto_total: result?.impacto_total.map((i) => ({
                        unit: i.unit,
                        category: i.category,
                        amount: i.refAmount,
                      })),
                      impacto_fertilizantes: result?.impacto_fertilizantes.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.refAmount,
                        }),
                      ),
                      impacto_sistema_riego: result?.impacto_sistema_riego.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.refAmount,
                        }),
                      ),
                      impacto_pesticidas: result?.impacto_pesticidas.map(
                        (i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.refAmount,
                        }),
                      ),
                      impacto_manejo_cultivo:
                        result?.impacto_manejo_cultivo.map((i) => ({
                          unit: i.unit,
                          category: i.category,
                          amount: i.refAmount,
                        })),
                    },
                  })
                }
              >
                Exportar objetivo
              </button>
            )}
          </div>
        )}
        <CompareResultCard result={result} />
      </div>

      <CompareFilterCard
        name="Objetivo"
        initialFilters={initialObjetivoFilters}
        onSubmit={async (data) => {
          if (!data) return setFiltersObj(data);
          const d = omitNullish(data) as CompareFilterType;
          setFiltersObj(d);
          const result = await compare.compare(filtersRef, d);
          setResult(result);
        }}
      />
    </div>
  );
}
