import { computeKpiSummary } from './kpi.helpers';
import {
  EMPTY_CATEGORY_RECORD,
  type CategoryAmountRecord,
} from '../stats-aggregation.helpers';
import type { CultivoWithGeo } from './stats.types';

function makeCultivo(overrides?: Partial<CultivoWithGeo>): CultivoWithGeo {
  return {
    id: 'c1',
    superficieCultivada: 10,
    produccion: 100,
    consumoAgua: 50,
    ciclo: 1,
    tipo: 'trigo',
    idParcela: 'par-1',
    idResultadoImpacto: 'ri-1',
    fechaInicioCampania: new Date('2024-01-01'),
    parcela: {
      id: 'par-1',
      sigpac: null,
      refCat: null,
      ptIdParcela: null,
      nombre: 'P',
      idPropietario: 'u1',
      idPoblacion: 'pop-1',
      cultivos: [],
      geom: null,
      poblacion: null,
    },
    ...overrides,
  } as unknown as CultivoWithGeo;
}

const emptyCategoryRecord: CategoryAmountRecord = { ...EMPTY_CATEGORY_RECORD };

describe('kpi.helpers', () => {
  it('returns zero KPIs for empty cultivos', () => {
    const result = computeKpiSummary([], new Map());
    expect(result.totalCultivos).toBe(0);
    expect(result.totalParcelas).toBe(0);
    expect(result.superficieTotal).toBe(0);
  });

  it('counts unique parcelas and total cultivos', () => {
    const c1 = makeCultivo({ id: 'c1', idParcela: 'par-1' });
    const c2 = makeCultivo({ id: 'c2', idParcela: 'par-1' });
    const c3 = makeCultivo({ id: 'c3', idParcela: 'par-2' });

    const result = computeKpiSummary([c1, c2, c3], new Map());
    expect(result.totalCultivos).toBe(3);
    expect(result.totalParcelas).toBe(2);
  });

  it('sums superficieCultivada', () => {
    const c1 = makeCultivo({ superficieCultivada: 10.5 });
    const c2 = makeCultivo({ superficieCultivada: 20.3 });

    const result = computeKpiSummary([c1, c2], new Map());
    expect(result.superficieTotal).toBe(30.8);
  });

  it('computes mean impactos from categoryMap', () => {
    const c1 = makeCultivo({ idResultadoImpacto: 'ri-1' });
    const c2 = makeCultivo({ idResultadoImpacto: 'ri-2' });

    const map = new Map<string, CategoryAmountRecord>([
      ['ri-1', { ...emptyCategoryRecord, climate_change: 40 }],
      ['ri-2', { ...emptyCategoryRecord, climate_change: 60 }],
    ]);

    const result = computeKpiSummary([c1, c2], map);
    expect(result.impactosPorCategoria.climate_change).toBe(50);
  });

  it('ignores cultivos whose idResultadoImpacto is not in the map', () => {
    const c1 = makeCultivo({ idResultadoImpacto: 'ri-1' });
    const c2 = makeCultivo({ idResultadoImpacto: null });

    const map = new Map<string, CategoryAmountRecord>([
      ['ri-1', { ...emptyCategoryRecord, climate_change: 40 }],
    ]);

    const result = computeKpiSummary([c1, c2], map);
    expect(result.impactosPorCategoria.climate_change).toBe(40);
  });
});
