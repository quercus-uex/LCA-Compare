import { PoblacionController } from './poblacion.controller';
import type { PoblacionService } from './poblacion.service';

describe('PoblacionController', () => {
  let poblacionService: jest.Mocked<Pick<PoblacionService, 'findMany'>>;
  let controller: PoblacionController;

  beforeEach(() => {
    poblacionService = {
      findMany: jest.fn(),
    };
    controller = new PoblacionController(
      poblacionService as unknown as PoblacionService,
    );
  });

  describe('getByFilters', () => {
    it('calls PoblacionService.findMany with case-insensitive nombre filter and take: 10', async () => {
      const poblaciones = [{ id: 'p1', nombre: 'Lisboa' }] as never;
      poblacionService.findMany.mockResolvedValue(poblaciones);

      const result = await controller.getByFilters('lis');

      expect(poblacionService.findMany).toHaveBeenCalledWith({
        where: {
          nombre: { contains: 'lis', mode: 'insensitive' },
        },
        take: 10,
      });
      expect(result).toEqual({ data: poblaciones });
    });
  });
});
