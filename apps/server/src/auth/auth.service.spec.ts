import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

const verifyMock = jest.mocked(argon2.verify);
const user = {
  id: 'user-1',
  nombre: 'Test',
  apellidos: 'User',
  email: 'user@example.com',
  passwordHash: 'hashed-password',
  rol: 'admin',
  fechaRegistro: new Date('2026-01-01T00:00:00.000Z'),
  fechaActualizacion: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthService', () => {
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let service: AuthService;

  beforeEach(() => {
    usuarioService = {
      findOne: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    service = new AuthService(
      usuarioService as unknown as UsuarioService,
      jwtService as unknown as JwtService,
    );
  });

  it('throws invalid credentials when the user does not exist', async () => {
    usuarioService.findOne.mockResolvedValue(null);

    await expect(
      service.login('missing@example.com', 'password'),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    expect(usuarioService.findOne).toHaveBeenCalledWith({
      email: 'missing@example.com',
    });
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('throws invalid credentials when the password is invalid', async () => {
    usuarioService.findOne.mockResolvedValue(user);
    verifyMock.mockResolvedValue(false);

    await expect(
      service.login('user@example.com', 'wrong-password'),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    expect(verifyMock).toHaveBeenCalledWith(
      'hashed-password',
      'wrong-password',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('signs the user payload and returns the generated access token', async () => {
    usuarioService.findOne.mockResolvedValue(user);
    verifyMock.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login('user@example.com', 'valid-password'),
    ).resolves.toEqual({
      accessToken: 'signed-token',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'user@example.com',
    });
  });
});
