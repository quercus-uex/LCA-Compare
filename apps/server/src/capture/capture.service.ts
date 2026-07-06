import { BadRequestException, Injectable } from '@nestjs/common';
import { CaptureInputDto } from './dto/capture-input.dto';
import { ParcelaService } from '../parcela/parcela.service';
import { Parcela, Cultivo } from '../generated/prisma/client';
import { PoblacionService } from '../poblacion/poblacion.service';
import { UsuarioPublico, UsuarioService } from '../usuario/usuario.service';
import * as argon2 from 'argon2';
import { MailerService } from '../mailer/mailer.service';
import generator from 'generate-password';
import { DateTime } from 'luxon';
import { CultivoService } from '../cultivo/cultivo.service';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import type {
  CaptureStrategy,
  ParcelaMetadata,
} from './strategies/capture-strategy.interface';
import { SigpacCaptureStrategy } from './strategies/sigpac-capture.strategy';
import { CatastroCaptureStrategy } from './strategies/catastro-capture.strategy';
import { PredialCaptureStrategy } from './strategies/predial-capture.strategy';

@Injectable()
export class CaptureService {
  private readonly strategies: CaptureStrategy[];

  constructor(
    private readonly parcelaService: ParcelaService,
    private readonly poblacionService: PoblacionService,
    private readonly usuarioService: UsuarioService,
    private readonly mailerService: MailerService,
    private readonly cultivoService: CultivoService,
    private readonly resultadoImpactoService: ResultadoImpactoService,
    sigpacStrategy: SigpacCaptureStrategy,
    catastroStrategy: CatastroCaptureStrategy,
    predialStrategy: PredialCaptureStrategy,
  ) {
    this.strategies = [sigpacStrategy, catastroStrategy, predialStrategy];
  }

  private selectStrategy(mParcela: ParcelaMetadata): CaptureStrategy {
    const strategy = this.strategies.find((s) => s.matches(mParcela));
    if (!strategy) {
      throw new BadRequestException(
        'Especifica un identificador de parcela (SIGPAC, Referencia catastral, Predial)',
      );
    }
    return strategy;
  }

  private async createParcela(
    idPropietario: string,
    mParcela: ParcelaMetadata,
  ): Promise<Parcela> {
    const strategy = this.selectStrategy(mParcela);
    const { polygon, poblacion, sigpacKey } =
      await strategy.resolveParcela(mParcela);

    return this.parcelaService.createWithGeom(
      {
        sigpac: sigpacKey,
        refCat: mParcela.es_referencia_catastral,
        ptIdParcela: mParcela.pt_id_parcela_predial,
        nombre: mParcela.nombre,
        propietario: { connect: { id: idPropietario } },
        poblacion: { connect: { id: poblacion.id } },
      },
      polygon.geometry,
    );
  }

  async checkParcela(
    idPropietario: string,
    mParcela: CaptureInputDto['metadatos']['parcela'],
  ) {
    const sigpac = mParcela.es_sigpac.provincia
      ? mParcela.es_sigpac
      : undefined;
    const refCat = mParcela.es_referencia_catastral
      ? mParcela.es_referencia_catastral
      : undefined;
    const ptIdParcela = mParcela.pt_id_parcela_predial
      ? mParcela.pt_id_parcela_predial
      : undefined;

    const conditions = [
      sigpac
        ? {
            sigpac: `${sigpac?.provincia}:${sigpac?.municipio}:0:0:${sigpac?.poligono}:${sigpac?.parcela}:1`,
          }
        : null,
      refCat ? { refCat } : null,
      ptIdParcela ? { ptIdParcela } : null,
    ].filter((i) => i !== null);

    const parcelas = await this.parcelaService.findMany({
      where: {
        idPropietario,
        OR: conditions,
      },
    });

    if (parcelas.length === 0) {
      return await this.createParcela(idPropietario, mParcela);
    }
    return parcelas[0];
  }

  async checkUsuario(
    mUsuario: CaptureInputDto['metadatos']['usuario'],
  ): Promise<UsuarioPublico> {
    let usuario = await this.usuarioService.findOnePublic({
      email: mUsuario.email,
    });

    if (!usuario) {
      const password = generator.generate({ length: 10, uppercase: false });
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      usuario = await this.usuarioService.create({
        nombre: mUsuario.nombre,
        apellidos: `${mUsuario.apellidos}`,
        email: mUsuario.email,
        passwordHash,
        rol: 'usuario',
      });

      await this.mailerService.sendNewUserMail(mUsuario.email, password);
    }

    return usuario;
  }

  async checkCultivo(
    idParcela: string,
    idResultadoImpacto: string,
    mCultivo: CaptureInputDto['metadatos']['cultivo'],
  ): Promise<Cultivo> {
    const fechaCultivo = DateTime.fromFormat(
      mCultivo.fecha_inicio_campania.toString(),
      'yyyyMMdd',
      { zone: 'utc' },
    );
    if (!fechaCultivo.isValid) {
      throw new BadRequestException(
        'La fecha de inicio de campaña del cultivo es inválida',
      );
    }

    let cultivo = await this.cultivoService.findOne({
      fechaInicioCampania_idParcela: {
        fechaInicioCampania: fechaCultivo.toJSDate(),
        idParcela: idParcela,
      },
    });

    if (cultivo) {
      await this.cultivoService.update({
        where: { id: cultivo.id },
        data: { resultadoImpacto: { connect: { id: idResultadoImpacto } } },
      });
      await this.resultadoImpactoService.delete({
        id: cultivo.idResultadoImpacto!,
      });
    } else {
      cultivo = await this.cultivoService.create({
        produccion: mCultivo.produccion,
        tipo: mCultivo.tipo,
        ciclo: mCultivo.ciclo,
        fechaInicioCampania: fechaCultivo.toJSDate(),
        parcela: { connect: { id: idParcela } },
        superficieCultivada: mCultivo.superficie_cultivada,
        consumoAgua: mCultivo.consumo_agua,
        resultadoImpacto: { connect: { id: idResultadoImpacto } },
      });
    }

    return cultivo;
  }
}
