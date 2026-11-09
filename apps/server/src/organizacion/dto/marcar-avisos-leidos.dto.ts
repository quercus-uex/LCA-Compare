import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import type { MarcarAvisosLeidosDto as MarcarAvisosLeidosShape } from 'common/organizacion';

export class MarcarAvisosLeidosDto implements MarcarAvisosLeidosShape {
  @ApiProperty({
    required: false,
    type: [String],
    format: 'uuid',
    description: 'Sin ids se marcan todos los avisos propios',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  ids?: string[];
}
