import {
  getCategoryAmounts,
  meanCategories,
  sortByImpact,
  type CategoryAmountRecord,
} from './stats-aggregation.helpers';

describe('stats-aggregation.helpers', () => {
  describe('getCategoryAmounts', () => {
    it('maps known EF category names and omits categories missing from the result', () => {
      const datos = {
        impacto_total: [
          { category: 'Climate change', amount: 10, unit: 'kg CO2 eq' },
          { category: 'Acidification', amount: 5, unit: 'mol H+ eq' },
        ],
      };

      expect(getCategoryAmounts(datos)).toEqual({
        climate_change: 10,
        acidification: 5,
      });
    });

    it.each([
      // Las tres eutrofizaciones tienen unidades distintas: no se suman
      ['Eutrophication: freshwater', 'eutrophication_freshwater'],
      ['Eutrophication: marine', 'eutrophication_marine'],
      ['Eutrophication: terrestrial', 'eutrophication_terrestrial'],
      ['Eutrophication, freshwater', 'eutrophication_freshwater'],
      ['Eutrophication freshwater', 'eutrophication_freshwater'],
      ['Particulate matter', 'particulate_matter'],
      ['Particulate matter formation', 'particulate_matter'],
      ['Ecotoxicity freshwater', 'ecotoxicity'],
      ['Human toxicity cancer', 'human_toxicity_cancer'],
      ['Human toxicity, non-cancer', 'human_toxicity_non_cancer'],
      ['Human toxicity: non-carcinogenic', 'human_toxicity_non_cancer'],
      ['  climate CHANGE  ', 'climate_change'],
      ['WATER USE', 'water_use'],
    ] as const)('recognises the openLCA spelling %p as %p', (category, id) => {
      expect(
        getCategoryAmounts({ impacto_total: [{ category, amount: 1 }] }),
      ).toEqual({ [id]: 1 });
    });

    it('does not count sub-indicators as their parent category', () => {
      const datos = {
        impacto_total: [
          { category: 'Human toxicity, cancer', amount: 3 },
          { category: 'Human toxicity, cancer (organics)', amount: 1 },
          { category: 'Climate change (fossil)', amount: 9 },
        ],
      };

      expect(getCategoryAmounts(datos)).toEqual({ human_toxicity_cancer: 3 });
    });

    it('skips non-finite amounts and sums a repeated category', () => {
      const datos = {
        impacto_total: [
          { category: 'Climate change', amount: 2 },
          { category: 'Climate change', amount: 3 },
          { category: 'Acidification', amount: Number.NaN },
          { category: 'Water use', amount: Number.POSITIVE_INFINITY },
        ],
      };

      expect(getCategoryAmounts(datos)).toEqual({ climate_change: 5 });
    });

    it('returns no amounts for null, undefined, or missing impacto_total', () => {
      expect(getCategoryAmounts(null)).toEqual({});
      expect(getCategoryAmounts(undefined)).toEqual({});
      expect(getCategoryAmounts({})).toEqual({});
    });
  });

  describe('meanCategories', () => {
    it('averages each category only over the records that have it', () => {
      const result = meanCategories([
        { climate_change: 10, acidification: 6 },
        { climate_change: 30 },
      ]);

      expect(result.climate_change).toBe(20);
      expect(result.acidification).toBe(6);
    });

    it('returns zero amounts for empty records', () => {
      const result = meanCategories([]);

      expect(result.climate_change).toBe(0);
      expect(result.acidification).toBe(0);
    });
  });

  describe('sortByImpact', () => {
    const items = [
      {
        impactosPorCategoria: {
          climate_change: 100,
          acidification: 10,
        } as unknown as CategoryAmountRecord,
      },
      {
        impactosPorCategoria: {
          climate_change: 50,
          // Con el total (250) quedaría la última
          acidification: 200,
        } as unknown as CategoryAmountRecord,
      },
      {
        impactosPorCategoria: {
          climate_change: 75,
          acidification: 15,
        } as unknown as CategoryAmountRecord,
      },
    ];

    it('sorts by climate change, never by a cross-unit total', () => {
      const result = sortByImpact([...items]);

      expect(result.map((i) => i.impactosPorCategoria.climate_change)).toEqual([
        50, 75, 100,
      ]);
    });
  });
});
