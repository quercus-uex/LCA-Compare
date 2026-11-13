import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { Organizacion } from '../generated/prisma/client';
import type { UserJwt } from '../auth/auth-user.decorator';

type OrganizacionRequest = Request & {
  user?: UserJwt;
  organizacion?: Organizacion;
};

/**
 * Solo deja pasar al administrador de la organización `:id`, y la guarda en la
 * petición para que el handler no la vuelva a leer (`@OrganizacionActual()`).
 * Va después de `AuthGuard`, que pone el usuario en la petición.
 */
@Injectable()
export class OrganizacionAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizacionRequest>();
    const id = request.params?.id;

    // Un id que no es un UUID no puede existir: 404 sin consultar
    const organizacion =
      typeof id === 'string' && isUUID(id)
        ? await this.prisma.organizacion.findUnique({ where: { id } })
        : null;
    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }
    if (organizacion.idAdministrador !== request.user?.sub) {
      throw new ForbiddenException(
        'No eres el administrador de esta organización',
      );
    }

    request.organizacion = organizacion;
    return true;
  }
}

/** Organización que ha cargado `OrganizacionAdminGuard` */
export const OrganizacionActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Organizacion =>
    context.switchToHttp().getRequest<OrganizacionRequest>().organizacion!,
);
