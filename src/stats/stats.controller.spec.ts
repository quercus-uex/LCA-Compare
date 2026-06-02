import { BadRequestException } from '@nestjs/common';

jest.mock('./stats.service', () => ({
  StatsService: class StatsService {},
}));

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { EF_CATEGORIES } from '../compare/compare.types';

describe('StatsController', () => {
  const statsService = {
    getGlobalStats: jest.fn(),
  } as unknown as jest.Mocked<Pick<StatsService, 'getGlobalStats'>>;

  let controller: StatsController;

  beforeEach(() => {
    statsService.getGlobalStats.mockReset().mockResolvedValue({} as never);
    controller = new StatsController(statsService as unknown as StatsService);
  });

  it('should parse valid query parameters before calling the service', async () => {
    await controller.getGlobalStats(
      '2024',
      'water_use',
      'Tomate',
      'provincia-1',
    );

    expect(statsService.getGlobalStats).toHaveBeenCalledWith(
      2024,
      'water_use',
      'Tomate',
      'provincia-1',
    );
  });

  it('should reject non-integer years with HTTP 400', () => {
    const callController = () => {
      void controller.getGlobalStats('abc');
    };

    expect(callController).toThrow(BadRequestException);

    try {
      callController();
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          message: 'anio debe ser un año entero válido en formato numérico',
        }),
      );
    }
  });

  it('should reject out-of-range years with HTTP 400', () => {
    const callController = () => {
      void controller.getGlobalStats('0');
    };

    try {
      callController();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          message: 'anio está fuera del rango soportado (1900-2100)',
        }),
      );
    }
  });

  it('should preserve invalid category response with valid ids', () => {
    const callController = () => {
      void controller.getGlobalStats(undefined, 'invalid_category');
    };

    try {
      callController();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        message: 'Categoría no válida',
        categoriasValidas: EF_CATEGORIES.map((category) => category.id),
      });
    }
  });

  it('should normalize empty optional string filters to undefined', async () => {
    await controller.getGlobalStats(undefined, '', '', '   ');

    expect(statsService.getGlobalStats).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });
});
