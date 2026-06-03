import { ApiProperty } from '@nestjs/swagger';
import type { Usuario } from 'common/usuario';

export class UsuarioDto implements Usuario {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  apellidos: string;

  @ApiProperty({ format: 'email' })
  email: string;

  rol: string;

  @ApiProperty({ format: 'date-time' })
  fechaRegistro: string;

  @ApiProperty({ format: 'date-time' })
  fechaActualizacion: string;
}
