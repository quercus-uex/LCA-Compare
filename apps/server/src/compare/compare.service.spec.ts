import * as fs from 'node:fs';
import { CompareService } from './compare.service';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { ProvinciaService } from '../provincia/provincia.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import { PaisService } from '../pais/pais.service';
import { AiService } from '../ai/ai.service';
import { IMPACT_KEYS, ResultadoImpactoWithRelations } from './compare.types';
import { CompareQueryItemDto } from './dto/compare-query.dto';
import { ResultadoImpactoDto } from '../resultadoimpacto/dto/resultado-impacto.dto';

jest.mock('playwright', () => {
  const page = {
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  };
  const browser = {
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    chromium: {
      launch: jest.fn().mockResolvedValue(browser),
    },
    __mockPage: page,
    __mockBrowser: browser,
  };
});

const playwrightMock = jest.requireMock('playwright');

function makeImpactItems(
  overrides?: { category: string; amount: number; unit: string }[],
) {
  return (
    overrides ?? [
      { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
      { category: 'AP', amount: 5, unit: 'mol H+ eq' },
    ]
  );
}

function makeImpactDto(
  overrides?: Partial<
    Record<
      (typeof IMPACT_KEYS)[number],
      { category: string; amount: number; unit: string }[]
    >
  >,
): ResultadoImpactoDto {
  const dto: Record<string, any> = {};
  for (const key of IMPACT_KEYS) {
    dto[key] = overrides?.[key] ?? makeImpactItems();
  }
  return dto as ResultadoImpactoDto;
}

function makeResultadoImpacto(
  datos: ResultadoImpactoDto,
  relations?: Partial<{
    id: string;
    cultivoTipo: string;
    parcelaId: string;
    poblacionId: string;
    provinciaId: string;
    paisId: string;
    fechaInicio: Date;
  }>,
): ResultadoImpactoWithRelations {
  return {
    id: relations?.id ?? 'ri-1',
    datos: datos as any,
    cultivo: {
      id: 'cult-1',
      tipo: relations?.cultivoTipo ?? 'trigo',
      fechaInicioCampania: relations?.fechaInicio ?? new Date('2025-01-01'),
      parcela: {
        id: relations?.parcelaId ?? 'par-1',
        idPoblacion: relations?.poblacionId ?? 'pop-1',
        poblacion: {
          id: relations?.poblacionId ?? 'pop-1',
          idProvincia: relations?.provinciaId ?? 'prov-1',
          provincia: {
            id: relations?.provinciaId ?? 'prov-1',
            idPais: relations?.paisId ?? 'pais-1',
          },
        },
      },
    },
  } as unknown as ResultadoImpactoWithRelations;
}

describe('CompareService', () => {
  let service: CompareService;
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'findMany' | 'findManyAroundPoint'>
  >;
  let provinciaService: jest.Mocked<Pick<ProvinciaService, 'findMany'>>;
  let poblacionService: jest.Mocked<Pick<PoblacionService, 'findMany'>>;
  let paisService: jest.Mocked<Pick<PaisService, 'findMany'>>;
  let aiService: jest.Mocked<Pick<AiService, 'generateFromTemplate'>>;

  beforeEach(() => {
    resultadoImpactoService = {
      findMany: jest.fn(),
      findManyAroundPoint: jest.fn(),
    };
    provinciaService = { findMany: jest.fn() };
    poblacionService = { findMany: jest.fn() };
    paisService = { findMany: jest.fn() };
    aiService = { generateFromTemplate: jest.fn() };

    service = new CompareService(
      resultadoImpactoService as unknown as ResultadoImpactoService,
      provinciaService as unknown as ProvinciaService,
      poblacionService as unknown as PoblacionService,
      paisService as unknown as PaisService,
      aiService as unknown as AiService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findResults', () => {
    it('returns empty array when no filters are provided', async () => {
      const result = await service.findResults({});

      expect(result).toEqual([]);
      expect(
        resultadoImpactoService.findManyAroundPoint,
      ).not.toHaveBeenCalled();
      expect(resultadoImpactoService.findMany).not.toHaveBeenCalled();
    });

    it('uses findManyAroundPoint and passes nearby ids to findMany for location radius filters', async () => {
      const nearbyResults = [{ id: 'ri-1' }, { id: 'ri-2' }] as any[];
      resultadoImpactoService.findManyAroundPoint.mockResolvedValue(
        nearbyResults,
      );
      const expectedResults = [{ id: 'ri-1' }] as any[];
      resultadoImpactoService.findMany.mockResolvedValue(expectedResults);

      const filters: CompareQueryItemDto = {
        lat: 40.0,
        long: -3.0,
        range: 50,
      };
      const result = await service.findResults(filters);

      expect(resultadoImpactoService.findManyAroundPoint).toHaveBeenCalledWith(
        40.0,
        -3.0,
        50,
      );
      expect(resultadoImpactoService.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [{ id: { in: ['ri-1', 'ri-2'] } }],
            },
          ],
        },
      });
      expect(result).toBe(expectedResults);
    });

    it('treats zero latitude and longitude as valid location filters', async () => {
      resultadoImpactoService.findManyAroundPoint.mockResolvedValue([
        { id: 'ri-zero' } as any,
      ]);
      resultadoImpactoService.findMany.mockResolvedValue([{ id: 'ri-zero' }] as any);

      await service.findResults({ lat: 0, long: 0, range: 10 });

      expect(resultadoImpactoService.findManyAroundPoint).toHaveBeenCalledWith(
        0,
        0,
        10,
      );
      expect(resultadoImpactoService.findMany).toHaveBeenCalledWith({
        where: { AND: [{ OR: [{ id: { in: ['ri-zero'] } }] }] },
      });
    });

    it('builds campaign filters when only one campaign boundary is provided', async () => {
      resultadoImpactoService.findMany.mockResolvedValue([]);

      await service.findResults({ anioCampaniaInicio: 2024 });
      await service.findResults({ anioCampaniaFin: 2025 });

      expect(resultadoImpactoService.findMany).toHaveBeenNthCalledWith(1, {
        where: {
          AND: [
            {
              cultivo: {
                fechaInicioCampania: {
                  gte: new Date('2024-01-01T00:00:00.000Z'),
                },
              },
            },
          ],
        },
      });
      expect(resultadoImpactoService.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          AND: [
            {
              cultivo: {
                fechaInicioCampania: {
                  lt: new Date('2026-01-01T00:00:00.000Z'),
                },
              },
            },
          ],
        },
      });
    });

    it('builds combined entity, crop, and campaign filters', async () => {
      const expectedResults = [{ id: 'ri-1' }] as any[];
      resultadoImpactoService.findMany.mockResolvedValue(expectedResults);

      const filters: CompareQueryItemDto = {
        idsPoblacion: ['pop-1'],
        idsProvincia: ['prov-1'],
        idsParcela: ['par-1'],
        idPais: 'pais-1',
        tipoCultivo: 'trigo',
        anioCampaniaInicio: 2023,
        anioCampaniaFin: 2025,
      };
      const result = await service.findResults(filters);

      expect(
        resultadoImpactoService.findManyAroundPoint,
      ).not.toHaveBeenCalled();
      expect(resultadoImpactoService.findMany).toHaveBeenCalledWith({
        where: {
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
                      poblacion: { provincia: { id: { in: ['prov-1'] } } },
                    },
                  },
                },
                { cultivo: { parcela: { id: { in: ['par-1'] } } } },
                {
                  cultivo: {
                    parcela: { poblacion: { provincia: { idPais: 'pais-1' } } },
                  },
                },
              ],
            },
            { cultivo: { tipo: 'trigo' } },
            {
              cultivo: {
                fechaInicioCampania: {
                  gte: new Date('2023-01-01T00:00:00.000Z'),
                  lt: new Date('2026-01-01T00:00:00.000Z'),
                },
              },
            },
          ],
        },
      });
      expect(result).toBe(expectedResults);
    });
  });

  describe('getMeanOfResults', () => {
    it('returns undefined for empty input', () => {
      const result = service.getMeanOfResults([]);
      expect(result).toBeUndefined();
    });

    it('returns the single result datos as-is', () => {
      const impactDto = makeImpactDto();
      const resultado = { datos: impactDto as any } as any;

      const result = service.getMeanOfResults([resultado]);

      expect(result).toEqual(impactDto);
    });

    it('averages matching categories across all impact keys for multiple results', () => {
      const r1Impact = makeImpactDto({
        impacto_total: [
          { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
          { category: 'AP', amount: 20, unit: 'mol H+ eq' },
        ],
      });
      const r2Impact = makeImpactDto({
        impacto_total: [
          { category: 'GWP', amount: 30, unit: 'kg CO2 eq' },
          { category: 'AP', amount: 40, unit: 'mol H+ eq' },
        ],
      });

      const result = service.getMeanOfResults([
        { datos: r1Impact as any } as any,
        { datos: r2Impact as any } as any,
      ]);

      expect(result).toBeDefined();
      expect(result!.impacto_total).toEqual([
        { category: 'GWP', amount: 20, unit: 'kg CO2 eq' },
        { category: 'AP', amount: 30, unit: 'mol H+ eq' },
      ]);
    });
  });

  describe('getMeanByFilters', () => {
    it('delegates to findResults and returns getMeanOfResults', async () => {
      const impactDto = makeImpactDto();
      const results = [{ datos: impactDto as any }] as any[];
      resultadoImpactoService.findMany.mockResolvedValue(results);

      const filters: CompareQueryItemDto = { tipoCultivo: 'trigo' };
      const result = await service.getMeanByFilters(filters);

      expect(resultadoImpactoService.findMany).toHaveBeenCalled();
      expect(result).toEqual(impactDto);
    });
  });

  describe('compareResults', () => {
    it('returns reference-only comparison without tarAmount or diff', () => {
      const refImpact = makeImpactDto({
        impacto_total: [{ category: 'GWP', amount: 100, unit: 'kg CO2 eq' }],
      });

      const result = service.compareResults(refImpact);

      expect(result.impacto_total).toEqual([
        {
          category: 'GWP',
          unit: 'kg CO2 eq',
          refAmount: 100,
        },
      ]);
      expect(result.impacto_total[0]).not.toHaveProperty('tarAmount');
      expect(result.impacto_total[0]).not.toHaveProperty('diff');
    });

    it('returns target comparison with tarAmount and percentage diff', () => {
      const refImpact = makeImpactDto({
        impacto_total: [{ category: 'GWP', amount: 120, unit: 'kg CO2 eq' }],
      });
      const tarImpact = makeImpactDto({
        impacto_total: [{ category: 'GWP', amount: 100, unit: 'kg CO2 eq' }],
      });

      const result = service.compareResults(refImpact, tarImpact);

      expect(result.impacto_total).toEqual([
        {
          category: 'GWP',
          unit: 'kg CO2 eq',
          refAmount: 120,
          tarAmount: 100,
          diff: 20,
        },
      ]);
    });

    it('uses zero tarAmount and diff for missing target category or zero target amount', () => {
      const refImpact = makeImpactDto({
        impacto_total: [
          { category: 'GWP', amount: 50, unit: 'kg CO2 eq' },
          { category: 'AP', amount: 30, unit: 'mol H+ eq' },
        ],
      });
      const tarImpact = makeImpactDto({
        impacto_total: [{ category: 'GWP', amount: 0, unit: 'kg CO2 eq' }],
      });

      const result = service.compareResults(refImpact, tarImpact);

      const gwp = result.impacto_total.find((i) => i.category === 'GWP')!;
      expect(gwp.tarAmount).toBe(0);
      expect(gwp.diff).toBe(0);

      const ap = result.impacto_total.find((i) => i.category === 'AP')!;
      expect(ap.tarAmount).toBe(0);
      expect(ap.diff).toBe(0);
    });
  });

  describe('onModuleInit / onModuleDestroy', () => {
    it('launches Chromium on init and closes browser on destroy', async () => {
      await service.onModuleInit();

      expect(playwrightMock.chromium.launch).toHaveBeenCalled();

      await service.onModuleDestroy();

      expect(playwrightMock.__mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('generateReport', () => {
    const refFilters: CompareQueryItemDto = {
      idPais: 'pais-1',
      idsProvincia: ['prov-1'],
      idsPoblacion: ['pop-1'],
      tipoCultivo: 'trigo',
      anioCampaniaInicio: 2023,
      anioCampaniaFin: 2025,
    };
    const tarFilters: CompareQueryItemDto = {
      idPais: 'pais-2',
      tipoCultivo: 'cebada',
    };

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('computes comparison, generates AI text, builds context, and returns PDF buffer', async () => {
      const refResults = [
        makeResultadoImpacto(
          makeImpactDto({
            impacto_total: [
              { category: 'GWP', amount: 100, unit: 'kg CO2 eq' },
            ],
          }),
          {
            id: 'ri-1',
            cultivoTipo: 'trigo',
            paisId: 'pais-1',
            provinciaId: 'prov-1',
            poblacionId: 'pop-1',
          },
        ),
      ];
      const tarResults = [
        makeResultadoImpacto(
          makeImpactDto({
            impacto_total: [{ category: 'GWP', amount: 80, unit: 'kg CO2 eq' }],
          }),
          {
            id: 'ri-2',
            cultivoTipo: 'cebada',
            paisId: 'pais-2',
            provinciaId: 'prov-2',
            poblacionId: 'pop-2',
          },
        ),
      ];

      aiService.generateFromTemplate
        .mockResolvedValueOnce('overview-text')
        .mockResolvedValueOnce('recommendations-text');
      paisService.findMany
        .mockResolvedValueOnce([{ id: 'pais-1', nombre: 'Spain' }] as any)
        .mockResolvedValueOnce([{ id: 'pais-2', nombre: 'Portugal' }] as any);
      provinciaService.findMany
        .mockResolvedValueOnce([{ id: 'prov-1' }] as any)
        .mockResolvedValueOnce([{ id: 'prov-2' }] as any);
      poblacionService.findMany
        .mockResolvedValueOnce([{ id: 'pop-1' }] as any)
        .mockResolvedValueOnce([{ id: 'pop-2' }] as any);

      const pdfBuffer = await service.generateReport(
        refFilters,
        refResults,
        tarFilters,
        tarResults,
      );

      expect(aiService.generateFromTemplate).toHaveBeenCalledTimes(2);
      expect(aiService.generateFromTemplate).toHaveBeenNthCalledWith(
        1,
        'compare-overview',
        { data: expect.any(String) },
      );
      expect(aiService.generateFromTemplate).toHaveBeenNthCalledWith(
        2,
        'compare-recommendations',
        { data: 'overview-text' },
      );

      expect(paisService.findMany).toHaveBeenCalledTimes(2);
      expect(provinciaService.findMany).toHaveBeenCalledTimes(2);
      expect(poblacionService.findMany).toHaveBeenCalledTimes(2);

      expect(playwrightMock.__mockBrowser.newPage).toHaveBeenCalled();
      expect(playwrightMock.__mockPage.setContent).toHaveBeenCalledWith(
        expect.any(String),
      );
      expect(playwrightMock.__mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
      });
      expect(pdfBuffer).toEqual(Buffer.from('mock-pdf'));
    });

    it('marks selected filters as chosen in report context', async () => {
      const refResults = [
        makeResultadoImpacto(makeImpactDto(), {
          id: 'ri-1',
          cultivoTipo: 'trigo',
          paisId: 'pais-1',
          provinciaId: 'prov-1',
          poblacionId: 'pop-1',
        }),
      ];
      const tarResults = [
        makeResultadoImpacto(makeImpactDto(), {
          id: 'ri-2',
          cultivoTipo: 'cebada',
          paisId: 'pais-2',
          provinciaId: 'prov-2',
          poblacionId: 'pop-2',
        }),
      ];

      aiService.generateFromTemplate.mockResolvedValue('text');
      paisService.findMany
        .mockResolvedValueOnce([{ id: 'pais-1', nombre: 'Spain' }] as any)
        .mockResolvedValueOnce([{ id: 'pais-2', nombre: 'Portugal' }] as any);
      provinciaService.findMany
        .mockResolvedValueOnce([{ id: 'prov-1' }] as any)
        .mockResolvedValueOnce([{ id: 'prov-2' }] as any);
      poblacionService.findMany
        .mockResolvedValueOnce([{ id: 'pop-1' }] as any)
        .mockResolvedValueOnce([{ id: 'pop-2' }] as any);

      await service.generateReport(
        refFilters,
        refResults,
        tarFilters,
        tarResults,
      );

      const htmlArg = playwrightMock.__mockPage.setContent.mock
        .calls[0][0] as string;

      expect(htmlArg).toContain('Spain');
      expect(htmlArg).toContain('Portugal');
    });

    it('renders target location coordinates from target filters', async () => {
      const refResults = [makeResultadoImpacto(makeImpactDto(), { id: 'ri-1' })];
      const tarResults = [makeResultadoImpacto(makeImpactDto(), { id: 'ri-2' })];

      aiService.generateFromTemplate.mockResolvedValue('text');
      paisService.findMany.mockResolvedValue([]);
      provinciaService.findMany.mockResolvedValue([]);
      poblacionService.findMany.mockResolvedValue([]);

      await service.generateReport(
        refFilters,
        refResults,
        { ...tarFilters, lat: 41, long: -8, range: 100 },
        tarResults,
      );

      const htmlArg = playwrightMock.__mockPage.setContent.mock
        .calls[0][0] as string;

      expect(htmlArg).toContain('41.00000, -8.00000');
      expect(htmlArg).not.toContain('NaN');
    });
  });
});
