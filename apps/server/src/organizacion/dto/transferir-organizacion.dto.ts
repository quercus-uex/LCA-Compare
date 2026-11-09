import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import type { TransferirOrganizacionDto as TransferirOrganizacionShape } from 'common/organizacion';

export class TransferirOrganizacionDto implements TransferirOrganizacionShape {
  @ApiProperty({
    format: 'uuid',
    description: 'Miembro con al menos una campaña aceptada',
  })
  @IsUUID()
  idUsuario: string;
}
