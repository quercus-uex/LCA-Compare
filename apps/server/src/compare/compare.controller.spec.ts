import {
  BadRequestException,
  ForbiddenException,
  StreamableFile,
  UnprocessableEntityException,
} from '@nestjs/common';

jest.mock('./compare.service', () => ({
  CompareService: class CompareService {},
}));

import { CompareController } from './compare.controller';
import type { CompareService } from './compare.service';
import { CompareQueryDto, CompareQueryItemDto } from './dto/compare-query.dto';
import type { CompareTraceDto } from 'common/compare';
import { IMPACT_KEYS } from './compare.types';
import type { ResultadoImpactoDto } from '../resultadoimpacto/dto/resultado-impacto.dto';
import type { OrganizacionAccesoService } from '../organizacion/organizacion-acceso.service';

function makeImpactDto(
  overrides?: Record<
    string,
    { category: string; amount: number; unit: string }[]
  >,
): ResultadoImpactoDto {
  const base: Record<
    string,
    { category: string; amount: number; unit: string }[]
  > = {};
  for (const key of IMPACT_KEYS) {
    base[key] = overrides?.[key] ?? [
      { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
    ];
  }
  return base as unknown as ResultadoImpactoDto;
}

async function streamToText(file: StreamableFile): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of file.getStream()) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks).toString('utf8');
}

describe('CompareController', () => {
  let compareService: jest.Mocked<
    Pick<
      CompareService,
      | 'getMeanByFilters'
      | 'compareResults'
      | 'findResults'
      | 'findTraceResults'
      | 'generateReport'
      | 'buildTraceExport'
    >
  >;
  let accesoService: jest.Mocked<
    Pick<OrganizacionAccesoService, 'getOrganizacionAdministrada'>
  >;
  let controller: CompareController;

  beforeEach(() => {
    accesoService = { getOrganizacionAdministrada: jest.fn() };
    compareService = {
      getMeanByFilters: jest.fn(),
      compareResults: jest.fn(),
      findResults: jest.fn(),
      findTraceResults: jest.fn(),
      generateReport: jest.fn(),
      buildTraceExport: jest.fn(),
    };
    controller = new CompareController(
      compareService as unknown as CompareService,
      accesoService as unknown as OrganizacionAccesoService,
    );
  });

  describe('organization filter', () => {
    const forbidden = new ForbiddenException(
      'No eres el administrador de esta organización',
    );
    const user = { sub: 'u1', email: 'u1@example.com' };

    it('does not check organizations when no side uses one', async () => {
      compareService.getMeanByFilters.mockResolvedValue(makeImpactDto());

      await controller.compare({ reference: { idPais: 'p1' } }, user);

      expect(accesoService.getOrganizacionAdministrada).not.toHaveBeenCalled();
    });

    it('checks each distinct organization once against the requester', async () => {
      compareService.getMeanByFilters.mockResolvedValue(makeImpactDto());

      await controller.compare(
        {
          reference: { idOrganizacion: 'org-1' },
          target: { idOrganizacion: 'org-1', tipoCultivo: 'Olivo' },
        },
        user,
      );

      expect(accesoService.getOrganizacionAdministrada.mock.calls).toEqual([
        ['org-1', 'u1'],
      ]);
    });

    it.each([
      ['an anonymous requester', undefined],
      ['a user who does not administer it', user],
    ])('rejects the comparison for %s with 403', async (_name, requester) => {
      accesoService.getOrganizacionAdministrada.mockRejectedValue(forbidden);

      await expect(
        controller.compare(
          {
            reference: { idPais: 'p1' },
            target: { idOrganizacion: 'org-1' },
          },
          requester,
        ),
      ).rejects.toStrictEqual(forbidden);
      expect(accesoService.getOrganizacionAdministrada).toHaveBeenCalledWith(
        'org-1',
        requester?.sub,
      );
      expect(compareService.getMeanByFilters).not.toHaveBeenCalled();
    });

    it.each([
      ['reference', { reference: { idsParcela: ['par-1'] } }],
      [
        'target',
        { reference: { idPais: 'p1' }, target: { idsParcela: ['par-1'] } },
      ],
    ])(
      'rejects an anonymous plot filter in the %s with 403',
      async (_name, body) => {
        const expected = new ForbiddenException(
          'Debes iniciar sesión para filtrar por parcelas',
        );

        await expect(controller.compare(body)).rejects.toStrictEqual(expected);
        await expect(
          controller.compareToReport({ target: { idPais: 'p2' }, ...body }),
        ).rejects.toStrictEqual(expected);
        expect(compareService.getMeanByFilters).not.toHaveBeenCalled();
        expect(compareService.findResults).not.toHaveBeenCalled();
      },
    );

    it('passes the viewer so the service can limit a plot filter', async () => {
      compareService.getMeanByFilters.mockResolvedValue(makeImpactDto());
      compareService.findResults.mockResolvedValue([{} as never]);
      compareService.generateReport.mockResolvedValue(Buffer.from('pdf'));
      const filters = { idsParcela: ['par-1'] };

      await controller.compare({ reference: filters }, user);
      await controller.compareToReport(
        { reference: filters, target: filters },
        user,
      );

      expect(compareService.getMeanByFilters.mock.calls).toEqual([
        [filters, 'u1'],
      ]);
      expect(compareService.findResults.mock.calls).toEqual([
        [filters, 'u1'],
        [filters, 'u1'],
      ]);
    });

    it('rejects the report for a user who does not administer the organization', async () => {
      accesoService.getOrganizacionAdministrada.mockRejectedValue(forbidden);

      await expect(
        controller.compareToReport(
          {
            reference: { idOrganizacion: 'org-1' },
            target: { idPais: 'p2' },
          },
          user,
        ),
      ).rejects.toStrictEqual(forbidden);
      expect(compareService.findResults).not.toHaveBeenCalled();
    });
  });

  describe('compare', () => {
    const refFilters: CompareQueryItemDto = { idPais: 'p1' };
    const tarFilters: CompareQueryItemDto = { idPais: 'p2' };

    it('delegates reference-only comparison and wraps result', async () => {
      const refMean = makeImpactDto();
      const comparison = { data: 'comparison' } as any;
      compareService.getMeanByFilters.mockResolvedValueOnce(refMean);
      compareService.compareResults.mockReturnValue(comparison);

      const result = await controller.compare({ reference: refFilters });

      // Only the reference mean is requested when there is no target
      expect(compareService.getMeanByFilters.mock.calls).toEqual([
        [refFilters],
      ]);
      expect(compareService.compareResults).toHaveBeenCalledWith(
        refMean,
        undefined,
      );
      expect(result).toEqual({ data: comparison });
    });

    it('delegates both reference and target means and returns wrapped comparison', async () => {
      const refMean = makeImpactDto();
      const tarMean = makeImpactDto();
      const comparison = { data: 'comparison' } as any;
      compareService.getMeanByFilters
        .mockResolvedValueOnce(refMean)
        .mockResolvedValueOnce(tarMean);
      compareService.compareResults.mockReturnValue(comparison);

      const result = await controller.compare({
        reference: refFilters,
        target: tarFilters,
      });

      expect(compareService.getMeanByFilters.mock.calls).toEqual([
        [refFilters],
        [tarFilters],
      ]);
      expect(compareService.compareResults).toHaveBeenCalledWith(
        refMean,
        tarMean,
      );
      expect(result).toEqual({ data: comparison });
    });

    it('rejects missing reference mean with UnprocessableEntityException', async () => {
      compareService.getMeanByFilters.mockResolvedValueOnce(undefined);

      await expect(
        controller.compare({ reference: refFilters }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(compareService.compareResults).not.toHaveBeenCalled();
    });

    it('rejects missing target mean when target filters are provided', async () => {
      const refMean = makeImpactDto();
      compareService.getMeanByFilters
        .mockResolvedValueOnce(refMean)
        .mockResolvedValueOnce(undefined);

      await expect(
        controller.compare({ reference: refFilters, target: tarFilters }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(compareService.compareResults).not.toHaveBeenCalled();
    });
  });

  describe('exportTrace', () => {
    const org1 = { id: 'org-1', nombre: 'Cooperativa Sur' };
    const org2 = { id: 'org-2', nombre: 'Cooperativa Norte' };
    const refFilters: CompareQueryItemDto = {
      idOrganizacion: org1.id,
      tipoCultivo: 'trigo',
    };
    const tarFilters: CompareQueryItemDto = {
      idOrganizacion: org2.id,
      tipoCultivo: 'cebada',
    };
    const user = { sub: 'u1', email: 'u1@example.com' };
    const forbidden = new ForbiddenException(
      'No eres el administrador de esta organización',
    );

    beforeEach(() => {
      accesoService.getOrganizacionAdministrada.mockImplementation(
        (id: string) => Promise.resolve({ id, nombre: `Org ${id}` }) as never,
      );
    });

    it('rejects an anonymous requester with 403 before touching any data', async () => {
      await expect(
        controller.exportTrace({ reference: refFilters, scope: 'reference' }),
      ).rejects.toThrow(ForbiddenException);

      expect(accesoService.getOrganizacionAdministrada).not.toHaveBeenCalled();
      expect(compareService.findTraceResults).not.toHaveBeenCalled();
    });

    it('rejects a set that is not filtered by an organization with 403', async () => {
      await expect(
        controller.exportTrace(
          { reference: { idPais: 'p1' }, scope: 'reference' },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(accesoService.getOrganizacionAdministrada).not.toHaveBeenCalled();
      expect(compareService.findTraceResults).not.toHaveBeenCalled();
    });

    it('rejects a target set without an organization with 403', async () => {
      await expect(
        controller.exportTrace(
          { reference: refFilters, target: { tipoCultivo: 'cebada' } },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(compareService.findTraceResults).not.toHaveBeenCalled();
    });

    it('rejects a target-only export without target filters with 400', async () => {
      await expect(
        controller.exportTrace(
          { reference: refFilters, scope: 'target' },
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(compareService.findTraceResults).not.toHaveBeenCalled();
    });

    it('rejects a user who does not administer the organization with 403', async () => {
      accesoService.getOrganizacionAdministrada.mockRejectedValue(forbidden);

      await expect(
        controller.exportTrace(
          { reference: refFilters, target: tarFilters },
          user,
        ),
      ).rejects.toStrictEqual(forbidden);

      expect(compareService.findTraceResults).not.toHaveBeenCalled();
      expect(compareService.buildTraceExport).not.toHaveBeenCalled();
    });

    it('checks each distinct organization once against the requester', async () => {
      compareService.findTraceResults.mockResolvedValue([
        { id: 'ri-1' },
      ] as never);
      compareService.buildTraceExport.mockResolvedValue({
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        scope: 'full',
      });

      await controller.exportTrace(
        { reference: refFilters, target: tarFilters },
        user,
      );

      expect(accesoService.getOrganizacionAdministrada.mock.calls).toEqual([
        [org1.id, 'u1'],
        [org2.id, 'u1'],
      ]);
    });

    it('rejects a full export without target filters with 400', async () => {
      await expect(
        controller.exportTrace({ reference: refFilters, scope: 'full' }, user),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.exportTrace({ reference: refFilters }, user),
      ).rejects.toThrow(BadRequestException);

      expect(compareService.findTraceResults).not.toHaveBeenCalled();
    });

    it('rejects an empty set with UnprocessableEntityException', async () => {
      compareService.findTraceResults.mockResolvedValue([]);

      await expect(
        controller.exportTrace(
          { reference: refFilters, scope: 'reference' },
          user,
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(compareService.buildTraceExport).not.toHaveBeenCalled();
    });

    it('returns a self-contained JSON file with the individual results', async () => {
      const refResults = [{ id: 'ri-1' }] as never;
      const tarResults = [{ id: 'ri-2' }] as never;
      const trace: CompareTraceDto = {
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        scope: 'full',
      };
      compareService.findTraceResults
        .mockResolvedValueOnce(refResults)
        .mockResolvedValueOnce(tarResults);
      compareService.buildTraceExport.mockResolvedValue(trace);

      const file = await controller.exportTrace(
        { reference: refFilters, target: tarFilters, format: 'json' },
        user,
      );

      expect(compareService.findTraceResults.mock.calls).toEqual([
        [refFilters, 'u1'],
        [tarFilters, 'u1'],
      ]);
      expect(compareService.buildTraceExport).toHaveBeenCalledWith({
        scope: 'full',
        reference: {
          filters: refFilters,
          results: refResults,
          organizacion: { id: org1.id, nombre: `Org ${org1.id}` },
        },
        target: {
          filters: tarFilters,
          results: tarResults,
          organizacion: { id: org2.id, nombre: `Org ${org2.id}` },
        },
      });
      expect(file).toBeInstanceOf(StreamableFile);
      expect(file.getHeaders().type).toContain('application/json');
      expect(file.getHeaders().disposition).toMatch(
        /^attachment; filename="trazabilidad-full-\d{14}\.json"$/,
      );
      expect(JSON.parse(await streamToText(file))).toEqual(trace);
    });

    it('exports only the target set when the scope is target', async () => {
      const tarResults = [{ id: 'ri-2' }] as never;
      compareService.findTraceResults.mockResolvedValue(tarResults);
      compareService.buildTraceExport.mockResolvedValue({
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        scope: 'target',
      });

      await controller.exportTrace(
        { reference: refFilters, target: tarFilters, scope: 'target' },
        user,
      );

      expect(compareService.findTraceResults.mock.calls).toEqual([
        [tarFilters, 'u1'],
      ]);
      expect(compareService.buildTraceExport).toHaveBeenCalledWith({
        scope: 'target',
        target: {
          filters: tarFilters,
          results: tarResults,
          organizacion: { id: org2.id, nombre: `Org ${org2.id}` },
        },
      });
      expect(accesoService.getOrganizacionAdministrada.mock.calls).toEqual([
        [org2.id, 'u1'],
      ]);
    });

    it('returns a CSV file with the wide header', async () => {
      compareService.findTraceResults.mockResolvedValue([
        { id: 'ri-1' },
      ] as never);
      compareService.buildTraceExport.mockResolvedValue({
        schemaVersion: 1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        scope: 'reference',
      });

      const file = await controller.exportTrace(
        { reference: refFilters, scope: 'reference', format: 'csv' },
        user,
      );

      expect(file.getHeaders().type).toContain('text/csv');
      expect(file.getHeaders().disposition).toMatch(
        /^attachment; filename="trazabilidad-reference-\d{14}\.csv"$/,
      );
      const text = await streamToText(file);
      expect(text.startsWith('\ufeffversion_esquema;generado_en;')).toBe(true);
      expect(text.split('\r\n')).toHaveLength(1);
    });
  });

  describe('compareToReport', () => {
    const refFilters: CompareQueryItemDto = { idPais: 'p1' };
    const tarFilters: CompareQueryItemDto = { idPais: 'p2' };

    it.each<[string, Partial<CompareQueryDto>]>([
      ['reference', { target: tarFilters }],
      ['target', { reference: refFilters }],
    ])(
      'rejects missing %s filters with BadRequestException',
      async (_set, body) => {
        await expect(
          controller.compareToReport(body as CompareQueryDto),
        ).rejects.toThrow(BadRequestException);

        expect(compareService.findResults).not.toHaveBeenCalled();
        expect(compareService.generateReport).not.toHaveBeenCalled();
      },
    );

    it('delegates result lookup and report generation with the requested language, returns StreamableFile', async () => {
      const refResults = [{ id: 'r1' }] as any;
      const tarResults = [{ id: 'r2' }] as any;
      const pdfBuffer = Buffer.from('pdf-content');
      compareService.findResults
        .mockResolvedValueOnce(refResults)
        .mockResolvedValueOnce(tarResults);
      compareService.generateReport.mockResolvedValue(pdfBuffer);

      const result = await controller.compareToReport({
        reference: refFilters,
        target: tarFilters,
        language: 'en',
      });

      expect(compareService.findResults.mock.calls).toEqual([
        [refFilters],
        [tarFilters],
      ]);
      expect(compareService.generateReport).toHaveBeenCalledWith(
        refFilters,
        refResults,
        tarFilters,
        tarResults,
        'en',
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it.each([
      ['reference', [], [{ id: 'r2' }]],
      ['target', [{ id: 'r1' }], []],
    ])(
      'rejects with UnprocessableEntityException when the %s set is empty',
      async (_set, refResults, tarResults) => {
        compareService.findResults
          .mockResolvedValueOnce(refResults as never)
          .mockResolvedValueOnce(tarResults as never);

        await expect(
          controller.compareToReport({
            reference: refFilters,
            target: tarFilters,
          }),
        ).rejects.toThrow(UnprocessableEntityException);

        expect(compareService.generateReport).not.toHaveBeenCalled();
      },
    );
  });
});
