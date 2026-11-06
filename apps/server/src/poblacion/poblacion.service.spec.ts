import { PoblacionService } from './poblacion.service';

describe('PoblacionService', () => {
  describe('findByCatastroIds', () => {
    it('looks the town up by its catastro ids and country, returning the first match or undefined', async () => {
      const findMany = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'pob1' }, { id: 'pob2' }])
        .mockResolvedValueOnce([]);
      const service = new PoblacionService({
        poblacion: { findMany },
      } as never);

      await expect(service.findByCatastroIds(6, 44, 'ES')).resolves.toEqual({
        id: 'pob1',
      });
      await expect(service.findByCatastroIds(6, 44, 'ES')).resolves.toBe(
        undefined,
      );

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            provincia: { idCatastro: 6, pais: { codigo: 'ES' } },
            idCatastro: 44,
          },
        }),
      );
    });
  });
});
