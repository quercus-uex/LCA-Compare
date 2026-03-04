import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser, type UserJwt } from '../auth/auth-user.decorator';

@Controller('/usuario/')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(AuthGuard)
  @Get('')
  async get(@AuthUser() user: UserJwt) {
    return await this.usuarioService.findOnePublic({ email: user.email });
  }
}
