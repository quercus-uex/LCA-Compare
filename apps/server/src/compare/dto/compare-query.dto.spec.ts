import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CompareQueryDto } from './compare-query.dto';

const uuid = '550e8400-e29b-41d4-a716-446655440000';

describe('CompareQueryDto', () => {
  it('accepts a reference-only query, a report language and the reference-parcel flag, converting coordinate strings to numbers', () => {
    const dto = plainToInstance(CompareQueryDto, {
      reference: {
        idPais: uuid,
        idsProvincia: [uuid],
        lat: '40.4168',
        long: '-3.7038',
        range: '25',
        tipoCultivo: 'trigo',
        anioCampaniaInicio: 2024,
        anioCampaniaFin: 2025,
        soloParcelasReferencia: true,
      },
      language: 'en',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.reference.lat).toBe(40.4168);
    expect(dto.reference.long).toBe(-3.7038);
    expect(dto.reference.range).toBe(25);
    expect(dto.reference.soloParcelasReferencia).toBe(true);
    expect(dto.language).toBe('en');
    expect(dto.target).toBeUndefined();
  });

  it('rejects missing reference, malformed UUIDs, invalid coordinates, non-positive ranges, and a non-boolean flag', () => {
    const missingReference = plainToInstance(CompareQueryDto, {});
    expect(validateSync(missingReference)).toEqual([
      expect.objectContaining({ property: 'reference' }),
    ]);

    const invalid = plainToInstance(CompareQueryDto, {
      reference: {
        idPais: 'not-a-uuid',
        idsPoblacion: ['also-not-a-uuid'],
        lat: '120',
        long: '200',
        range: '0',
        anioCampaniaInicio: 2019,
        soloParcelasReferencia: 'yes',
      },
    });

    const invalidProperties = validateSync(invalid)[0].children?.map(
      (child) => child.property,
    );

    expect(invalidProperties).toEqual(
      expect.arrayContaining([
        'idPais',
        'idsPoblacion',
        'lat',
        'long',
        'range',
        'anioCampaniaInicio',
        'soloParcelasReferencia',
      ]),
    );
  });

  it('rejects an unsupported report language', () => {
    const dto = plainToInstance(CompareQueryDto, {
      reference: { idPais: uuid },
      language: 'fr',
    });

    const errors = validateSync(dto);
    expect(errors[0]?.property).toBe('language');
  });
});
