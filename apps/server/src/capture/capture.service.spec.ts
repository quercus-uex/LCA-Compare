import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import generator from 'generate-password';
import { CaptureService } from './capture.service';
import { ParcelaService } from '../parcela/parcela.service';
import { CatastroService } from '../catastro/catastro.service';
import { PoblacionService } from '../poblacion/poblacion.service';
import { SigpacService } from '../sigpac/sigpac.service';
import { UsuarioService } from '../usuario/usuario.service';
import { MailerService } from '../mailer/mailer.service';
import { CultivoService } from '../cultivo/cultivo.service';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { PredialService } from '../predial/predial.service';
import { SigpacDto } from './dto/capture-input.dto';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  argon2id: 'argon2id',
}));

jest.mock('generate-password', () => ({
  generate: jest.fn(),
}));

const argon2HashMock = jest.mocked(argon2.hash);
const generatorGenerateMock = jest.mocked(generator.generate);

describe('CaptureService', () => {
  let service: CaptureService;
  let parcelaService: jest.Mocked<
    Pick<ParcelaService, 'findMany' | 'createWithGeom'>
  >;
  let catastroService: jest.Mocked<Pick<CatastroService, 'getPolygon'>>;
  let poblacionService: jest.Mocked<Pick<PoblacionService, 'findMany'>>;
  let sigpacService: jest.Mocked<Pick<SigpacService, 'getPolygon'>>;
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
  let predialService: jest.Mocked<Pick<PredialService, 'getPolygon'>>;

  beforeEach(() => {
    parcelaService = { findMany: jest.fn(), createWithGeom: jest.fn() };
    catastroService = { getPolygon: jest.fn() };
    poblacionService = { findMany: jest.fn() };
    sigpacService = { getPolygon: jest.fn() };
    usuarioService = { findOnePublic: jest.fn(), create: jest.fn() };
    mailerService = { sendNewUserMail: jest.fn() };
    cultivoService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    resultadoImpactoService = { create: jest.fn(), delete: jest.fn() };
    predialService = { getPolygon: jest.fn() };

    service = new CaptureService(
      parcelaService as unknown as ParcelaService,
      catastroService as unknown as CatastroService,
      poblacionService as unknown as PoblacionService,
      sigpacService as unknown as SigpacService,
      usuarioService as unknown as UsuarioService,
      mailerService as unknown as MailerService,
      cultivoService as unknown as CultivoService,
      resultadoImpactoService as unknown as ResultadoImpactoService,
      predialService as unknown as PredialService,
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

    describe('SIGPAC parcel', () => {
      const mSigpac = {
        id: 10,
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

      it('reuses an existing SIGPAC parcel and does not call geospatial lookup or parcel creation', async () => {
        const existing = { id: 'p1' } as any;
        parcelaService.findMany.mockResolvedValue([existing]);

        const result = await service.checkParcela(idPropietario, mSigpac);

        expect(result).toBe(existing);
        expect(parcelaService.findMany).toHaveBeenCalledWith({
          where: {
            idPropietario,
            OR: [{ sigpac: '41:91:0:0:3:45:1' }],
          },
        });
        expect(sigpacService.getPolygon).not.toHaveBeenCalled();
        expect(parcelaService.createWithGeom).not.toHaveBeenCalled();
      });

      it('creates a missing SIGPAC parcel using SigpacService, Spanish population lookup, computed SIGPAC key, and polygon geometry', async () => {
        parcelaService.findMany.mockResolvedValue([]);
        const polygon = {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {},
        } as any;
        sigpacService.getPolygon.mockResolvedValue(polygon);
        poblacionService.findMany.mockResolvedValue([{ id: 'pop1' }] as any);
        const created = { id: 'p2' } as any;
        parcelaService.createWithGeom.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mSigpac);

        expect(result).toBe(created);
        expect(sigpacService.getPolygon).toHaveBeenCalledWith(
          mSigpac.es_sigpac,
        );
        expect(poblacionService.findMany).toHaveBeenCalledWith({
          where: {
            provincia: { idCatastro: 41, pais: { codigo: 'ES' } },
            idCatastro: 91,
          },
        });
        expect(parcelaService.createWithGeom).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: '41:91:0:0:3:45:1',
            refCat: undefined,
            ptIdParcela: undefined,
            nombre: 'Test parcel',
            propietario: { connect: { id: 'u1' } },
            poblacion: { connect: { id: 'pop1' } },
          }),
          polygon.geometry,
        );
      });
    });

    describe('Spanish cadastral parcel', () => {
      const mCatastral = {
        id: 10,
        es_sigpac: { provincia: undefined },
        es_referencia_catastral: '4191003AG3456S0001EP',
        pt_id_parcela_predial: undefined,
        nombre: 'Cadastral parcel',
      } as any;

      it('creates a missing Spanish cadastral parcel using CatastroService, Spanish population lookup from reference segments, and polygon geometry', async () => {
        parcelaService.findMany.mockResolvedValue([]);
        const polygon = {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {},
        } as any;
        catastroService.getPolygon.mockResolvedValue(polygon);
        poblacionService.findMany.mockResolvedValue([{ id: 'pop2' }] as any);
        const created = { id: 'p3' } as any;
        parcelaService.createWithGeom.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mCatastral);

        expect(result).toBe(created);
        expect(catastroService.getPolygon).toHaveBeenCalledWith(
          '4191003AG3456S0001EP',
        );
        expect(poblacionService.findMany).toHaveBeenCalledWith({
          where: {
            provincia: { idCatastro: 41, pais: { codigo: 'ES' } },
            idCatastro: 910,
          },
        });
        expect(parcelaService.createWithGeom).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: null,
            refCat: '4191003AG3456S0001EP',
            ptIdParcela: undefined,
            nombre: 'Cadastral parcel',
            propietario: { connect: { id: 'u1' } },
            poblacion: { connect: { id: 'pop2' } },
          }),
          polygon.geometry,
        );
      });
    });

    describe('Portuguese predial parcel', () => {
      const mPredial = {
        id: 10,
        es_sigpac: { provincia: undefined },
        es_referencia_catastral: undefined,
        pt_id_parcela_predial: 'PT12345',
        nombre: 'Predial parcel',
      } as any;

      it('creates a missing Portuguese predial parcel using PredialService, Portuguese population lookup from polygon properties, and polygon geometry', async () => {
        parcelaService.findMany.mockResolvedValue([]);
        const polygon = {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: { provincia: 10, poblacion: 20 },
        } as any;
        predialService.getPolygon.mockResolvedValue(polygon);
        poblacionService.findMany.mockResolvedValue([{ id: 'pop3' }] as any);
        const created = { id: 'p4' } as any;
        parcelaService.createWithGeom.mockResolvedValue(created);

        const result = await service.checkParcela(idPropietario, mPredial);

        expect(result).toBe(created);
        expect(predialService.getPolygon).toHaveBeenCalledWith('PT12345');
        expect(poblacionService.findMany).toHaveBeenCalledWith({
          where: {
            provincia: { idCatastro: 10, pais: { codigo: 'PT' } },
            idCatastro: 20,
          },
        });
        expect(parcelaService.createWithGeom).toHaveBeenCalledWith(
          expect.objectContaining({
            sigpac: null,
            refCat: undefined,
            ptIdParcela: 'PT12345',
            nombre: 'Predial parcel',
            propietario: { connect: { id: 'u1' } },
            poblacion: { connect: { id: 'pop3' } },
          }),
          polygon.geometry,
        );
      });
    });

    it('rejects parcel metadata without SIGPAC province, Spanish cadastral reference, or Portuguese predial id', async () => {
      const mMissing = {
        id: 10,
        es_sigpac: { provincia: undefined },
        es_referencia_catastral: undefined,
        pt_id_parcela_predial: undefined,
        nombre: 'Bad parcel',
      } as any;
      parcelaService.findMany.mockResolvedValue([]);

      await expect(
        service.checkParcela(idPropietario, mMissing),
      ).rejects.toThrow(
        'Especifica un identificador de parcela (SIGPAC, Referencia catastral, Predial)',
      );
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
