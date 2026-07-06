import { aggregateEvolucionByYear } from './evolucion-temporal.helpers';
import { buildEfCategoryLookup } from '../stats-aggregation.helpers';
import type { ImpactoDatos } from '../stats-aggregation.helpers';
import type { CultivoWithFecha } from './stats.types';

function makeCultivo(
  year: number,
  idResultadoImpacto: string | null = 'ri-1',
): CultivoWithFecha {
  return {
    idResultadoImpacto,
    fechaInicioCampania: new Date(year, 5, 1),
  };
}

function makeImpactoMap(
  entries: Record<
    string,
    { impacto_total: Array<{ category: string; amount: number }> }
  >,
): Map<string, ImpactoDatos> {
  const map = new Map<string, ImpactoDatos>();
  for (const [id, datos] of Object.entries(entries)) {
    map.set(id, datos);
  }
  return map;
}

describe('evolucion-temporal.helpers', () => {
  const lookup = buildEfCategoryLookup();

  it('returns an empty array when there are no cultivos', () => {
    expect(aggregateEvolucionByYear([], new Map(), lookup)).toEqual([]);
  });

  it('groups cultivos by year and computes mean categories', () => {
    const cultivos = [
      makeCultivo(2023, 'ri-1'),
      makeCultivo(2024, 'ri-2'),
      makeCultivo(2024, 'ri-3'),
    ];
    const impactoMap = makeImpactoMap({
      'ri-1': { impacto_total: [{ category: 'Climate change', amount: 30 }] },
      'ri-2': { impacto_total: [{ category: 'Climate change', amount: 50 }] },
      'ri-3': { impacto_total: [{ category: 'Climate change', amount: 70 }] },
    });

    const result = aggregateEvolucionByYear(cultivos, impactoMap, lookup);

    expect(result).toHaveLength(2);
    expect(result[0].anio).toBe(2023);
    expect(result[0].numCultivos).toBe(1);
    expect(result[0].categorias.climate_change).toBe(30);
    expect(result[1].anio).toBe(2024);
    expect(result[1].numCultivos).toBe(2);
    expect(result[1].categorias.climate_change).toBe(60);
  });

  it('counts cultivos without impacto in numCultivos but excludes them from categorias', () => {
    const cultivos = [makeCultivo(2024, null), makeCultivo(2024, 'ri-2')];
    const impactoMap = makeImpactoMap({
      'ri-2': { impacto_total: [{ category: 'Climate change', amount: 80 }] },
    });

    const result = aggregateEvolucionByYear(cultivos, impactoMap, lookup);

    expect(result).toHaveLength(1);
    expect(result[0].numCultivos).toBe(2);
    expect(result[0].categorias.climate_change).toBe(80);
  });

  it('sorts results by year ascending', () => {
    const cultivos = [makeCultivo(2025), makeCultivo(2023), makeCultivo(2024)];
    const impactoMap = makeImpactoMap({
      'ri-1': { impacto_total: [{ category: 'Climate change', amount: 10 }] },
    });

    const result = aggregateEvolucionByYear(cultivos, impactoMap, lookup);
    expect(result.map((r) => r.anio)).toEqual([2023, 2024, 2025]);
  });
});
