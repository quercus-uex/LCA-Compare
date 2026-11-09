import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { OptionalAuthGuard } from './optional-auth.guard';

type TestRequest = Request & {
  user?: { sub: string; email: string };
};

const createContext = (request: Partial<TestRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('OptionalAuthGuard', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let guard: OptionalAuthGuard;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jwtService = {
      verifyAsync: jest.fn(),
    };
    guard = new OptionalAuthGuard(jwtService as unknown as JwtService);
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it.each([{}, { authorization: 'Basic credentials' }])(
    'lets anonymous requests through without a bearer token (%p)',
    async (headers) => {
      const request: Partial<TestRequest> = { headers };

      await expect(guard.canActivate(createContext(request))).resolves.toBe(
        true,
      );
      expect(request.user).toBeUndefined();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    },
  );

  it('assigns the verified payload to request.user', async () => {
    const request: Partial<TestRequest> = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const payload = { sub: 'user-1', email: 'user@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
    expect(request.user).toEqual(payload);
  });

  it('treats bearer tokens that fail JWT verification as anonymous', async () => {
    const request: Partial<TestRequest> = {
      headers: { authorization: 'Bearer invalid-token' },
    };
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});
