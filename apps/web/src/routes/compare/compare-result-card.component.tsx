import type { CompareResult } from '../../hooks/compare.hook.tsx';
import { ResultComparisonTable } from '../../components/result-comparison-table.component.tsx';
import { useState } from 'react';

export const CompareResultCard = ({ result }: { result?: CompareResult }) => {
  const [impact, setImpact] = useState<
    'impacto_total' | 'impacto_pesticidas' | 'impacto_sistema_riego' | 'impacto_fertilizantes' | 'impacto_manejo_cultivo'
  >('impacto_total');

  if (!result) return (
    <div className="card bg-base-100">
      <div className="card-body">
        <p>Aquí aparecerá el resultado de la comparativa</p>
      </div>
    </div>
  );

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <div className="flex w-full justify-between">
          <h2 className="card-title text-xl">Resultado</h2>
        </div>
        <div className="tabs tabs-box w-fit">
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label="Total"
            defaultChecked
            onClick={() => setImpact('impacto_total')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label="Pesticidas"
            onClick={() => setImpact('impacto_pesticidas')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label="Fertilizantes"
            onClick={() => setImpact('impacto_fertilizantes')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label="Sistema de riego"
            onClick={() => setImpact('impacto_sistema_riego')}
          />
          <input
            type="radio"
            name="impact"
            className="tab"
            aria-label="Manejo de cultivo"
            onClick={() => setImpact('impacto_manejo_cultivo')}
          />
        </div>
        <ResultComparisonTable
          result={result}
          selectedImpact={impact}
        />
      </div>
    </div>
  );
}