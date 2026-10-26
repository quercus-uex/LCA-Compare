import { EF_CATEGORIES } from 'common/impact';
import type { CategoryValues } from 'common/stats';
import { computeKpis } from './kpi.helpers';
import type { StatsRow } from './stats-rows.helpers';

function categorias(values: Partial<CategoryValues>): CategoryValues {
  const record = {} as CategoryValues;
  for (const cat of EF_CATEGORIES) record[cat.id] = values[cat.id] ?? 0;
  return record;
}

function makeRow(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    idParcela: 'par-1',
    tipo: 'trigo',
    anio: 2024,
    superficie: 10,
    produccion: 1000,
    consumoAgua: 500,
    categorias: null,
    poblacion: null,
    provincia: null,
    ...overrides,
  };
}

describe('kpi.helpers', () => {
  describe('computeKpis', () => {
    it('counts distinct plots, crops and area', () => {
      const kpis = computeKpis(
        [
          makeRow({ idParcela: 'a', superficie: 1.111 }),
          makeRow({ idParcela: 'a', superficie: 2.222 }),
          makeRow({ idParcela: 'b', superficie: 3.333 }),
        ],
        null,
      );

      expect(kpis.totalParcelas).toBe(2);
      expect(kpis.totalCultivos).toBe(3);
      expect(kpis.superficieTotal).toBe(6.67);
    });

    it('averages impacts only over crops with impact results', () => {
      const kpis = computeKpis(
        [
          makeRow({ categorias: categorias({ climate_change: 10 }) }),
          makeRow({ categorias: categorias({ climate_change: 30 }) }),
          makeRow(),
        ],
        null,
      );

      expect(kpis.cultivosConImpacto).toBe(2);
      expect(kpis.impactosPorCategoria.climate_change).toBe(20);
    });

    it('returns zero values for an empty selection', () => {
      const kpis = computeKpis([], null);

      expect(kpis).toMatchObject({
        totalParcelas: 0,
        totalCultivos: 0,
        cultivosConImpacto: 0,
        superficieTotal: 0,
        variacionInteranual: null,
      });
      expect(kpis.impactosPorCategoria.climate_change).toBe(0);
    });

    describe('variacionInteranual', () => {
      const current = [
        makeRow({
          categorias: categorias({ climate_change: 90, acidification: 3 }),
        }),
      ];

      it('is null without a selected year', () => {
        expect(computeKpis(current, null).variacionInteranual).toBeNull();
      });

      it('is null when the previous year has no impact results', () => {
        expect(
          computeKpis(current, [makeRow({ anio: 2023 })]).variacionInteranual,
        ).toBeNull();
      });

      it('is null when the selected year has no impact results', () => {
        const previous = [
          makeRow({
            anio: 2023,
            categorias: categorias({ climate_change: 1 }),
          }),
        ];
        expect(
          computeKpis([makeRow()], previous).variacionInteranual,
        ).toBeNull();
      });

      it('computes the change of every category, null where the previous mean is 0', () => {
        const previous = [
          makeRow({
            anio: 2023,
            categorias: categorias({ climate_change: 100, acidification: 0 }),
          }),
        ];

        const variacion = computeKpis(current, previous).variacionInteranual;

        expect(variacion?.climate_change).toBe(-10);
        expect(variacion?.acidification).toBeNull();
        expect(Object.keys(variacion ?? {})).toHaveLength(EF_CATEGORIES.length);
      });

      it('uses the absolute previous mean so negative impacts keep the sign of the change', () => {
        const previous = [
          makeRow({ anio: 2023, categorias: categorias({ land_use: -4 }) }),
        ];
        const rows = [makeRow({ categorias: categorias({ land_use: -2 }) })];

        expect(computeKpis(rows, previous).variacionInteranual?.land_use).toBe(
          50,
        );
      });

      it('rounds to one decimal', () => {
        const previous = [
          makeRow({
            anio: 2023,
            categorias: categorias({ climate_change: 3 }),
          }),
        ];
        const rows = [
          makeRow({ categorias: categorias({ climate_change: 4 }) }),
        ];

        expect(
          computeKpis(rows, previous).variacionInteranual?.climate_change,
        ).toBe(33.3);
      });
    });
  });
});
