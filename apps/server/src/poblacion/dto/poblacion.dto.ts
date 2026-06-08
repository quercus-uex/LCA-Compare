import { ProvinciaDto } from '../../provincia/provincia.dto';
import { ApiProperty } from '@nestjs/swagger';
import type { Poblacion } from 'common/location';

export class PoblacionDto implements Poblacion {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  idProvincia: string;

  idCatastro: number;

  nombre: string;

  provincia: ProvinciaDto;
}
