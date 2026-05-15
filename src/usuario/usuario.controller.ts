import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { UsuarioDto } from './dto/usuario.dto';

@ApiTags('Usuario')
@ApiBearerAuth()
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Obtener la información del usuario autenticado' })
  @ApiUnauthorizedResponse({
    description: 'Token inválido o expirado',
    type: ApiErrorDto,
  })
  @ApiOkResponse({
    description: 'Datos del usuario',
    type: ApiResponseDto(UsuarioDto),
  })
  async get(@AuthUser() user: UserJwt) {
    const usuario = await this.usuarioService.findOnePublic({
      email: user.email,
    });
    return { data: usuario };
  }
}
