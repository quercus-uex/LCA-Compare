import {
  parseImpactoRecord,
  parseImpactoRecords,
} from './impacto-record.helpers';

function makePrismaResult(datos: unknown): { id: string; datos: unknown } {
  return { id: 'ri-1', datos };
}

describe('impacto-record.helpers', () => {
  describe('parseImpactoRecord', () => {
    it('parses a well-formed datos object with impacto_total', () => {
      const r = makePrismaResult({
        impacto_total: [
          { category: 'Climate change', amount: 42, unit: 'kg CO2 eq' },
        ],
      });
      const parsed = parseImpactoRecord(r as any);
      expect(parsed.id).toBe('ri-1');
      expect(parsed.datos).toEqual({
        impacto_total: [
          { category: 'Climate change', amount: 42, unit: 'kg CO2 eq' },
        ],
      });
    });

    it('returns null datos when datos is null', () => {
      const parsed = parseImpactoRecord(makePrismaResult(null) as any);
      expect(parsed.datos).toBeNull();
    });

    it('returns undefined datos when datos is undefined', () => {
      const parsed = parseImpactoRecord(makePrismaResult(undefined) as any);
      expect(parsed.datos).toBeUndefined();
    });

    it('returns null datos when datos is a primitive', () => {
      const parsed = parseImpactoRecord(makePrismaResult(42) as any);
      expect(parsed.datos).toBeNull();
    });

    it('returns null datos when impacto_total contains invalid items', () => {
      const parsed = parseImpactoRecord(
        makePrismaResult({
          impacto_total: [{ category: 'X' }, { amount: 1 }],
        }) as any,
      );
      expect(parsed.datos).toBeNull();
    });

    it('preserves datos when impacto_total key is absent', () => {
      const parsed = parseImpactoRecord(makePrismaResult({ other: 1 }) as any);
      expect(parsed.datos).toEqual({ other: 1 });
    });
  });

  describe('parseImpactoRecords', () => {
    it('maps an array of Prisma results to ImpactoRecord[]', () => {
      const rs = [
        makePrismaResult({
          impacto_total: [{ category: 'A', amount: 1 }],
        }),
        makePrismaResult(null),
      ];
      const parsed = parseImpactoRecords(rs as any);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].datos).not.toBeNull();
      expect(parsed[1].datos).toBeNull();
    });

    it('returns an empty array for an empty input', () => {
      expect(parseImpactoRecords([])).toEqual([]);
    });
  });
});
