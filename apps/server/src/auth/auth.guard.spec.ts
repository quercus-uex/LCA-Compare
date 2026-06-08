import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';

type TestRequest = Request & {
  user?: { sub: string; email: string };
};

const createContext = (request: Partial<TestRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('AuthGuard', () => {
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let guard: AuthGuard;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    guard = new AuthGuard(jwtService as unknown as JwtService);
  });

  it('rejects requests without an authorization header', async () => {
    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de acceso no proporcionado'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects requests with a non-Bearer authorization header', async () => {
    const context = createContext({
      headers: { authorization: 'Basic credentials' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de acceso no proporcionado'),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
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
      secret: process.env.JWT_SECRET,
    });
  });

  it('assigns the verified payload to request.user and returns true', async () => {
    const request: Partial<TestRequest> = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const payload = { sub: 'user-1', email: 'user@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: process.env.JWT_SECRET,
    });
    expect(request.user).toEqual(payload);
  });
});
