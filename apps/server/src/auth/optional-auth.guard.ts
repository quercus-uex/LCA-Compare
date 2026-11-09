import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getBearerToken } from './auth.helpers';

/**
 * Para rutas públicas que dan más datos a un usuario autenticado. Sin token, o
 * con uno inválido o expirado, se continúa como anónimo (`request.user` queda
 * sin definir): una sesión caducada no debe romper una página pública, y lo
 * que requiere usuario ya responde 403 por sí mismo.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = getBearerToken(request);
    if (!token) return true;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = payload as { sub: string; email: string };
    } catch {
      // Se sigue como anónimo
    }

    return true;
  }
}
