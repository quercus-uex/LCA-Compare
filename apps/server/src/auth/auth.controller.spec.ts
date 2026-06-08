import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authService: jest.Mocked<Pick<AuthService, 'login'>>;
  let controller: AuthController;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('passes email and password to AuthService.login and wraps the result', async () => {
    const loginResult = { accessToken: 'signed-token' };
    authService.login.mockResolvedValue(loginResult);

    await expect(
      controller.login({
        email: 'user@example.com',
        password: 'valid-password',
      }),
    ).resolves.toEqual({ data: loginResult });
    expect(authService.login).toHaveBeenCalledWith(
      'user@example.com',
      'valid-password',
    );
  });
});
