import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type {
  CreateOrganizacionDto as CreateOrganizacionShape,
  UpdateOrganizacionDto as UpdateOrganizacionShape,
} from 'common/organizacion';

export const ORGANIZACION_NOMBRE_MAX = 120;
export const ORGANIZACION_DESCRIPCION_MAX = 500;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateOrganizacionDto implements CreateOrganizacionShape {
  @ApiProperty({ maxLength: ORGANIZACION_NOMBRE_MAX })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(ORGANIZACION_NOMBRE_MAX)
  nombre: string;

  @ApiProperty({
    required: false,
    maxLength: ORGANIZACION_DESCRIPCION_MAX,
    description: 'Una descripción vacía se guarda como null',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(ORGANIZACION_DESCRIPCION_MAX)
  descripcion?: string;
}

export class UpdateOrganizacionDto implements UpdateOrganizacionShape {
  @ApiProperty({ required: false, maxLength: ORGANIZACION_NOMBRE_MAX })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(ORGANIZACION_NOMBRE_MAX)
  nombre?: string;

  @ApiProperty({
    required: false,
    maxLength: ORGANIZACION_DESCRIPCION_MAX,
    description: 'Una descripción vacía borra la actual',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(ORGANIZACION_DESCRIPCION_MAX)
  descripcion?: string;
}
