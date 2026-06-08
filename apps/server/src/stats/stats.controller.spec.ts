import { BadRequestException } from '@nestjs/common';
import { StatsController } from './stats.controller';
import type { StatsService } from './stats.service';

describe('StatsController', () => {
  let controller: StatsController;
  let statsService: jest.Mocked<Pick<StatsService, 'getGlobalStats'>>;

  beforeEach(() => {
    statsService = {
      getGlobalStats: jest.fn().mockResolvedValue({}),
    };
    controller = new StatsController(statsService as unknown as StatsService);
  });

  describe('getGlobalStats', () => {
    it('forwards parsed year, category, crop type, and province id to StatsService', async () => {
      await controller.getGlobalStats(
        '2024',
        'climate_change',
        'trigo',
        'prov-1',
      );

      expect(statsService.getGlobalStats).toHaveBeenCalledWith(
        2024,
        'climate_change',
        'trigo',
        'prov-1',
      );
    });

    it('forwards undefined for empty optional string filters', async () => {
      await controller.getGlobalStats(undefined, '  ', '', undefined);

      expect(statsService.getGlobalStats).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('throws BadRequestException for non-numeric year', () => {
      expect(() => controller.getGlobalStats('abc')).toThrow(
        BadRequestException,
      );
      expect(statsService.getGlobalStats).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for out-of-range year', () => {
      expect(() => controller.getGlobalStats('5000')).toThrow(
        BadRequestException,
      );
      expect(statsService.getGlobalStats).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid category', () => {
      expect(() =>
        controller.getGlobalStats(undefined, 'invalid_category'),
      ).toThrow(BadRequestException);
      expect(statsService.getGlobalStats).not.toHaveBeenCalled();
    });
  });
});
