import { EF_CATEGORIES } from 'common/impact';
import type { CategoryValues } from 'common/stats';
import { aggregateEvolucionByYear } from './evolucion-temporal.helpers';
import type { StatsRow } from './stats-rows.helpers';

function categorias(values: Partial<CategoryValues>): CategoryValues {
  const record = {} as CategoryValues;
  for (const cat of EF_CATEGORIES) record[cat.id] = values[cat.id] ?? 0;
  return record;
}

function makeRow(anio: number, climateChange?: number): StatsRow {
  return {
    idParcela: 'par-1',
    tipo: 'trigo',
    anio,
    superficie: 10,
    produccion: 1000,
    consumoAgua: 500,
    categorias:
      climateChange === undefined
        ? null
        : categorias({ climate_change: climateChange }),
    poblacion: null,
    provincia: null,
  };
}

describe('evolucion-temporal.helpers', () => {
  describe('aggregateEvolucionByYear', () => {
    it('returns one point per year sorted ascending', () => {
      const result = aggregateEvolucionByYear([
        makeRow(2024, 10),
        makeRow(2022, 30),
        makeRow(2023, 20),
      ]);

      expect(result.map((r) => r.anio)).toEqual([2022, 2023, 2024]);
    });

    it('counts every crop of the year but averages only those with impacts', () => {
      const [point] = aggregateEvolucionByYear([
        makeRow(2024, 10),
        makeRow(2024, 30),
        makeRow(2024),
      ]);

      expect(point.numCultivos).toBe(3);
      expect(point.categorias.climate_change).toBe(20);
    });

    it('skips years without impact results', () => {
      const result = aggregateEvolucionByYear([
        makeRow(2023),
        makeRow(2024, 5),
      ]);

      expect(result.map((r) => r.anio)).toEqual([2024]);
    });

    it('returns an empty list without rows', () => {
      expect(aggregateEvolucionByYear([])).toEqual([]);
    });
  });
});
