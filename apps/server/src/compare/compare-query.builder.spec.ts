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

  describe('organization filter', () => {
    const ORG_ID = '11111111-1111-4111-8111-111111111111';
    const yearRange = (anio: number) => ({
      fechaInicioCampania: {
        gte: new Date(`${anio}-01-01T00:00:00.000Z`),
        lt: new Date(`${anio + 1}-01-01T00:00:00.000Z`),
      },
    });

    it('keeps an empty condition when the organization has no accepted consents, so it matches nothing', () => {
      expect(CompareQueryBuilder.build({ idOrganizacion: ORG_ID })).toEqual({
        AND: [{ OR: [] }],
      });
      expect(
        CompareQueryBuilder.build({ idOrganizacion: ORG_ID }, undefined, []),
      ).toEqual({ AND: [{ OR: [] }] });
    });

    it('ANDs each accepted user-year pair with the location and crop filters', () => {
      const result = CompareQueryBuilder.build(
        {
          idOrganizacion: ORG_ID,
          idsProvincia: ['prov-1'],
          tipoCultivo: 'Olivo',
        },
        undefined,
        [
          { idUsuario: 'u-1', anio: 2023 },
          { idUsuario: 'u-1', anio: 2024 },
          { idUsuario: 'u-2', anio: 2024 },
        ],
      );

      expect(result).toEqual({
        AND: [
          {
            OR: [
              {
                cultivo: {
                  parcela: {
                    poblacion: { provincia: { id: { in: ['prov-1'] } } },
                  },
                },
              },
            ],
          },
          { cultivo: { tipo: 'Olivo' } },
          {
            OR: [
              {
                cultivo: {
                  parcela: { idPropietario: 'u-1' },
                  ...yearRange(2023),
                },
              },
              {
                cultivo: {
                  parcela: { idPropietario: 'u-1' },
                  ...yearRange(2024),
                },
              },
              {
                cultivo: {
                  parcela: { idPropietario: 'u-2' },
                  ...yearRange(2024),
                },
              },
            ],
          },
        ],
      });
    });

    it('ignores consents when no organization is selected', () => {
      expect(
        CompareQueryBuilder.build({}, undefined, [
          { idUsuario: 'u-1', anio: 2023 },
        ]),
      ).toBeNull();
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
