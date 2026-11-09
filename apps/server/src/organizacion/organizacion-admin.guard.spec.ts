import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizacionAdminGuard } from './organizacion-admin.guard';
import type { PrismaService } from '../prisma/prisma.service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

type TestRequest = {
  params: Record<string, string>;
  user?: { sub: string; email: string };
  organizacion?: unknown;
};

const createContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as ExecutionContext;

describe('OrganizacionAdminGuard', () => {
  let findUnique: jest.Mock;
  let guard: OrganizacionAdminGuard;

  beforeEach(() => {
    findUnique = jest.fn();
    guard = new OrganizacionAdminGuard({
      organizacion: { findUnique },
    } as unknown as PrismaService);
  });

  it('rejects a non-UUID id with 404 without querying', async () => {
    const context = createContext({
      params: { id: 'not-a-uuid' },
      user: { sub: 'u1', email: 'u1@example.com' },
    });

    await expect(guard.canActivate(context)).rejects.toStrictEqual(
      new NotFoundException('Organización no encontrada'),
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing organization with 404', async () => {
    findUnique.mockResolvedValue(null);
    const context = createContext({
      params: { id: ORG_ID },
      user: { sub: 'u1', email: 'u1@example.com' },
    });

    await expect(guard.canActivate(context)).rejects.toStrictEqual(
      new NotFoundException('Organización no encontrada'),
    );
    expect(findUnique).toHaveBeenCalledWith({ where: { id: ORG_ID } });
  });

  it('rejects users who do not administer the organization with 403', async () => {
    findUnique.mockResolvedValue({ id: ORG_ID, idAdministrador: 'u2' });
    const context = createContext({
      params: { id: ORG_ID },
      user: { sub: 'u1', email: 'u1@example.com' },
    });

    await expect(guard.canActivate(context)).rejects.toStrictEqual(
      new ForbiddenException('No eres el administrador de esta organización'),
    );
  });

  it('lets the administrator through and stores the organization on the request', async () => {
    const organizacion = { id: ORG_ID, idAdministrador: 'u1' };
    findUnique.mockResolvedValue(organizacion);
    const request: TestRequest = {
      params: { id: ORG_ID },
      user: { sub: 'u1', email: 'u1@example.com' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.organizacion).toBe(organizacion);
  });
});
