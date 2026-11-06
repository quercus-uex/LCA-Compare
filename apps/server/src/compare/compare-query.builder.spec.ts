import { CompareQueryBuilder } from './compare-query.builder';
import type { Prisma } from '../generated/prisma/client';
import { CompareQueryItemDto } from './dto/compare-query.dto';

describe('CompareQueryBuilder', () => {
  it('returns null when no filters are provided', () => {
    const result = CompareQueryBuilder.build({});

    expect(result).toBeNull();
  });

  it('keeps an empty location condition when a radius filter found no parcels, so it matches nothing', () => {
    const result = CompareQueryBuilder.build(
      { lat: 40.0, long: -3.0, range: 50 },
      [],
    );

    expect(result).toEqual({
      AND: [{ OR: [{ cultivo: { idParcela: { in: [] } } }] }],
    });
  });

  it.each<[string, CompareQueryItemDto, Prisma.ResultadoImpactoWhereInput]>([
    [
      'poblacion',
      { idsPoblacion: ['pop-1'] },
      {
        OR: [
          { cultivo: { parcela: { poblacion: { id: { in: ['pop-1'] } } } } },
        ],
      },
    ],
    [
      'provincia',
      { idsProvincia: ['prov-1'] },
      {
        OR: [
          {
            cultivo: {
              parcela: { poblacion: { provincia: { id: { in: ['prov-1'] } } } },
            },
          },
        ],
      },
    ],
    [
      'parcela',
      { idsParcela: ['par-1'] },
      { OR: [{ cultivo: { parcela: { id: { in: ['par-1'] } } } }] },
    ],
    [
      'pais',
      { idPais: 'pais-1' },
      {
        OR: [
          {
            cultivo: {
              parcela: { poblacion: { provincia: { idPais: 'pais-1' } } },
            },
          },
        ],
      },
    ],
    ['crop type', { tipoCultivo: 'trigo' }, { cultivo: { tipo: 'trigo' } }],
    [
      'soloParcelasReferencia',
      { soloParcelasReferencia: true },
      { cultivo: { parcela: { esParcelaReferencia: true } } },
    ],
    // The exact date range is covered by campaign-year.helper.spec
    [
      'campaign year range',
      { anioCampaniaInicio: 2023, anioCampaniaFin: 2025 },
      { cultivo: { fechaInicioCampania: expect.any(Object) } },
    ],
  ])('builds a %s filter', (_name, filters, expectedCondition) => {
    expect(CompareQueryBuilder.build(filters)).toEqual({
      AND: [expectedCondition],
    });
  });

  it('ignores soloParcelasReferencia when false', () => {
    const result = CompareQueryBuilder.build({ soloParcelasReferencia: false });

    expect(result).toBeNull();
  });

  it('ignores empty id lists', () => {
    const result = CompareQueryBuilder.build({
      idsPoblacion: [],
      idsProvincia: [],
      idsParcela: [],
    });

    expect(result).toBeNull();
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

    const result = CompareQueryBuilder.build(filters, ['par-loc']);

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
            { cultivo: { idParcela: { in: ['par-loc'] } } },
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
