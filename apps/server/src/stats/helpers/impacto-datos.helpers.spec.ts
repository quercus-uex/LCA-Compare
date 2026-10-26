import { parseImpactoDatos } from './impacto-datos.helpers';

describe('impacto-datos.helpers', () => {
  describe('parseImpactoDatos', () => {
    it('keeps a well-formed datos object with impacto_total', () => {
      const datos = {
        impacto_total: [
          { category: 'Climate change', amount: 42, unit: 'kg CO2 eq' },
        ],
      };
      expect(parseImpactoDatos(datos)).toEqual(datos);
    });

    it('keeps null and undefined as they are', () => {
      expect(parseImpactoDatos(null)).toBeNull();
      expect(parseImpactoDatos(undefined)).toBeUndefined();
    });

    it('returns null for primitives and arrays', () => {
      expect(parseImpactoDatos(42)).toBeNull();
      expect(parseImpactoDatos([1, 2])).toBeNull();
    });

    it('returns null when impacto_total contains invalid items', () => {
      expect(
        parseImpactoDatos({
          impacto_total: [{ category: 'X' }, { amount: 1 }],
        }),
      ).toBeNull();
    });

    it('keeps datos when the impacto_total key is absent', () => {
      expect(parseImpactoDatos({ other: 1 })).toEqual({ other: 1 });
    });
  });
});
