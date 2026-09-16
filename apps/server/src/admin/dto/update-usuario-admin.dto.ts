import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UpdateUsuarioDto } from '../../usuario/dto/update-usuario.dto';
import { USUARIO_ROLES, type UsuarioRol } from './create-usuario-admin.dto';

export class UpdateUsuarioAdminDto extends UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(USUARIO_ROLES)
  rol?: UsuarioRol;
}
