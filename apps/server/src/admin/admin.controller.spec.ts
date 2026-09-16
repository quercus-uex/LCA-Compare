import { NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AdminController } from './admin.controller';

jest.mock('argon2', () => ({
  argon2id: 2,
  hash: jest.fn(),
}));
jest.mock('../usuario/usuario.service', () => ({
  UsuarioService: class UsuarioService {},
}));
jest.mock('../parcela/parcela.service', () => ({
  ParcelaService: class ParcelaService {},
}));
jest.mock('../cultivo/cultivo.service', () => ({
  CultivoService: class CultivoService {},
}));
jest.mock('../metodoimpacto/metodoimpacto.service', () => ({
  MetodoImpactoService: class MetodoImpactoService {},
}));
jest.mock('../pais/pais.service', () => ({
  PaisService: class PaisService {},
}));
jest.mock('../provincia/provincia.service', () => ({
  ProvinciaService: class ProvinciaService {},
}));
jest.mock('../poblacion/poblacion.service', () => ({
  PoblacionService: class PoblacionService {},
}));

type MockService = Record<string, jest.Mock>;
type ResourceConfig = {
  name: string;
  serviceName:
    | 'parcelaService'
    | 'cultivoService'
    | 'metodoImpactoService'
    | 'paisService'
    | 'provinciaService'
    | 'poblacionService';
  listMethod: keyof AdminController;
  getMethod: keyof AdminController;
  createMethod: keyof AdminController;
  updateMethod: keyof AdminController;
  deleteMethod: keyof AdminController;
  searchFields: string[];
  notFoundMessage: string;
  include?: unknown;
};

const hashMock = jest.mocked(argon2.hash);

const textSearch = (fields: string[], search: string) => ({
  OR: fields.map((field) => ({
    [field]: { contains: search, mode: 'insensitive' },
  })),
});

const createMockService = (methods: string[]): MockService =>
  Object.fromEntries(methods.map((method) => [method, jest.fn()]));

const resourceConfigs: ResourceConfig[] = [
  {
    name: 'parcelas',
    serviceName: 'parcelaService',
    listMethod: 'getParcelas',
    getMethod: 'getParcela',
    createMethod: 'createParcela',
    updateMethod: 'updateParcela',
    deleteMethod: 'deleteParcela',
    searchFields: [
      'nombre',
      'sigpac',
      'refCat',
      'ptIdParcela',
      'idPropietario',
    ],
    notFoundMessage: 'Parcela no encontrada',
    include: { cultivos: { orderBy: { fechaInicioCampania: 'desc' } } },
  },
  {
    name: 'cultivos',
    serviceName: 'cultivoService',
    listMethod: 'getCultivos',
    getMethod: 'getCultivo',
    createMethod: 'createCultivo',
    updateMethod: 'updateCultivo',
    deleteMethod: 'deleteCultivo',
    searchFields: ['tipo', 'idParcela'],
    notFoundMessage: 'Cultivo no encontrado',
  },
  {
    name: 'metodos de impacto',
    serviceName: 'metodoImpactoService',
    listMethod: 'getMetodosImpacto',
    getMethod: 'getMetodoImpacto',
    createMethod: 'createMetodoImpacto',
    updateMethod: 'updateMetodoImpacto',
    deleteMethod: 'deleteMetodoImpacto',
    searchFields: ['id', 'nombre'],
    notFoundMessage: 'Método de impacto no encontrado',
  },
  {
    name: 'paises',
    serviceName: 'paisService',
    listMethod: 'getPaises',
    getMethod: 'getPais',
    createMethod: 'createPais',
    updateMethod: 'updatePais',
    deleteMethod: 'deletePais',
    searchFields: ['nombre', 'codigo'],
    notFoundMessage: 'País no encontrado',
  },
  {
    name: 'provincias',
    serviceName: 'provinciaService',
    listMethod: 'getProvincias',
    getMethod: 'getProvincia',
    createMethod: 'createProvincia',
    updateMethod: 'updateProvincia',
    deleteMethod: 'deleteProvincia',
    searchFields: ['nombre', 'idPais'],
    notFoundMessage: 'Provincia no encontrada',
  },
  {
    name: 'poblaciones',
    serviceName: 'poblacionService',
    listMethod: 'getPoblaciones',
    getMethod: 'getPoblacion',
    createMethod: 'createPoblacion',
    updateMethod: 'updatePoblacion',
    deleteMethod: 'deletePoblacion',
    searchFields: ['nombre', 'idProvincia'],
    notFoundMessage: 'Población no encontrada',
  },
];

describe('AdminController', () => {
  let usuarioService: MockService;
  let parcelaService: MockService;
  let cultivoService: MockService;
  let metodoImpactoService: MockService;
  let paisService: MockService;
  let provinciaService: MockService;
  let poblacionService: MockService;
  let controller: AdminController;

  beforeEach(() => {
    usuarioService = createMockService([
      'findAll',
      'count',
      'findOnePublic',
      'create',
      'update',
      'delete',
    ]);
    parcelaService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    cultivoService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    metodoImpactoService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    paisService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    provinciaService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    poblacionService = createMockService([
      'findMany',
      'count',
      'findOne',
      'create',
      'update',
      'delete',
    ]);
    controller = new AdminController(
      usuarioService as never,
      parcelaService as never,
      cultivoService as never,
      metodoImpactoService as never,
      paisService as never,
      provinciaService as never,
      poblacionService as never,
    );
  });

  describe('usuarios', () => {
    it('delegates search and pagination and returns data with total', async () => {
      const data = [{ id: 'user-1' }];
      const where = textSearch(
        ['nombre', 'apellidos', 'email', 'rol'],
        'admin',
      );
      usuarioService.findAll.mockResolvedValue(data);
      usuarioService.count.mockResolvedValue(1);

      await expect(controller.getUsuarios('admin', '5', '10')).resolves.toEqual(
        {
          data,
          total: 1,
        },
      );
      expect(usuarioService.findAll).toHaveBeenCalledWith({
        where,
        skip: 5,
        take: 10,
      });
      expect(usuarioService.count).toHaveBeenCalledWith(where);
    });

    it('wraps an existing user lookup', async () => {
      const data = { id: 'user-1' };
      usuarioService.findOnePublic.mockResolvedValue(data);

      await expect(controller.getUsuario('user-1')).resolves.toEqual({ data });
      expect(usuarioService.findOnePublic).toHaveBeenCalledWith({
        id: 'user-1',
      });
    });

    it('throws not found for a missing user lookup', async () => {
      usuarioService.findOnePublic.mockResolvedValue(null);

      await expect(controller.getUsuario('missing-user')).rejects.toThrow(
        new NotFoundException('Usuario no encontrado'),
      );
    });

    it('hashes password input before creating a user', async () => {
      const body = {
        nombre: 'Test',
        apellidos: 'User',
        email: 'user@example.com',
        passwordHash: 'plain-password',
        rol: 'admin' as const,
      };
      const created = { id: 'user-1' };
      hashMock.mockResolvedValue('hashed-password');
      usuarioService.create.mockResolvedValue(created);

      await expect(controller.createUsuario(body)).resolves.toEqual({
        data: created,
      });
      expect(hashMock).toHaveBeenCalledWith('plain-password', {
        type: argon2.argon2id,
      });
      expect(usuarioService.create).toHaveBeenCalledWith({
        nombre: 'Test',
        apellidos: 'User',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        rol: 'admin',
      });
    });

    it('hashes string password input before updating a user', async () => {
      const body = { nombre: 'Updated', passwordHash: 'plain-password' };
      const updated = { id: 'user-1' };
      hashMock.mockResolvedValue('hashed-password');
      usuarioService.update.mockResolvedValue(updated);

      await expect(controller.updateUsuario('user-1', body)).resolves.toEqual({
        data: updated,
      });
      expect(hashMock).toHaveBeenCalledWith('plain-password', {
        type: argon2.argon2id,
      });
      expect(usuarioService.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nombre: 'Updated', passwordHash: 'hashed-password' },
      });
    });

    it('delegates user deletion by id and wraps the result', async () => {
      const deleted = { id: 'user-1' };
      usuarioService.delete.mockResolvedValue(deleted);

      await expect(controller.deleteUsuario('user-1')).resolves.toEqual({
        data: deleted,
      });
      expect(usuarioService.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });
  });

  describe('resources', () => {
    it.each(resourceConfigs)(
      'lists $name with search, pagination, count, and response wrapping',
      async (config) => {
        const service = serviceFor(config.serviceName);
        const data = [{ id: `${config.name}-1` }];
        const where = textSearch(config.searchFields, 'search-term');
        const expectedFindManyArgs: Record<string, unknown> = {
          where,
          skip: 2,
          take: 20,
        };
        if (config.include) expectedFindManyArgs.include = config.include;
        service.findMany.mockResolvedValue(data);
        service.count.mockResolvedValue(1);

        await expect(
          callController(config.listMethod, 'search-term', '2', '20'),
        ).resolves.toEqual({ data, total: 1 });
        expect(service.findMany).toHaveBeenCalledWith(expectedFindManyArgs);
        expect(service.count).toHaveBeenCalledWith(where);
      },
    );

    it('requests parcelas with cultivos ordered by descending campaign start date', async () => {
      parcelaService.findMany.mockResolvedValue([]);
      parcelaService.count.mockResolvedValue(0);

      await controller.getParcelas('field', '0', '5');
      expect(parcelaService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            cultivos: { orderBy: { fechaInicioCampania: 'desc' } },
          },
        }),
      );
    });

    it.each(resourceConfigs)(
      'wraps an existing $name lookup',
      async (config) => {
        const service = serviceFor(config.serviceName);
        const data = { id: `${config.name}-1` };
        service.findOne.mockResolvedValue(data);

        await expect(
          callController(config.getMethod, data.id),
        ).resolves.toEqual({
          data,
        });
        expect(service.findOne).toHaveBeenCalledWith({ id: data.id });
      },
    );

    it.each(resourceConfigs)(
      'throws not found for missing $name lookups',
      async (config) => {
        const service = serviceFor(config.serviceName);
        service.findOne.mockResolvedValue(null);

        await expect(
          callController(config.getMethod, 'missing-id'),
        ).rejects.toThrow(new NotFoundException(config.notFoundMessage));
      },
    );

    it.each(resourceConfigs)(
      'passes $name create bodies to the service',
      async (config) => {
        const service = serviceFor(config.serviceName);
        const body = { nombre: `${config.name} name` };
        const created = { id: `${config.name}-1` };
        service.create.mockResolvedValue(created);

        await expect(
          callController(config.createMethod, body),
        ).resolves.toEqual({
          data: created,
        });
        expect(service.create).toHaveBeenCalledWith(body);
      },
    );

    it.each(resourceConfigs)(
      'passes $name update ids and bodies to the service',
      async (config) => {
        const service = serviceFor(config.serviceName);
        const body = { nombre: `${config.name} updated` };
        const updated = { id: `${config.name}-1` };
        service.update.mockResolvedValue(updated);

        await expect(
          callController(config.updateMethod, updated.id, body),
        ).resolves.toEqual({ data: updated });
        expect(service.update).toHaveBeenCalledWith({
          where: { id: updated.id },
          data: body,
        });
      },
    );

    it.each(resourceConfigs)(
      'delegates $name deletion by id',
      async (config) => {
        const service = serviceFor(config.serviceName);
        const deleted = { id: `${config.name}-1` };
        service.delete.mockResolvedValue(deleted);

        await expect(
          callController(config.deleteMethod, deleted.id),
        ).resolves.toEqual({
          data: deleted,
        });
        expect(service.delete).toHaveBeenCalledWith({ id: deleted.id });
      },
    );
  });

  function serviceFor(serviceName: ResourceConfig['serviceName']): MockService {
    return {
      parcelaService,
      cultivoService,
      metodoImpactoService,
      paisService,
      provinciaService,
      poblacionService,
    }[serviceName];
  }

  function callController(method: keyof AdminController, ...args: unknown[]) {
    return (controller[method] as (...methodArgs: unknown[]) => unknown)(
      ...args,
    );
  }
});
