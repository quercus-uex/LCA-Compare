import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';
import {
  CAMPANIA_MIN_ANIO,
  campaniaMaxAnio,
  type CampaniasAdministradorDto as CampaniasAdministradorShape,
  type SolicitarConsentimientoDto as SolicitarConsentimientoShape,
} from 'common/organizacion';

/**
 * Año de campaña entre `CAMPANIA_MIN_ANIO` y `campaniaMaxAnio()`. El máximo se
 * calcula al validar, no al arrancar, para que no se quede en un año pasado.
 */
export function IsAnioCampania(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isAnioCampania',
      validator: {
        validate: (value: unknown) =>
          Number.isInteger(value) &&
          (value as number) >= CAMPANIA_MIN_ANIO &&
          (value as number) <= campaniaMaxAnio(),
        defaultMessage: () =>
          `Los años de campaña deben estar entre ${CAMPANIA_MIN_ANIO} y ${campaniaMaxAnio()}`,
      },
    },
    validationOptions,
  );
}

export class SolicitarConsentimientoDto implements SolicitarConsentimientoShape {
  @ApiProperty({
    format: 'email',
    description: 'Se busca sin espacios ni distinguir mayúsculas',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({
    type: [Number],
    description: `Años de campaña distintos, de ${CAMPANIA_MIN_ANIO} al siguiente al actual`,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsAnioCampania({ each: true })
  anios: number[];
}

export class CampaniasAdministradorDto implements CampaniasAdministradorShape {
  @ApiProperty({
    type: [Number],
    description: `Años de campaña distintos, de ${CAMPANIA_MIN_ANIO} al siguiente al actual. Vacío para no aportar ninguna`,
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsAnioCampania({ each: true })
  anios: number[];
}
