import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let prisma: {
    usuario: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };
  let service: UsuarioService;

  beforeEach(() => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new UsuarioService(prisma as never);
  });

  describe('findOne', () => {
    it('calls prisma.usuario.findUnique with where and no omit clause', async () => {
      const usuario = {
        id: 'u1',
        email: 'test@example.com',
        passwordHash: 'hash',
      } as never;
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await service.findOne({ id: 'u1' });

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect(result).toBe(usuario);
    });
  });

  describe('findOnePublic', () => {
    it('calls prisma.usuario.findUnique with where and omit.passwordHash true', async () => {
      const usuario = { id: 'u1', email: 'test@example.com' } as never;
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await service.findOnePublic({ id: 'u1' });

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        omit: { passwordHash: true },
      });
      expect(result).toBe(usuario);
    });
  });

  describe('findAll', () => {
    it('calls prisma.usuario.findMany with omit.passwordHash true and forwarded params', async () => {
      const usuarios = [{ id: 'u1' }] as never;
      prisma.usuario.findMany.mockResolvedValue(usuarios);

      const params = {
        skip: 0,
        take: 10,
        cursor: { id: 'u1' },
        where: { email: { contains: 'test' } },
        orderBy: { email: 'asc' as const },
      };
      const result = await service.findAll(params);

      expect(prisma.usuario.findMany).toHaveBeenCalledWith({
        ...params,
        omit: { passwordHash: true },
      });
      expect(result).toBe(usuarios);
    });
  });

  describe('create', () => {
    it('calls prisma.usuario.create with data and omit.passwordHash true', async () => {
      const data = {
        email: 'new@example.com',
        passwordHash: 'hash',
      } as never;
      const usuario = { id: 'u1', email: 'new@example.com' } as never;
      prisma.usuario.create.mockResolvedValue(usuario);

      const result = await service.create(data);

      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data,
        omit: { passwordHash: true },
      });
      expect(result).toBe(usuario);
    });
  });

  describe('update', () => {
    it('calls prisma.usuario.update with where, data, and omit.passwordHash true', async () => {
      const usuario = { id: 'u1', email: 'updated@example.com' } as never;
      prisma.usuario.update.mockResolvedValue(usuario);

      const result = await service.update({
        where: { id: 'u1' },
        data: { email: 'updated@example.com' },
      });

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        data: { email: 'updated@example.com' },
        where: { id: 'u1' },
        omit: { passwordHash: true },
      });
      expect(result).toBe(usuario);
    });
  });

  describe('delete', () => {
    it('calls prisma.usuario.delete with where and omit.passwordHash true', async () => {
      const usuario = { id: 'u1' } as never;
      prisma.usuario.delete.mockResolvedValue(usuario);

      const result = await service.delete({ id: 'u1' });

      expect(prisma.usuario.delete).toHaveBeenCalledWith({
        where: { id: 'u1' },
        omit: { passwordHash: true },
      });
      expect(result).toBe(usuario);
    });
  });

  describe('count', () => {
    it('calls prisma.usuario.count with the given where filter', async () => {
      prisma.usuario.count.mockResolvedValue(3);

      const result = await service.count({ email: { contains: 'test' } });

      expect(prisma.usuario.count).toHaveBeenCalledWith({
        where: { email: { contains: 'test' } },
      });
      expect(result).toBe(3);
    });

    it('calls prisma.usuario.count without where when omitted', async () => {
      prisma.usuario.count.mockResolvedValue(50);

      const result = await service.count();

      expect(prisma.usuario.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(50);
    });
  });
});
