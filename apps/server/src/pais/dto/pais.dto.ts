import { ApiProperty } from '@nestjs/swagger';
import type { Pais } from 'common/location';

export class PaisDto implements Pais {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  codigo: string;
}
