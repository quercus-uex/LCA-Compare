import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AdminGuard } from './admin.guard';
import { UsuarioService } from '../usuario/usuario.service';

type TestRequest = Request & {
  user?: { sub: string; email: string; rol: string };
};

const createContext = (request: Partial<TestRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('AdminGuard', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'findOne'>>;
  let guard: AdminGuard;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jwtService = {
      verifyAsync: jest.fn(),
    };
    usuarioService = {
      findOne: jest.fn(),
    };
    guard = new AdminGuard(
      jwtService as unknown as JwtService,
      usuarioService as unknown as UsuarioService,
    );
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('rejects requests without an authorization header', async () => {
    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de acceso no proporcionado'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(usuarioService.findOne).not.toHaveBeenCalled();
  });

  it('rejects requests with a non-Bearer authorization header', async () => {
    const context = createContext({
      headers: { authorization: 'Basic credentials' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de acceso no proporcionado'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(usuarioService.findOne).not.toHaveBeenCalled();
  });

  it('rejects bearer tokens that fail JWT verification', async () => {
    const context = createContext({
      headers: { authorization: 'Bearer invalid-token' },
    });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token inválido o expirado'),
    );
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
      secret: 'test-secret',
    });
    expect(usuarioService.findOne).not.toHaveBeenCalled();
  });

  it('forbids valid tokens whose subject does not resolve to a user', async () => {
    const context = createContext({
      headers: { authorization: 'Bearer valid-token' },
    });
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'missing-user',
      email: 'missing@example.com',
    });
    usuarioService.findOne.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(
        'Acceso denegado: se requiere rol de administrador',
      ),
    );
    expect(usuarioService.findOne).toHaveBeenCalledWith({ id: 'missing-user' });
  });

  it('forbids valid tokens whose user is not an admin', async () => {
    const context = createContext({
      headers: { authorization: 'Bearer valid-token' },
    });
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
    });
    usuarioService.findOne.mockResolvedValue({
      id: 'user-1',
      nombre: 'Test',
      apellidos: 'User',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      rol: 'user',
      fechaRegistro: new Date('2026-01-01T00:00:00.000Z'),
      fechaActualizacion: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(
        'Acceso denegado: se requiere rol de administrador',
      ),
    );
    expect(usuarioService.findOne).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('assigns an admin user to request.user and returns true', async () => {
    const request: Partial<TestRequest> = {
      headers: { authorization: 'Bearer valid-token' },
    };
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'admin-1',
      email: 'admin@example.com',
    });
    usuarioService.findOne.mockResolvedValue({
      id: 'admin-1',
      nombre: 'Admin',
      apellidos: 'User',
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      rol: 'admin',
      fechaRegistro: new Date('2026-01-01T00:00:00.000Z'),
      fechaActualizacion: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
    expect(request.user).toEqual({
      sub: 'admin-1',
      email: 'admin@example.com',
      rol: 'admin',
    });
  });
});
