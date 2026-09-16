import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { CreateUsuarioDto } from '../../usuario/dto/create-usuario.dto';

export const USUARIO_ROLES = ['admin', 'usuario'] as const;
export type UsuarioRol = (typeof USUARIO_ROLES)[number];

export class CreateUsuarioAdminDto extends CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(USUARIO_ROLES)
  rol: UsuarioRol;
}
