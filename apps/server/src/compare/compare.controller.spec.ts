import {
  BadRequestException,
  StreamableFile,
  UnprocessableEntityException,
} from '@nestjs/common';

jest.mock('./compare.service', () => ({
  CompareService: class CompareService {},
}));

import { CompareController } from './compare.controller';
import type { CompareService } from './compare.service';
import { CompareQueryItemDto } from './dto/compare-query.dto';
import { IMPACT_KEYS } from './compare.types';

function makeImpactDto(
  overrides?: Record<
    string,
    { category: string; amount: number; unit: string }[]
  >,
) {
  const base: Record<
    string,
    { category: string; amount: number; unit: string }[]
  > = {};
  for (const key of IMPACT_KEYS) {
    base[key] = overrides?.[key] ?? [
      { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
    ];
  }
  return base as any;
}

describe('CompareController', () => {
  let compareService: jest.Mocked<
    Pick<
      CompareService,
      'getMeanByFilters' | 'compareResults' | 'findResults' | 'generateReport'
    >
  >;
  let controller: CompareController;

  beforeEach(() => {
    compareService = {
      getMeanByFilters: jest.fn(),
      compareResults: jest.fn(),
      findResults: jest.fn(),
      generateReport: jest.fn(),
    };
    controller = new CompareController(
      compareService as unknown as CompareService,
    );
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

      expect(compareService.getMeanByFilters).toHaveBeenCalledTimes(1);
      expect(compareService.getMeanByFilters).toHaveBeenCalledWith(refFilters);
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

      expect(compareService.getMeanByFilters).toHaveBeenCalledTimes(2);
      expect(compareService.getMeanByFilters).toHaveBeenNthCalledWith(
        1,
        refFilters,
      );
      expect(compareService.getMeanByFilters).toHaveBeenNthCalledWith(
        2,
        tarFilters,
      );
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

  describe('compareToReport', () => {
    const refFilters: CompareQueryItemDto = { idPais: 'p1' };
    const tarFilters: CompareQueryItemDto = { idPais: 'p2' };

    it('rejects missing reference filters with BadRequestException', async () => {
      await expect(
        controller.compareToReport({
          reference: undefined as any,
          target: tarFilters,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(compareService.findResults).not.toHaveBeenCalled();
      expect(compareService.generateReport).not.toHaveBeenCalled();
    });

    it('rejects missing target filters with BadRequestException', async () => {
      await expect(
        controller.compareToReport({ reference: refFilters }),
      ).rejects.toThrow(BadRequestException);

      expect(compareService.findResults).not.toHaveBeenCalled();
      expect(compareService.generateReport).not.toHaveBeenCalled();
    });

    it('delegates result lookup and report generation, returns StreamableFile', async () => {
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
      });

      expect(compareService.findResults).toHaveBeenCalledTimes(2);
      expect(compareService.findResults).toHaveBeenNthCalledWith(1, refFilters);
      expect(compareService.findResults).toHaveBeenNthCalledWith(2, tarFilters);
      expect(compareService.generateReport).toHaveBeenCalledWith(
        refFilters,
        refResults,
        tarFilters,
        tarResults,
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
