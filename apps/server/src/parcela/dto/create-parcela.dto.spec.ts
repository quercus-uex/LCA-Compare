import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateParcelaDto } from './create-parcela.dto';
import { UpdateParcelaDto } from './update-parcela.dto';

describe('Parcela DTOs', () => {
  const idPropietario = '0f8fad5b-d9cb-469f-a165-70867728950e';

  it.each([CreateParcelaDto, UpdateParcelaDto])(
    '%p turns empty identifiers into null so they do not collide',
    async (Dto) => {
      const dto = plainToInstance(Dto, {
        nombre: 'Parcela',
        idPropietario,
        sigpac: '',
        refCat: '  ',
        ptIdParcela: '',
        idPoblacion: '',
      });

      expect(dto).toMatchObject({
        sigpac: null,
        refCat: null,
        ptIdParcela: null,
        idPoblacion: null,
      });
      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it('keeps non-empty identifiers', () => {
    const dto = plainToInstance(CreateParcelaDto, {
      nombre: 'Parcela',
      idPropietario,
      refCat: '4191003AG3456S0001EP',
    });

    expect(dto.refCat).toBe('4191003AG3456S0001EP');
  });
});
