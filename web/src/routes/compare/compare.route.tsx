import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { useState } from 'react';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import { omitNullish } from '../../common/utils.ts';
import { CompareResultCard } from './compare-result-card.component.tsx';
import { toast } from 'sonner';

export const CompareRoute = () => {
  const [filtersRef, setFiltersRef] = useState<CompareFilterType>({});
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
            const d = omitNullish(data!);
            setFiltersRef(d);
            if (filtersObj) {
              const result = await compare.compare(d, filtersObj);
              if (!result.left || !result.right)
                return toast.error(
                  'No existen datos con los filtros proporcionados'
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
        <CompareResultCard result={result} />
        <CompareFilterCard
          name="Objetivo"
          onSubmit={async (data) => {
            if (!data) return setFiltersObj(data);
            const d = omitNullish(data);
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