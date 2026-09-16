import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import generator from 'generate-password';
import { CaptureService } from './capture.service';
import { ParcelaService } from '../parcela/parcela.service';
import { PoblacionService } from '../poblacion/poblacion.service';
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

jest.mock('argon2', () => ({
  hash: jest.fn(),
  argon2id: 'argon2id',
}));

jest.mock('generate-password', () => ({
  generate: jest.fn(),
}));

const argon2HashMock = jest.mocked(argon2.hash);
const generatorGenerateMock = jest.mocked(generator.generate);

function createMockStrategy(): jest.Mocked<CaptureStrategy> {
  return {
    matches: jest.fn(),
    resolveParcela: jest.fn(),
  };
}

describe('CaptureService', () => {
  let service: CaptureService;
  let parcelaService: jest.Mocked<
    Pick<ParcelaService, 'findMany' | 'createWithGeom'>
  >;
  let poblacionService: jest.Mocked<PoblacionService>;
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
  let sigpacStrategy: jest.Mocked<CaptureStrategy>;
  let catastroStrategy: jest.Mocked<CaptureStrategy>;
  let predialStrategy: jest.Mocked<CaptureStrategy>;

  beforeEach(() => {
    parcelaService = { findMany: jest.fn(), createWithGeom: jest.fn() };
    poblacionService = {
      findByCatastroIds: jest.fn(),
    } as unknown as jest.Mocked<PoblacionService>;
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
      poblacionService,
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

    it('returns an existing public user without generating credentials, creating a user, or sending mail', async () => {
      const existing = { id: 'u1', email: 'ana@example.com' } as any;
      usuarioService.findOnePublic.mockResolvedValue(existing);

      const result = await service.checkUsuario(mUsuario);

      expect(result).toBe(existing);
      expect(usuarioService.findOnePublic).toHaveBeenCalledWith({
        email: 'ana@example.com',
      });
      expect(generatorGenerateMock).not.toHaveBeenCalled();
      expect(argon2HashMock).not.toHaveBeenCalled();
      expect(usuarioService.create).not.toHaveBeenCalled();
      expect(mailerService.sendNewUserMail).not.toHaveBeenCalled();
    });

    it('creates a missing user with argon2id password hashing, role usuario, and new-user mail notification', async () => {
      usuarioService.findOnePublic.mockResolvedValue(null);
      generatorGenerateMock.mockReturnValue('temp-pass');
      argon2HashMock.mockResolvedValue('hashed-pass');
      const created = { id: 'u2', email: 'ana@example.com' } as any;
      usuarioService.create.mockResolvedValue(created);
      mailerService.sendNewUserMail.mockResolvedValue(undefined);

      const result = await service.checkUsuario(mUsuario);

      expect(result).toBe(created);
      expect(generatorGenerateMock).toHaveBeenCalledWith({
        length: 10,
        uppercase: false,
      });
      expect(argon2HashMock).toHaveBeenCalledWith('temp-pass', {
        type: 'argon2id',
      });
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
  });

  describe('checkParcela', () => {
    const idPropietario = 'u1';

    describe('existing parcel reuse', () => {
      it('reuses an existing parcel matching SIGPAC key and does not invoke strategies or creation', async () => {
        const mParcela = {
          es_sigpac: {
            provincia: 41,
            municipio: 91,
            poligono: 3,
            parcela: 45,
          },
          es_referencia_catastral: undefined,
          pt_id_parcela_predial: undefined,
          nombre: 'Test parcel',
        } as any;
        const existing = { id: 'p1' } as any;
        parcelaService.findMany.mockResolvedValue([existing]);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(existing);
        expect(parcelaService.findMany).toHaveBeenCalledWith({
          where: {
            idPropietario,
            OR: [{ sigpac: '41:91:0:0:3:45:1' }],
          },
        });
        expect(sigpacStrategy.resolveParcela).not.toHaveBeenCalled();
        expect(parcelaService.createWithGeom).not.toHaveBeenCalled();
      });
    });

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
        parcelaService.createWithGeom.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(sigpacStrategy.matches).toHaveBeenCalledWith(mParcela);
        expect(sigpacStrategy.resolveParcela).toHaveBeenCalledWith(mParcela);
        expect(parcelaService.createWithGeom).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: '41:91:0:0:3:45:1',
            nombre: 'New parcel',
            propietario: { connect: { id: 'u1' } },
            poblacion: { connect: { id: 'pop1' } },
          }),
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
        parcelaService.createWithGeom.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mParcela);

        expect(result).toBe(created);
        expect(catastroStrategy.resolveParcela).toHaveBeenCalledWith(mParcela);
        expect(parcelaService.createWithGeom).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: null,
            refCat: '4191003AG3456S0001EP',
            ptIdParcela: undefined,
          }),
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

    it('rejects invalid campaign start dates with BadRequestException and avoids crop persistence calls', async () => {
      const mCultivo = {
        fecha_inicio_campania: 99999999,
        produccion: 100,
        tipo: 'trigo',
        ciclo: 1,
        superficie_cultivada: 5,
        consumo_agua: 200,
      } as any;

      await expect(
        service.checkCultivo(idParcela, idResultadoImpacto, mCultivo),
      ).rejects.toThrow(BadRequestException);

      expect(cultivoService.findOne).not.toHaveBeenCalled();
      expect(cultivoService.create).not.toHaveBeenCalled();
      expect(cultivoService.update).not.toHaveBeenCalled();
    });

    it('creates a missing crop with parsed UTC campaign date, crop fields, parcel connection, and impact result connection', async () => {
      const mCultivo = {
        fecha_inicio_campania: 20250901,
        produccion: 1200,
        tipo: 'trigo',
        ciclo: 1,
        superficie_cultivada: 5.2,
        consumo_agua: 300,
      } as any;

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

    it('updates an existing crop to connect the new impact result and deletes the previous impact result', async () => {
      const mCultivo = {
        fecha_inicio_campania: 20250901,
        produccion: 1200,
        tipo: 'trigo',
        ciclo: 1,
        superficie_cultivada: 5.2,
        consumo_agua: 300,
      } as any;

      const existing = { id: 'c1', idResultadoImpacto: 'old-ri' } as any;
      cultivoService.findOne.mockResolvedValue(existing);
      cultivoService.update.mockResolvedValue(existing);

      const result = await service.checkCultivo(
        idParcela,
        idResultadoImpacto,
        mCultivo,
      );

      expect(result).toBe(existing);
      expect(cultivoService.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { resultadoImpacto: { connect: { id: 'ri1' } } },
      });
      expect(resultadoImpactoService.delete).toHaveBeenCalledWith({
        id: 'old-ri',
      });
      expect(cultivoService.create).not.toHaveBeenCalled();
    });
  });
});
