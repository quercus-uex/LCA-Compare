import { ApiProperty } from '@nestjs/swagger';

export class PaisDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  codigo: string;
}
