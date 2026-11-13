import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsUUID } from 'class-validator';
import type {
  ConsentimientoRespuesta,
  ResponderConsentimientosDto as ResponderConsentimientosShape,
} from 'common/organizacion';

export const CONSENTIMIENTO_RESPUESTAS: readonly ConsentimientoRespuesta[] = [
  'aceptado',
  'rechazado',
];

export class ResponderConsentimientosDto implements ResponderConsentimientosShape {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Solicitudes pendientes propias',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @ApiProperty({ enum: CONSENTIMIENTO_RESPUESTAS })
  @IsIn(CONSENTIMIENTO_RESPUESTAS)
  respuesta: ConsentimientoRespuesta;
}
