import { PaisController } from './pais.controller';
import type { PaisService } from './pais.service';

describe('PaisController', () => {
  let paisService: jest.Mocked<Pick<PaisService, 'findAll'>>;
  let controller: PaisController;

  beforeEach(() => {
    paisService = {
      findAll: jest.fn(),
    };
    controller = new PaisController(paisService as unknown as PaisService);
  });

  describe('getAll', () => {
    it('calls PaisService.findAll and wraps result in { data }', async () => {
      const paises = [{ id: 'p1', nombre: 'Portugal' }] as never;
      paisService.findAll.mockResolvedValue(paises);

      const result = await controller.getAll();

      expect(paisService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: paises });
    });
  });
});
