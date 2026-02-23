import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsuarioPublico, UsuarioService } from './usuario.service';

@Controller('/usuario/')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<UsuarioPublico> {
    const usuario = await this.usuarioService.findOnePublic({ id });
    if (usuario === null) throw new NotFoundException();
    return usuario;
  }
}
