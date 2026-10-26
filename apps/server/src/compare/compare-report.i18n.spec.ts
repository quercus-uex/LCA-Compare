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

    it('translates the eutrophication indicators in every report language', () => {
      expect(translateCategory('Eutrophication: marine', 'es')).toBe(
        'Eutrofización (marina)',
      );
      expect(translateCategory('Eutrophication: marine', 'en')).toBe(
        'Eutrophication, marine',
      );
      expect(translateCategory('Eutrophication: marine', 'pt')).toBe(
        'Eutrofização (marinha)',
      );
    });

    it('translates the human toxicity indicators with their own labels', () => {
      expect(translateCategory('Human toxicity: carcinogenic', 'es')).toBe(
        'Toxicidad humana (cancerígena)',
      );
      expect(translateCategory('Human toxicity: non-carcinogenic', 'en')).toBe(
        'Human toxicity, non-cancer',
      );
    });

    it('translates legacy Spanish category names', () => {
      expect(translateCategory('Uso de Agua', 'pt')).toBe('Uso da água');
    });

    it('returns unknown categories unchanged', () => {
      expect(translateCategory('Ozone depletion', 'es')).toBe(
        'Ozone depletion',
      );
    });
  });
});
