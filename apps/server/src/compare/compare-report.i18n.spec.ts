import {
  COMPARE_REPORT_LANGUAGES,
  translateCategory,
} from './compare-report.i18n';

describe('compare report i18n', () => {
  describe('translateCategory', () => {
    const indicatorGroups = [
      [
        'Eutrophication: freshwater',
        'Eutrophication: marine',
        'Eutrophication: terrestrial',
      ],
      ['Human toxicity: carcinogenic', 'Human toxicity: non-carcinogenic'],
    ];

    it.each(COMPARE_REPORT_LANGUAGES)(
      'gives each eutrophication and human toxicity indicator a distinct label in %s',
      (language) => {
        for (const names of indicatorGroups) {
          const labels = names.map((name) => translateCategory(name, language));

          expect(new Set(labels).size).toBe(names.length);
        }
      },
    );

    it.each([
      ['Eutrophication: marine', 'es', 'Eutrofización (marina)'],
      ['Eutrophication: marine', 'en', 'Eutrophication, marine'],
      ['Eutrophication: marine', 'pt', 'Eutrofização (marinha)'],
      ['Human toxicity: carcinogenic', 'es', 'Toxicidad humana (cancerígena)'],
      ['Human toxicity: non-carcinogenic', 'en', 'Human toxicity, non-cancer'],
      // Legacy Spanish category name
      ['Uso de Agua', 'pt', 'Uso da água'],
      // Unknown categories are returned unchanged
      ['Ozone depletion', 'es', 'Ozone depletion'],
    ] as const)('translates %s in %s as %s', (name, language, expected) => {
      expect(translateCategory(name, language)).toBe(expected);
    });
  });
});
