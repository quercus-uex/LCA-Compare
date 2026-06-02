import { EF_CATEGORIES } from '../compare/compare.types';
import {
  buildCampaignYearFilter,
  buildEfCategoryLookup,
  collectImpactoIds,
  getCategoryAmounts,
  meanCategories,
  sortByImpact,
  totalImpact,
  type CategoryAmountRecord,
} from './stats-aggregation.helpers';

const zeroRecord = (): CategoryAmountRecord =>
  EF_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, {} as CategoryAmountRecord);

describe('stats aggregation helpers', () => {
  it('should build campaign year range filters', () => {
    expect(buildCampaignYearFilter(2024)).toEqual({
      fechaInicioCampania: {
        gte: new Date('2024-01-01T00:00:00.000Z'),
        lt: new Date('2025-01-01T00:00:00.000Z'),
      },
    });
    expect(buildCampaignYearFilter()).toEqual({});
  });

  it('should collect unique non-null impact ids', () => {
    expect(
      collectImpactoIds([
        { idResultadoImpacto: 'impact-1' },
        { idResultadoImpacto: null },
        { idResultadoImpacto: 'impact-1' },
        { idResultadoImpacto: 'impact-2' },
      ]),
    ).toEqual(['impact-1', 'impact-2']);
  });

  it('should normalize category names into EF category ids', () => {
    const lookup = buildEfCategoryLookup();

    expect(lookup.get('climate change')).toBe('climate_change');
    expect(lookup.get('eutrophication: marine')).toBe('eutrophication');
    expect(lookup.get('human toxicity: non-carcinogenic')).toBe(
      'human_toxicity',
    );
  });

  it('should extract category amounts with whitespace and case normalization', () => {
    const amounts = getCategoryAmounts({
      impacto_total: [
        { category: ' climate CHANGE ', amount: 12, unit: 'kg CO2 eq' },
        { category: 'Eutrophication: freshwater', amount: 3, unit: 'x' },
        { category: 'eutrophication: MARINE', amount: 4, unit: 'x' },
      ],
    });

    expect(amounts.climate_change).toBe(12);
    expect(amounts.eutrophication).toBe(7);
  });

  it('should zero-fill missing categories and zero records', () => {
    const amounts = getCategoryAmounts({
      impacto_total: [
        { category: 'Climate change', amount: 12, unit: 'kg CO2 eq' },
      ],
    });
    const means = meanCategories([]);

    expect(amounts.water_use).toBe(0);
    for (const category of EF_CATEGORIES) {
      expect(means[category.id]).toBe(0);
    }
  });

  it('should compute category means and total impact', () => {
    const one = zeroRecord();
    const two = zeroRecord();
    one.climate_change = 10;
    one.water_use = 20;
    two.climate_change = 30;
    two.water_use = 40;

    const mean = meanCategories([one, two]);

    expect(mean.climate_change).toBe(20);
    expect(mean.water_use).toBe(30);
    expect(totalImpact(mean)).toBe(50);
  });

  it('should sort rankings by selected category or total impact', () => {
    const low = zeroRecord();
    const high = zeroRecord();
    low.water_use = 20;
    high.water_use = 5;

    const ranking = [
      { id: 'total-low', impactoTotalMedio: 10, impactosPorCategoria: low },
      { id: 'total-high', impactoTotalMedio: 30, impactosPorCategoria: high },
    ];

    expect(sortByImpact(ranking).map((item) => item.id)).toEqual([
      'total-low',
      'total-high',
    ]);
    expect(sortByImpact(ranking, 'water_use').map((item) => item.id)).toEqual([
      'total-high',
      'total-low',
    ]);
  });
});
