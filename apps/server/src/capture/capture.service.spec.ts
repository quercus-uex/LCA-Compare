import { BadRequestException, Logger } from '@nestjs/common';
import generator from 'generate-password';
import { CaptureService } from './capture.service';
import { ParcelaService } from '../parcela/parcela.service';
import { UsuarioService } from '../usuario/usuario.service';
import { MailerService } from '../mailer/mailer.service';
import { CultivoService } from '../cultivo/cultivo.service';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { SigpacCaptureStrategy } from './strategies/sigpac-capture.strategy';
import { CatastroCaptureStrategy } from './strategies/catastro-capture.strategy';
import { PredialCaptureStrategy } from './strategies/predial-capture.strategy';
import type { Feature, Polygon } from 'geojson';
import type {
  CaptureStrategy,
  ParcelaResolution,
} from './strategies/capture-strategy.interface';
import { hashPassword } from '../auth/auth.helpers';

jest.mock('../auth/auth.helpers', () => ({
  hashPassword: jest.fn(),
}));

jest.mock('generate-password', () => ({
  generate: jest.fn(),
}));

const hashPasswordMock = jest.mocked(hashPassword);
const generatorGenerateMock = jest.mocked(generator.generate);

// Propiedades en lugar de métodos, para que los `expect(strategy.x)` no lean
// métodos sin enlazar
type MockStrategy = {
  matches: jest.MockedFunction<CaptureStrategy['matches']>;
  resolveParcela: jest.MockedFunction<CaptureStrategy['resolveParcela']>;
};

function createMockStrategy(): MockStrategy {
  return {
    matches: jest.fn(),
    resolveParcela: jest.fn(),
  };
}

describe('CaptureService', () => {
  let service: CaptureService;
  let parcelaService: jest.Mocked<
    Pick<ParcelaService, 'findMany' | 'create' | 'setGeom'>
  >;
  let usuarioService: jest.Mocked<
    Pick<UsuarioService, 'findOnePublic' | 'create'>
  >;
  let mailerService: jest.Mocked<Pick<MailerService, 'sendNewUserMail'>>;
  let cultivoService: jest.Mocked<
    Pick<CultivoService, 'findOne' | 'create' | 'update'>
  >;
  let resultadoImpactoService: jest.Mocked<
    Pick<ResultadoImpactoService, 'create' | 'delete'>
  >;
  let sigpacStrategy: MockStrategy;
  let catastroStrategy: MockStrategy;
  let predialStrategy: MockStrategy;

  beforeEach(() => {
    parcelaService = {
      findMany: jest.fn(),
      create: jest.fn(),
      setGeom: jest.fn(),
    };
    usuarioService = { findOnePublic: jest.fn(), create: jest.fn() };
    mailerService = { sendNewUserMail: jest.fn() };
    cultivoService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    resultadoImpactoService = { create: jest.fn(), delete: jest.fn() };
    sigpacStrategy = createMockStrategy();
    catastroStrategy = createMockStrategy();
    predialStrategy = createMockStrategy();

    service = new CaptureService(
      parcelaService as unknown as ParcelaService,
      usuarioService as unknown as UsuarioService,
      mailerService as unknown as MailerService,
      cultivoService as unknown as CultivoService,
      resultadoImpactoService as unknown as ResultadoImpactoService,
      sigpacStrategy as unknown as SigpacCaptureStrategy,
      catastroStrategy as unknown as CatastroCaptureStrategy,
      predialStrategy as unknown as PredialCaptureStrategy,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkUsuario', () => {
    const mUsuario = {
      id: 1,
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@example.com',
    };

    it('returns an existing public user without creating one', async () => {
      const existing = { id: 'u1', email: 'ana@example.com' } as any;
      usuarioService.findOnePublic.mockResolvedValue(existing);

      const result = await service.checkUsuario(mUsuario);

      expect(result).toBe(existing);
      expect(usuarioService.findOnePublic).toHaveBeenCalledWith({
        email: 'ana@example.com',
      });
      expect(usuarioService.create).not.toHaveBeenCalled();
    });

    it('creates a missing user with role usuario and mails the generated password that was hashed', async () => {
      usuarioService.findOnePublic.mockResolvedValue(null);
      generatorGenerateMock.mockReturnValue('temp-pass');
      hashPasswordMock.mockResolvedValue('hashed-pass');
      const created = { id: 'u2', email: 'ana@example.com' } as any;
      usuarioService.create.mockResolvedValue(created);
      mailerService.sendNewUserMail.mockResolvedValue(undefined);

      const result = await service.checkUsuario(mUsuario);

      expect(result).toBe(created);
      expect(hashPasswordMock).toHaveBeenCalledWith('temp-pass');
      expect(usuarioService.create).toHaveBeenCalledWith({
        nombre: 'Ana',
        apellidos: 'García',
        email: 'ana@example.com',
        passwordHash: 'hashed-pass',
        rol: 'usuario',
      });
      expect(mailerService.sendNewUserMail).toHaveBeenCalledWith(
        'ana@example.com',
        'temp-pass',
      );
    });

    it('still returns the created user and logs when the new-user mail fails', async () => {
      usuarioService.findOnePublic.mockResolvedValue(null);
      const created = { id: 'u3', email: 'ana@example.com' } as any;
      usuarioService.create.mockResolvedValue(created);
      mailerService.sendNewUserMail.mockRejectedValue(
        new Error('SMTP not configured'),
      );
      const loggerError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      await expect(service.checkUsuario(mUsuario)).resolves.toBe(created);
      expect(loggerError).toHaveBeenCalledWith(
        expect.stringContaining('SMTP not configured'),
      );
    });
  });

  describe('checkParcela', () => {
    const idPropietario = 'u1';

    it.each([
      {
        kind: 'SIGPAC',
        mParcela: {
          es_sigpac: { provincia: 41, municipio: 91, poligono: 3, parcela: 45 },
        },
        condition: { sigpac: '41:91:0:0:3:45:1' },
      },
      {
        kind: 'refCat',
        mParcela: {
          es_sigpac: { provincia: undefined },
          es_referencia_catastral: '4191003AG3456S0001EP',
        },
        condition: { refCat: '4191003AG3456S0001EP' },
      },
      {
        kind: 'ptIdParcela',
        mParcela: { pt_id_parcela_predial: '1234-56' },
        condition: { ptIdParcela: '1234-56' },
      },
    ])(
      'reuses an existing parcel found by its $kind',
      async ({ mParcela, condition }) => {
        const existing = { id: 'p1' } as any;
        parcelaService.findMany.mockResolvedValue([existing]);

        const result = await service.checkParcela(idPropietario, {
          id: 10,
          nombre: 'Test parcel',
          ...mParcela,
        });

        expect(result).toBe(existing);
        expect(parcelaService.findMany).toHaveBeenCalledWith({
          where: { idPropietario, OR: [condition] },
        });
        expect(parcelaService.create).not.toHaveBeenCalled();
      },
    );

    describe('missing parcel creation', () => {
      const polygon: Feature<Polygon> = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {},
      };

      function mockResolution(
        strategy: jest.Mocked<CaptureStrategy>,
        resolution: Partial<ParcelaResolution>,
      ) {
        strategy.matches.mockReturnValue(true);
        strategy.resolveParcela.mockResolvedValue({
          polygon,
          poblacion: { id: 'pop1' } as any,
          sigpacKey: null,
          ...resolution,
        });
      }

      it('delegates to the matching strategy and persists parcela with geometry', async () => {
        const mParcela = {
          es_sigpac: { provincia: 41 },
          es_referencia_catastral: undefined,
          pt_id_parcela_predial: undefined,
          nombre: 'New parcel',
        } as any;
        parcelaService.findMany.mockResolvedValue([]);
        mockResolution(sigpacStrategy, {
          sigpacKey: '41:91:0:0:3:45:1',
        });
        const created = { id: 'p2' } as any;
        parcelaService.create.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(sigpacStrategy.resolveParcela).toHaveBeenCalledWith(mParcela);
        expect(parcelaService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: '41:91:0:0:3:45:1',
            nombre: 'New parcel',
            propietario: { connect: { id: 'u1' } },
            poblacion: { connect: { id: 'pop1' } },
          }),
        );
        expect(parcelaService.setGeom).toHaveBeenCalledWith(
          'p2',
          polygon.geometry,
        );
      });

      it('passes through refCat and ptIdParcela from input metadata', async () => {
        const mParcela = {
          es_sigpac: { provincia: undefined },
          es_referencia_catastral: '4191003AG3456S0001EP',
          pt_id_parcela_predial: undefined,
          nombre: 'Catastral parcel',
        } as any;
        parcelaService.findMany.mockResolvedValue([]);
        mockResolution(catastroStrategy, {});
        const created = { id: 'p3' } as any;
        parcelaService.create.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(catastroStrategy.resolveParcela).toHaveBeenCalledWith(mParcela);
        expect(parcelaService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: null,
            refCat: '4191003AG3456S0001EP',
            ptIdParcela: undefined,
          }),
        );
      });

      it('persists the parcela without geometry or poblacion when geolocation fails', async () => {
        const mParcela = {
          es_sigpac: { provincia: 41 },
          es_referencia_catastral: undefined,
          pt_id_parcela_predial: undefined,
          nombre: 'Unlocated parcel',
        } as any;
        parcelaService.findMany.mockResolvedValue([]);
        mockResolution(sigpacStrategy, {
          polygon: null,
          poblacion: null,
          sigpacKey: '41:91:0:0:3:45:1',
        });
        const created = { id: 'p4' } as any;
        parcelaService.create.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(parcelaService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: '41:91:0:0:3:45:1',
            poblacion: undefined,
          }),
        );
        expect(parcelaService.setGeom).not.toHaveBeenCalled();
      });

      it('keeps the parcela when storing the geometry fails', async () => {
        const mParcela = {
          es_referencia_catastral: '4191003AG3456S0001EP',
          nombre: 'Bad geometry parcel',
        } as any;
        parcelaService.findMany.mockResolvedValue([]);
        mockResolution(catastroStrategy, {});
        const created = { id: 'p5' } as any;
        parcelaService.create.mockResolvedValue(created);
        parcelaService.setGeom.mockRejectedValue(new Error('invalid GeoJSON'));
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(parcelaService.setGeom).toHaveBeenCalledWith(
          'p5',
          polygon.geometry,
        );
      });
    });

    it('throws BadRequestException when no strategy matches the parcel metadata', async () => {
      const mMissing = {
        es_sigpac: { provincia: undefined },
        es_referencia_catastral: undefined,
        pt_id_parcela_predial: undefined,
        nombre: 'Bad parcel',
      } as any;
      parcelaService.findMany.mockResolvedValue([]);
      sigpacStrategy.matches.mockReturnValue(false);
      catastroStrategy.matches.mockReturnValue(false);
      predialStrategy.matches.mockReturnValue(false);

      await expect(
        service.checkParcela(idPropietario, mMissing),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkCultivo', () => {
    const idParcela = 'p1';
    const idResultadoImpacto = 'ri1';
    const mCultivo = {
      fecha_inicio_campania: 20250901,
      produccion: 1200,
      tipo: 'trigo',
      ciclo: 1,
      superficie_cultivada: 5.2,
      consumo_agua: 300,
    } as any;

    it('rejects invalid campaign start dates with BadRequestException before any lookup', async () => {
      await expect(
        service.checkCultivo(idParcela, idResultadoImpacto, {
          ...mCultivo,
          fecha_inicio_campania: 99999999,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(cultivoService.findOne).not.toHaveBeenCalled();
    });

    it('creates a missing crop with parsed UTC campaign date, crop fields, parcel connection, and impact result connection', async () => {
      cultivoService.findOne.mockResolvedValue(null);
      const created = { id: 'c1' } as any;
      cultivoService.create.mockResolvedValue(created);

      const result = await service.checkCultivo(
        idParcela,
        idResultadoImpacto,
        mCultivo,
      );

      expect(result).toBe(created);
      expect(cultivoService.findOne).toHaveBeenCalledWith({
        fechaInicioCampania_idParcela: {
          fechaInicioCampania: new Date(Date.UTC(2025, 8, 1)),
          idParcela: 'p1',
        },
      });
      expect(cultivoService.create).toHaveBeenCalledWith({
        produccion: 1200,
        tipo: 'trigo',
        ciclo: 1,
        fechaInicioCampania: new Date(Date.UTC(2025, 8, 1)),
        parcela: { connect: { id: 'p1' } },
        superficieCultivada: 5.2,
        consumoAgua: 300,
        resultadoImpacto: { connect: { id: 'ri1' } },
      });
    });

    it('updates an existing crop with the resent crop data and new impact result, and deletes the previous impact result', async () => {
      const existing = { id: 'c1', idResultadoImpacto: 'old-ri' } as any;
      const updated = { id: 'c1', idResultadoImpacto: 'ri1' } as never;
      cultivoService.findOne.mockResolvedValue(existing);
      cultivoService.update.mockResolvedValue(updated);

      const result = await service.checkCultivo(
        idParcela,
        idResultadoImpacto,
        mCultivo,
      );

      expect(result).toBe(updated);
      expect(cultivoService.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          produccion: 1200,
          tipo: 'trigo',
          ciclo: 1,
          superficieCultivada: 5.2,
          consumoAgua: 300,
          resultadoImpacto: { connect: { id: 'ri1' } },
        },
      });
      expect(resultadoImpactoService.delete).toHaveBeenCalledWith({
        id: 'old-ri',
      });
      expect(cultivoService.create).not.toHaveBeenCalled();
    });

    it('does not try to delete a previous impact result when the existing crop had none', async () => {
      cultivoService.findOne.mockResolvedValue({
        id: 'c1',
        idResultadoImpacto: null,
      } as never);
      cultivoService.update.mockResolvedValue({ id: 'c1' } as never);

      await service.checkCultivo(idParcela, idResultadoImpacto, mCultivo);

      expect(resultadoImpactoService.delete).not.toHaveBeenCalled();
    });
  });
});
