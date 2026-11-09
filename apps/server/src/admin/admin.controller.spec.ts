import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { hashPassword } from '../auth/auth.helpers';
import {
  cultivoAdminSearch,
  metodoImpactoAdminSearch,
  paisAdminSearch,
  parcelaAdminSearch,
  poblacionAdminSearch,
  provinciaAdminSearch,
  usuarioAdminSearch,
  organizacionAdminSearch,
  consentimientoAdminSearch,
} from './helpers/admin-search.helpers';

jest.mock('../auth/auth.helpers', () => ({
  hashPassword: jest.fn(),
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
jest.mock('../organizacion/organizacion.service', () => ({
  OrganizacionService: class OrganizacionService {},
}));

type MockService = Record<string, jest.Mock>;
type ServiceName =
  | 'usuarioService'
  | 'parcelaService'
  | 'cultivoService'
  | 'metodoImpactoService'
  | 'paisService'
  | 'provinciaService'
  | 'poblacionService'
  | 'organizacionService';
type ResourceConfig = {
  name: string;
  serviceName: Exclude<ServiceName, 'usuarioService' | 'organizacionService'>;
  listMethod: keyof AdminController;
  getMethod: keyof AdminController;
  search: (search?: string) => unknown;
  notFoundMessage: string;
  orderBy: unknown;
  include?: unknown;
};

const hashPasswordMock = jest.mocked(hashPassword);

const admin = { sub: 'admin-1', email: 'admin@example.com' };

const createMockService = (methods: string[]): MockService =>
  Object.fromEntries(methods.map((method) => [method, jest.fn()]));

const resourceConfigs: ResourceConfig[] = [
  {
    name: 'parcelas',
    serviceName: 'parcelaService',
    listMethod: 'getParcelas',
    getMethod: 'getParcela',
    search: parcelaAdminSearch,
    notFoundMessage: 'Parcela no encontrada',
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    include: {
      cultivos: { orderBy: { fechaInicioCampania: 'desc' } },
      propietario: {
        select: { id: true, nombre: true, apellidos: true, email: true },
      },
      poblacion: {
        select: {
          id: true,
          nombre: true,
          provincia: { select: { nombre: true } },
        },
      },
    },
  },
  {
    name: 'cultivos',
    serviceName: 'cultivoService',
    listMethod: 'getCultivos',
    getMethod: 'getCultivo',
    search: cultivoAdminSearch,
    notFoundMessage: 'Cultivo no encontrado',
    orderBy: [{ fechaInicioCampania: 'desc' }, { id: 'asc' }],
    include: { parcela: { select: { id: true, nombre: true } } },
  },
  {
    name: 'metodos de impacto',
    serviceName: 'metodoImpactoService',
    listMethod: 'getMetodosImpacto',
    getMethod: 'getMetodoImpacto',
    search: metodoImpactoAdminSearch,
    notFoundMessage: 'Método de impacto no encontrado',
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
  },
  {
    name: 'paises',
    serviceName: 'paisService',
    listMethod: 'getPaises',
    getMethod: 'getPais',
    search: paisAdminSearch,
    notFoundMessage: 'País no encontrado',
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
  },
  {
    name: 'provincias',
    serviceName: 'provinciaService',
    listMethod: 'getProvincias',
    getMethod: 'getProvincia',
    search: provinciaAdminSearch,
    notFoundMessage: 'Provincia no encontrada',
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    include: { pais: { select: { id: true, nombre: true } } },
  },
  {
    name: 'poblaciones',
    serviceName: 'poblacionService',
    listMethod: 'getPoblaciones',
    getMethod: 'getPoblacion',
    search: poblacionAdminSearch,
    notFoundMessage: 'Población no encontrada',
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
  },
];

describe('AdminController', () => {
  let services: Record<ServiceName, MockService>;
  let controller: AdminController;

  beforeEach(() => {
    const lookup = ['findMany', 'count', 'findOne'];
    services = {
      usuarioService: createMockService([
        'findAll',
        'count',
        'findOnePublic',
        'create',
        'update',
        'delete',
      ]),
      parcelaService: createMockService([...lookup, 'deleteWithCultivos']),
      cultivoService: createMockService([...lookup, 'deleteWithResultado']),
      metodoImpactoService: createMockService(lookup),
      paisService: createMockService(lookup),
      provinciaService: createMockService(lookup),
      poblacionService: createMockService(lookup),
      organizacionService: createMockService([
        'findMany',
        'count',
        'findOneAdmin',
        'eliminar',
        'findManyConsentimientos',
        'countConsentimientos',
        'findConsentimiento',
      ]),
    };
    controller = new AdminController(
      services.usuarioService as never,
      services.parcelaService as never,
      services.cultivoService as never,
      services.metodoImpactoService as never,
      services.paisService as never,
      services.provinciaService as never,
      services.poblacionService as never,
      services.organizacionService as never,
    );
  });

  describe('usuarios', () => {
    it('delegates search and pagination and returns data with total', async () => {
      const usuarioService = services.usuarioService;
      const data = [{ id: 'user-1' }];
      const where = usuarioAdminSearch('admin');
      usuarioService.findAll.mockResolvedValue(data);
      usuarioService.count.mockResolvedValue(1);

      await expect(controller.getUsuarios('admin', '5', '10')).resolves.toEqual(
        { data, total: 1 },
      );
      expect(usuarioService.findAll).toHaveBeenCalledWith({
        where,
        orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }, { id: 'asc' }],
        skip: 5,
        take: 10,
      });
      expect(usuarioService.count).toHaveBeenCalledWith(where);
    });

    it.each([
      { found: { id: 'user-1' }, expected: { data: { id: 'user-1' } } },
      { found: null, expected: new NotFoundException('Usuario no encontrado') },
    ])('looks up a user by id (found: $found)', async ({ found, expected }) => {
      const usuarioService = services.usuarioService;
      usuarioService.findOnePublic.mockResolvedValue(found);

      const result = controller.getUsuario('user-1');

      if (expected instanceof Error) {
        await expect(result).rejects.toThrow(expected);
      } else {
        await expect(result).resolves.toEqual(expected);
      }
      expect(usuarioService.findOnePublic).toHaveBeenCalledWith({
        id: 'user-1',
      });
    });

    it('stores the hashed password when creating a user', async () => {
      const usuarioService = services.usuarioService;
      const body = {
        nombre: 'Test',
        apellidos: 'User',
        email: 'user@example.com',
        passwordHash: 'plain-password',
        rol: 'admin' as const,
      };
      const created = { id: 'user-1' };
      hashPasswordMock.mockResolvedValue('hashed-password');
      usuarioService.create.mockResolvedValue(created);

      await expect(controller.createUsuario(body)).resolves.toEqual({
        data: created,
      });
      expect(hashPasswordMock).toHaveBeenCalledWith('plain-password');
      expect(usuarioService.create).toHaveBeenCalledWith({
        ...body,
        passwordHash: 'hashed-password',
      });
    });

    it('stores the hashed password when updating a user', async () => {
      const usuarioService = services.usuarioService;
      const updated = { id: 'user-1' };
      hashPasswordMock.mockResolvedValue('hashed-password');
      usuarioService.update.mockResolvedValue(updated);

      await expect(
        controller.updateUsuario(admin, 'user-1', {
          nombre: 'Updated',
          passwordHash: 'plain-password',
        }),
      ).resolves.toEqual({ data: updated });
      expect(hashPasswordMock).toHaveBeenCalledWith('plain-password');
      expect(usuarioService.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nombre: 'Updated', passwordHash: 'hashed-password' },
      });
    });

    it('keeps the existing password when the update has none', async () => {
      const usuarioService = services.usuarioService;
      usuarioService.update.mockResolvedValue({ id: 'user-1' });

      await controller.updateUsuario(admin, 'user-1', { nombre: 'Updated' });

      expect(hashPasswordMock).not.toHaveBeenCalled();
      expect(usuarioService.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nombre: 'Updated' },
      });
    });

    it('delegates user deletion by id and wraps the result', async () => {
      const usuarioService = services.usuarioService;
      const deleted = { id: 'user-1' };
      usuarioService.delete.mockResolvedValue(deleted);

      await expect(controller.deleteUsuario(admin, 'user-1')).resolves.toEqual({
        data: deleted,
      });
      expect(usuarioService.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('refuses to delete the logged-in admin', async () => {
      await expect(controller.deleteUsuario(admin, admin.sub)).rejects.toThrow(
        BadRequestException,
      );
      expect(services.usuarioService.delete).not.toHaveBeenCalled();
    });

    it('refuses to remove the admin role from the logged-in admin', async () => {
      await expect(
        controller.updateUsuario(admin, admin.sub, { rol: 'usuario' }),
      ).rejects.toThrow(BadRequestException);
      expect(services.usuarioService.update).not.toHaveBeenCalled();
    });
  });

  describe('resources', () => {
    it.each(resourceConfigs)(
      'lists $name with search, pagination, count, and response wrapping',
      async (config) => {
        const service = services[config.serviceName];
        const data = [{ id: `${config.name}-1` }];
        const where = config.search('search-term');
        service.findMany.mockResolvedValue(data);
        service.count.mockResolvedValue(1);

        await expect(
          callController(config.listMethod, 'search-term', '2', '20'),
        ).resolves.toEqual({ data, total: 1 });
        expect(service.findMany).toHaveBeenCalledWith({
          where,
          orderBy: config.orderBy,
          skip: 2,
          take: 20,
          ...(config.include ? { include: config.include } : {}),
        });
        expect(service.count).toHaveBeenCalledWith(where);
      },
    );

    it('filters parcelas without poblacion, combined with the search', async () => {
      const parcelaService = services.parcelaService;
      parcelaService.findMany.mockResolvedValue([]);
      parcelaService.count.mockResolvedValue(0);

      await controller.getParcelas(undefined, '0', '5', 'true');
      expect(parcelaService.count).toHaveBeenCalledWith({ idPoblacion: null });

      await controller.getParcelas('field', '0', '5', 'true');
      expect(parcelaService.count).toHaveBeenLastCalledWith({
        AND: [parcelaAdminSearch('field'), { idPoblacion: null }],
      });
    });

    it('returns the record count of every entity', async () => {
      services.usuarioService.count.mockResolvedValue(3);
      services.parcelaService.count.mockImplementation(
        (where?: Record<string, unknown>) =>
          Promise.resolve(where?.idPoblacion === null ? 2 : 10),
      );
      services.cultivoService.count.mockResolvedValue(20);
      services.metodoImpactoService.count.mockResolvedValue(1);
      services.paisService.count.mockResolvedValue(2);
      services.provinciaService.count.mockResolvedValue(70);
      services.poblacionService.count.mockResolvedValue(8000);
      services.organizacionService.count.mockResolvedValue(4);
      services.organizacionService.countConsentimientos.mockResolvedValue(12);

      await expect(controller.getResumen()).resolves.toEqual({
        data: {
          usuarios: 3,
          parcelas: 10,
          parcelasSinPoblacion: 2,
          cultivos: 20,
          'metodos-impacto': 1,
          paises: 2,
          provincias: 70,
          poblaciones: 8000,
          organizaciones: 4,
          consentimientos: 12,
        },
      });
    });

    it.each(
      resourceConfigs.flatMap((config) => [
        { ...config, found: { id: 'record-1' } },
        { ...config, found: null },
      ]),
    )('looks up $name by id (found: $found)', async (config) => {
      const service = services[config.serviceName];
      service.findOne.mockResolvedValue(config.found);

      const result = callController(config.getMethod, 'record-1');

      if (config.found) {
        await expect(result).resolves.toEqual({ data: config.found });
      } else {
        await expect(result).rejects.toThrow(
          new NotFoundException(config.notFoundMessage),
        );
      }
      expect(service.findOne).toHaveBeenCalledWith({ id: 'record-1' });
    });

    it.each([
      {
        name: 'parcelas',
        method: 'deleteParcela',
        serviceName: 'parcelaService',
        serviceMethod: 'deleteWithCultivos',
      },
      {
        name: 'cultivos',
        method: 'deleteCultivo',
        serviceName: 'cultivoService',
        serviceMethod: 'deleteWithResultado',
      },
    ] as const)(
      'deletes $name together with their dependents',
      async ({ method, serviceName, serviceMethod }) => {
        const deleteMock = services[serviceName][serviceMethod];
        const deleted = { id: 'record-1' };
        deleteMock.mockResolvedValue(deleted);

        await expect(callController(method, 'record-1')).resolves.toEqual({
          data: deleted,
        });
        expect(deleteMock).toHaveBeenCalledWith('record-1');
      },
    );
  });

  describe('organizaciones y consentimientos', () => {
    it.each([
      {
        name: 'organizaciones',
        list: 'getOrganizaciones',
        findMany: 'findMany',
        count: 'count',
        search: organizacionAdminSearch,
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      },
      {
        name: 'consentimientos',
        list: 'getConsentimientos',
        findMany: 'findManyConsentimientos',
        count: 'countConsentimientos',
        search: consentimientoAdminSearch,
        orderBy: [{ fechaSolicitud: 'desc' }, { id: 'asc' }],
      },
    ] as const)(
      'lists $name with search and pagination',
      async ({ list, findMany, count, search, orderBy }) => {
        const service = services.organizacionService;
        const data = [{ id: 'record-1' }];
        service[findMany].mockResolvedValue(data);
        service[count].mockResolvedValue(1);

        await expect(
          callController(list, 'coop', '10', '500'),
        ).resolves.toEqual({ data, total: 1 });
        expect(service[findMany]).toHaveBeenCalledWith({
          where: search('coop'),
          orderBy,
          skip: 10,
          take: 100,
        });
        expect(service[count]).toHaveBeenCalledWith(search('coop'));
      },
    );

    it.each([
      {
        method: 'getOrganizacion',
        serviceMethod: 'findOneAdmin',
        notFound: 'Organización no encontrada',
      },
      {
        method: 'getConsentimiento',
        serviceMethod: 'findConsentimiento',
        notFound: 'Consentimiento no encontrado',
      },
    ] as const)(
      '$method returns the record or 404',
      async ({ method, serviceMethod, notFound }) => {
        const lookup = services.organizacionService[serviceMethod];
        lookup.mockResolvedValueOnce({ id: 'record-1' });
        lookup.mockResolvedValueOnce(null);

        await expect(callController(method, 'record-1')).resolves.toEqual({
          data: { id: 'record-1' },
        });
        await expect(callController(method, 'record-1')).rejects.toStrictEqual(
          new NotFoundException(notFound),
        );
        expect(lookup).toHaveBeenCalledWith('record-1');
      },
    );

    it('deletes an organization through the service, which notifies its members', async () => {
      const deleted = { id: 'org-1', nombre: 'Coop' };
      services.organizacionService.eliminar.mockResolvedValue(deleted);

      await expect(controller.deleteOrganizacion('org-1')).resolves.toEqual({
        data: deleted,
      });
      expect(services.organizacionService.eliminar).toHaveBeenCalledWith(
        'org-1',
      );
    });
  });

  function callController(method: keyof AdminController, ...args: unknown[]) {
    return (controller[method] as (...methodArgs: unknown[]) => unknown)(
      ...args,
    );
  }
});
