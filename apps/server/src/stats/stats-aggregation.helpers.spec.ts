import {
  collectImpactoIds,
  normalizeCategoryName,
  buildEfCategoryLookup,
  getCategoryAmounts,
  sumCategories,
  meanCategories,
  sortByImpact,
  type CategoryAmountRecord,
} from './stats-aggregation.helpers';

describe('stats-aggregation.helpers', () => {
  describe('collectImpactoIds', () => {
    it('returns unique non-null impact ids', () => {
      const cultivos = [
        { idResultadoImpacto: 'a' },
        { idResultadoImpacto: 'b' },
        { idResultadoImpacto: 'a' },
        { idResultadoImpacto: null },
        { idResultadoImpacto: 'b' },
      ];

      const result = collectImpactoIds(cultivos);

      expect(result).toEqual(['a', 'b']);
    });

    it('returns empty array when all ids are null', () => {
      const cultivos = [
        { idResultadoImpacto: null },
        { idResultadoImpacto: null },
      ];

      expect(collectImpactoIds(cultivos)).toEqual([]);
    });
  });

  describe('normalizeCategoryName', () => {
    it('trims whitespace and lowercases', () => {
      expect(normalizeCategoryName('  Climate Change  ')).toBe(
        'climate change',
      );
      expect(normalizeCategoryName('ACIDIFICATION')).toBe('acidification');
    });
  });

  describe('buildEfCategoryLookup', () => {
    it('maps normalized english names to category ids', () => {
      const lookup = buildEfCategoryLookup();

      expect(lookup.get('climate change')).toBe('climate_change');
      expect(lookup.get('acidification')).toBe('acidification');
      expect(lookup.get('eutrophication: freshwater')).toBe(
        'eutrophication_freshwater',
      );
      expect(lookup.get('eutrophication: marine')).toBe(
        'eutrophication_marine',
      );
      expect(lookup.get('eutrophication: terrestrial')).toBe(
        'eutrophication_terrestrial',
      );
      expect(lookup.get('water use')).toBe('water_use');
    });
  });

  describe('getCategoryAmounts', () => {
    it('keeps the three eutrophication indicators separate instead of summing their different units', () => {
      const datos = {
        impacto_total: [
          {
            category: 'Eutrophication: freshwater',
            amount: 0.5,
            unit: 'kg P eq',
          },
          { category: 'Eutrophication: marine', amount: 2, unit: 'kg N eq' },
          {
            category: 'Eutrophication: terrestrial',
            amount: 7,
            unit: 'mol N eq',
          },
        ],
      };

      const result = getCategoryAmounts(datos);

      expect(result.eutrophication_freshwater).toBe(0.5);
      expect(result.eutrophication_marine).toBe(2);
      expect(result.eutrophication_terrestrial).toBe(7);
      expect(result).not.toHaveProperty('eutrophication');
    });

    it('maps known EF category names to amounts', () => {
      const datos = {
        impacto_total: [
          { category: 'Climate change', amount: 10, unit: 'kg CO2 eq' },
          { category: 'Acidification', amount: 5, unit: 'mol H+ eq' },
        ],
      };

      const result = getCategoryAmounts(datos);

      expect(result.climate_change).toBe(10);
      expect(result.acidification).toBe(5);
      expect(result.water_use).toBe(0);
    });

    it('handles differing casing and whitespace', () => {
      const datos = {
        impacto_total: [
          { category: '  climate CHANGE  ', amount: 7 },
          { category: 'WATER USE', amount: 3 },
        ],
      };

      const result = getCategoryAmounts(datos);

      expect(result.climate_change).toBe(7);
      expect(result.water_use).toBe(3);
    });

    it('returns zero amounts for null, undefined, or missing impacto_total', () => {
      const lookup = buildEfCategoryLookup();
      const empty = getCategoryAmounts({ impacto_total: [] }, lookup);

      expect(getCategoryAmounts(null, lookup)).toEqual(empty);
      expect(getCategoryAmounts(undefined, lookup)).toEqual(empty);
      expect(getCategoryAmounts({}, lookup)).toEqual(empty);
    });
  });

  describe('sumCategories', () => {
    it('returns per-category sums', () => {
      const records = [
        {
          climate_change: 10,
          acidification: 5,
        } as unknown as CategoryAmountRecord,
        {
          climate_change: 20,
          acidification: 15,
        } as unknown as CategoryAmountRecord,
      ];

      const result = sumCategories(records);

      expect(result.climate_change).toBe(30);
      expect(result.acidification).toBe(20);
    });
  });

  describe('meanCategories', () => {
    it('returns per-category arithmetic means', () => {
      const records = [
        {
          climate_change: 10,
          acidification: 20,
        } as unknown as CategoryAmountRecord,
        {
          climate_change: 30,
          acidification: 40,
        } as unknown as CategoryAmountRecord,
      ];

      const result = meanCategories(records);

      expect(result.climate_change).toBe(20);
      expect(result.acidification).toBe(30);
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
          acidification: 20,
        } as unknown as CategoryAmountRecord,
      },
      {
        impactosPorCategoria: {
          climate_change: 75,
          acidification: 15,
        } as unknown as CategoryAmountRecord,
      },
    ];

    it('sorts by climate change when no category is provided, never by a cross-unit total', () => {
      const result = sortByImpact([...items]);

      expect(result.map((i) => i.impactosPorCategoria.climate_change)).toEqual([
        50, 75, 100,
      ]);
    });

    it('sorts by specific category amount when category is provided', () => {
      const result = sortByImpact([...items], 'acidification');

      expect(result.map((i) => i.impactosPorCategoria.acidification)).toEqual([
        10, 15, 20,
      ]);
    });
  });
});
