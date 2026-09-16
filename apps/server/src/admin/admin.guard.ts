import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsuarioService } from '../usuario/usuario.service';
import { getBearerToken } from '../auth/auth.helpers';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuarioService: UsuarioService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de acceso no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usuarioService.findOne({ id: payload.sub });

      if (user?.rol !== 'admin') {
        throw new ForbiddenException(
          'Acceso denegado: se requiere rol de administrador',
        );
      }

      request['user'] = { sub: user.id, email: user.email, rol: user.rol };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }
}
