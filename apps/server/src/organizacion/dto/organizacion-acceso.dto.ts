import { ApiProperty } from '@nestjs/swagger';
import type {
  AccesoOrganizacion,
  OrganizacionResumen,
  UsuarioBasico,
} from 'common/organizacion';

export class UsuarioBasicoDto implements UsuarioBasico {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;

  apellidos: string;

  @ApiProperty({ format: 'email' })
  email: string;
}

export class OrganizacionRefDto implements Pick<
  OrganizacionResumen,
  'id' | 'nombre'
> {
  @ApiProperty({ format: 'uuid' })
  id: string;

  nombre: string;
}

export class AccesoOrganizacionDto implements AccesoOrganizacion {
  propietario: UsuarioBasicoDto;

  @ApiProperty({
    type: [OrganizacionRefDto],
    description: 'Organizaciones administradas a las que ha dado acceso',
  })
  organizaciones: OrganizacionRefDto[];

  @ApiProperty({
    type: [Number],
    description: 'Años de campaña consentidos, de menor a mayor',
  })
  anios: number[];
}
