import { CompareQueryBuilder } from './compare-query.builder';
import { CompareQueryItemDto } from './dto/compare-query.dto';

describe('CompareQueryBuilder', () => {
  it('returns null when no filters are provided', () => {
    const result = CompareQueryBuilder.build({});

    expect(result).toBeNull();
  });

  it('returns null when empty location ids are provided', () => {
    const result = CompareQueryBuilder.build({}, []);

    expect(result).toBeNull();
  });

  it('builds a location filter from nearby result ids', () => {
    const result = CompareQueryBuilder.build(
      { lat: 40.0, long: -3.0, range: 50 },
      ['ri-1', 'ri-2'],
    );

    expect(result).toEqual({
      AND: [{ OR: [{ id: { in: ['ri-1', 'ri-2'] } }] }],
    });
  });

  it('builds a poblacion filter', () => {
    const result = CompareQueryBuilder.build({ idsPoblacion: ['pop-1'] });

    expect(result).toEqual({
      AND: [
        {
          OR: [
            {
              cultivo: {
                parcela: { poblacion: { id: { in: ['pop-1'] } } },
              },
            },
          ],
        },
      ],
    });
  });

  it('builds a provincia filter', () => {
    const result = CompareQueryBuilder.build({ idsProvincia: ['prov-1'] });

    expect(result).toEqual({
      AND: [
        {
          OR: [
            {
              cultivo: {
                parcela: {
                  poblacion: {
                    provincia: { id: { in: ['prov-1'] } },
                  },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('builds a parcela filter', () => {
    const result = CompareQueryBuilder.build({ idsParcela: ['par-1'] });

    expect(result).toEqual({
      AND: [
        {
          OR: [{ cultivo: { parcela: { id: { in: ['par-1'] } } } }],
        },
      ],
    });
  });

  it('builds a pais filter', () => {
    const result = CompareQueryBuilder.build({ idPais: 'pais-1' });

    expect(result).toEqual({
      AND: [
        {
          OR: [
            {
              cultivo: {
                parcela: {
                  poblacion: { provincia: { idPais: 'pais-1' } },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('builds a crop type filter', () => {
    const result = CompareQueryBuilder.build({ tipoCultivo: 'trigo' });

    expect(result).toEqual({
      AND: [{ cultivo: { tipo: 'trigo' } }],
    });
  });

  it('builds a soloParcelasReferencia filter', () => {
    const result = CompareQueryBuilder.build({ soloParcelasReferencia: true });

    expect(result).toEqual({
      AND: [
        {
          cultivo: {
            parcela: { esParcelaReferencia: true },
          },
        },
      ],
    });
  });

  it('ignores soloParcelasReferencia when false', () => {
    const result = CompareQueryBuilder.build({ soloParcelasReferencia: false });

    expect(result).toBeNull();
  });

  it('builds a campaign start year filter', () => {
    const result = CompareQueryBuilder.build({ anioCampaniaInicio: 2024 });

    expect(result).toEqual({
      AND: [
        {
          cultivo: {
            fechaInicioCampania: {
              gte: new Date('2024-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
    });
  });

  it('builds a campaign end year filter', () => {
    const result = CompareQueryBuilder.build({ anioCampaniaFin: 2025 });

    expect(result).toEqual({
      AND: [
        {
          cultivo: {
            fechaInicioCampania: {
              lt: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
    });
  });

  it('builds a combined campaign year range filter', () => {
    const result = CompareQueryBuilder.build({
      anioCampaniaInicio: 2023,
      anioCampaniaFin: 2025,
    });

    expect(result).toEqual({
      AND: [
        {
          cultivo: {
            fechaInicioCampania: {
              gte: new Date('2023-01-01T00:00:00.000Z'),
              lt: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
    });
  });

  it('combines location, entity, crop and campaign filters', () => {
    const filters: CompareQueryItemDto = {
      idsPoblacion: ['pop-1'],
      idsProvincia: ['prov-1'],
      idsParcela: ['par-1'],
      idPais: 'pais-1',
      tipoCultivo: 'trigo',
      anioCampaniaInicio: 2023,
      anioCampaniaFin: 2025,
      soloParcelasReferencia: true,
    };

    const result = CompareQueryBuilder.build(filters, ['ri-loc']);

    expect(result).toEqual({
      AND: [
        {
          OR: [
            {
              cultivo: {
                parcela: { poblacion: { id: { in: ['pop-1'] } } },
              },
            },
            {
              cultivo: {
                parcela: {
                  poblacion: {
                    provincia: { id: { in: ['prov-1'] } },
                  },
                },
              },
            },
            { cultivo: { parcela: { id: { in: ['par-1'] } } } },
            { id: { in: ['ri-loc'] } },
            {
              cultivo: {
                parcela: {
                  poblacion: { provincia: { idPais: 'pais-1' } },
                },
              },
            },
          ],
        },
        { cultivo: { tipo: 'trigo' } },
        {
          cultivo: {
            parcela: { esParcelaReferencia: true },
          },
        },
        {
          cultivo: {
            fechaInicioCampania: {
              gte: new Date('2023-01-01T00:00:00.000Z'),
              lt: new Date('2026-01-01T00:00:00.000Z'),
            },
          },
        },
      ],
    });
  });
});
