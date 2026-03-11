import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { useState } from 'react';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import { exportJSON, omitNullish } from '../../common/utils.ts';
import { CompareResultCard } from './compare-result-card.component.tsx';
import { toast } from 'sonner';

export const CompareRoute = () => {
  const [filtersRef, setFiltersRef] = useState<CompareFilterType>({
    parcelas: [],
    provincias: [],
    poblaciones: [],
  });
  const [filtersObj, setFiltersObj] = useState<CompareFilterType | undefined>();
  const [result, setResult] = useState<CompareResult | undefined>();
  const compare = useCompare();

  return (
    <div className="flex flex-col gap-5 w-full justify-center items-center">
      <div className="flex gap-5 w-full justify-center min-w-0">
        <CompareFilterCard
          name="Referencia"
          required
          onSubmit={async (data) => {
            const d = omitNullish(data!) as CompareFilterType;
            setFiltersRef(d);
            if (filtersObj) {
              const result = await compare.compare(d, filtersObj);
              if (!result.left || !result.right)
                return toast.error(
                  'No existen datos con los filtros proporcionados',
                );
              setResult(result);
            } else {
              const result = await compare.compareSingle(d);
              if (!result.left)
                return toast.error(
                  'No existen datos con los filtros proporcionados',
                );
              setResult(result);
            }
          }}
        />
        <div className="flex flex-col gap-2 grow">
          {result && (
            <div className="flex gap-2 justify-end">
              {result.right && result.left && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {await compare.generateReport(filtersRef, filtersObj!)}}
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
              {result.left && (
                <button
                  className="btn btn-accent"
                  onClick={() =>
                    exportJSON({
                      metadata: filtersRef,
                      result: result.left!,
                    })
                  }
                >
                  Exportar referencia
                </button>
              )}
              {result.right && (
                <button
                  className="btn btn-accent"
                  onClick={() =>
                    exportJSON({
                      metadata: filtersObj,
                      result: result.right!,
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
          onSubmit={async (data) => {
            if (!data) return setFiltersObj(data);
            const d = omitNullish(data) as CompareFilterType;
            setFiltersObj(d);
            const result = await compare.compare(filtersRef, d);
            if (!result.left || !result.right)
              return toast.error(
                'No existen datos con los filtros proporcionados',
              );
            setResult(result);
          }}
        />
      </div>
    </div>
  );
}