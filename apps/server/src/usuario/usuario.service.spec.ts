import { UsuarioService } from './usuario.service';

type PrismaMethod = 'findUnique' | 'findMany' | 'create' | 'update' | 'delete';

describe('UsuarioService', () => {
  let prisma: { usuario: Record<PrismaMethod, jest.Mock> };
  let service: UsuarioService;

  beforeEach(() => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new UsuarioService(prisma as never);
  });

  it.each<{
    method: string;
    prismaMethod: PrismaMethod;
    call: (service: UsuarioService) => Promise<unknown>;
    expected: Record<string, unknown>;
  }>([
    {
      method: 'findOnePublic',
      prismaMethod: 'findUnique',
      call: (s) => s.findOnePublic({ id: 'u1' }),
      expected: { where: { id: 'u1' } },
    },
    {
      method: 'findAll',
      prismaMethod: 'findMany',
      call: (s) => s.findAll({ skip: 0, take: 10, where: { rol: 'admin' } }),
      expected: { skip: 0, take: 10, where: { rol: 'admin' } },
    },
    {
      method: 'create',
      prismaMethod: 'create',
      call: (s) => s.create({ email: 'new@example.com' } as never),
      expected: { data: { email: 'new@example.com' } },
    },
    {
      method: 'update',
      prismaMethod: 'update',
      call: (s) =>
        s.update({ where: { id: 'u1' }, data: { nombre: 'Updated' } }),
      expected: { where: { id: 'u1' }, data: { nombre: 'Updated' } },
    },
    {
      method: 'delete',
      prismaMethod: 'delete',
      call: (s) => s.delete({ id: 'u1' }),
      expected: { where: { id: 'u1' } },
    },
  ])(
    '$method omits passwordHash from the result',
    async ({ prismaMethod, call, expected }) => {
      const usuario = { id: 'u1' };
      prisma.usuario[prismaMethod].mockResolvedValue(usuario);

      await expect(call(service)).resolves.toBe(usuario);
      expect(prisma.usuario[prismaMethod]).toHaveBeenCalledWith(
        expect.objectContaining({ ...expected, omit: { passwordHash: true } }),
      );
    },
  );
});
