import { EF_CATEGORIES } from 'common/impact';
import { computeKpis } from './kpi.helpers';
import type { StatsRow } from './stats-rows.helpers';

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
          makeRow({ categorias: { climate_change: 10 } }),
          makeRow({ categorias: { climate_change: 30 } }),
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
      // Tres parcelas, el mínimo para calcular la variación
      const PARCELAS = ['a', 'b', 'c'];
      const rowsOf = (
        anio: number,
        categorias: StatsRow['categorias'],
        parcelas = PARCELAS,
      ) =>
        parcelas.map((idParcela) => makeRow({ idParcela, anio, categorias }));

      const current = rowsOf(2024, { climate_change: 90, acidification: 3 });

      it('is null without a selected year', () => {
        const kpis = computeKpis(current, null);
        expect(kpis.variacionInteranual).toBeNull();
        expect(kpis.parcelasComparables).toBeNull();
      });

      it('is null when the previous year has no impact results', () => {
        const kpis = computeKpis(current, rowsOf(2023, null));
        expect(kpis.variacionInteranual).toBeNull();
        expect(kpis.parcelasComparables).toBe(0);
      });

      it('is null when the selected year has no impact results', () => {
        expect(
          computeKpis(rowsOf(2024, null), rowsOf(2023, { climate_change: 1 }))
            .variacionInteranual,
        ).toBeNull();
      });

      it('computes the change of every category, null where the previous mean is 0', () => {
        const previous = rowsOf(2023, {
          climate_change: 100,
          acidification: 0,
        });

        const kpis = computeKpis(current, previous);
        const variacion = kpis.variacionInteranual;

        expect(kpis.parcelasComparables).toBe(3);
        expect(variacion?.climate_change).toBe(-10);
        expect(variacion?.acidification).toBeNull();
        expect(Object.keys(variacion ?? {})).toHaveLength(EF_CATEGORIES.length);
      });

      it('compares only the plots with results in both years', () => {
        const previous = [
          ...rowsOf(2023, { climate_change: 100 }),
          // Solo estuvo el año anterior: no debe influir
          makeRow({
            idParcela: 'z',
            anio: 2023,
            categorias: { climate_change: 1000 },
          }),
        ];
        const rows = [
          ...current,
          // Solo está este año: tampoco
          makeRow({ idParcela: 'y', categorias: { climate_change: 1 } }),
        ];

        const kpis = computeKpis(rows, previous);

        expect(kpis.parcelasComparables).toBe(3);
        expect(kpis.variacionInteranual?.climate_change).toBe(-10);
      });

      it('is null below the minimum number of comparable plots', () => {
        const previous = rowsOf(2023, { climate_change: 100 }, ['a', 'b']);

        const kpis = computeKpis(current, previous);

        expect(kpis.parcelasComparables).toBe(2);
        expect(kpis.variacionInteranual).toBeNull();
      });

      it('is null for a category missing this year instead of a 100 % drop', () => {
        const previous = rowsOf(2023, { climate_change: 100, water_use: 5 });

        expect(
          computeKpis(current, previous).variacionInteranual?.water_use,
        ).toBeNull();
      });

      it('uses the absolute previous mean so negative impacts keep the sign of the change', () => {
        const previous = rowsOf(2023, { land_use: -4 });
        const rows = rowsOf(2024, { land_use: -2 });

        expect(computeKpis(rows, previous).variacionInteranual?.land_use).toBe(
          50,
        );
      });

      it('rounds to one decimal', () => {
        const previous = rowsOf(2023, { climate_change: 3 });
        const rows = rowsOf(2024, { climate_change: 4 });

        expect(
          computeKpis(rows, previous).variacionInteranual?.climate_change,
        ).toBe(33.3);
      });
    });
  });
});
