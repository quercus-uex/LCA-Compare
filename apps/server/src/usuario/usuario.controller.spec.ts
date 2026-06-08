import { UsuarioController } from './usuario.controller';
import type { UsuarioService } from './usuario.service';

describe('UsuarioController', () => {
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'findOnePublic'>>;
  let controller: UsuarioController;

  beforeEach(() => {
    usuarioService = {
      findOnePublic: jest.fn(),
    };
    controller = new UsuarioController(
      usuarioService as unknown as UsuarioService,
    );
  });

  describe('get', () => {
    it('calls UsuarioService.findOnePublic with the authenticated user email and wraps result in { data }', async () => {
      const user = { email: 'test@example.com', sub: 'u1' };
      const usuario = { id: 'u1', email: 'test@example.com' } as never;
      usuarioService.findOnePublic.mockResolvedValue(usuario);

      const result = await controller.get(user);

      expect(usuarioService.findOnePublic).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual({ data: usuario });
    });
  });
});
