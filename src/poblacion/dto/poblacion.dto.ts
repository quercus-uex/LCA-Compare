import { ProvinciaDto } from '../../provincia/provincia.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PoblacionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  idProvincia: string;

  idCatastro: number;

  nombre: string;

  provincia: ProvinciaDto;
}
