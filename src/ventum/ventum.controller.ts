import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { VentumInputDto } from './dto/ventum-input.dto';
import { SigpacService } from '../sigpac/sigpac.service';
import { CatastroService } from '../catastro/catastro.service';
import { UsuarioPublico, UsuarioService } from '../usuario/usuario.service';
import * as argon2 from 'argon2';
import { ParcelaService } from '../parcela/parcela.service';
import { CultivoService } from '../cultivo/cultivo.service';
import { DateTime } from 'luxon';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { instanceToPlain } from 'class-transformer';
import { Parcela, Poblacion } from '../generated/prisma/client';
import { Cultivo } from '../generated/prisma/browser';
import { PoblacionService } from '../poblacion/poblacion.service';

@Controller('/ventum')
export class VentumController {
  constructor(
    private readonly sigpacService: SigpacService,
    private readonly catastroService: CatastroService,
    private readonly usuarioService: UsuarioService,
    private readonly parcelaService: ParcelaService,
    private readonly cultivoService: CultivoService,
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly poblacionService: PoblacionService,
  ) {}

  closePolygon(points: number[][]): number[][] {
    const first = points[0];
    const last = points[points.length - 1];
    return first[0] === last[0] && first[1] === last[1]
      ? points
      : [...points, first];
  }

  async checkUsuario(
    mUsuario: VentumInputDto['metadatos']['usuario'],
  ): Promise<UsuarioPublico> {
    let usuario = await this.usuarioService.findOnePublic({
      email: mUsuario.email,
    });

    if (!usuario) {
      const passwordHash = await argon2.hash('prueba', {
        type: argon2.argon2id,
      });
      usuario = await this.usuarioService.create({
        ...mUsuario,
        passwordHash,
        rol: 'usuario',
      });
    }

    return usuario;
  }

  async checkParcela(
    idPropietario: string,
    mParcela: VentumInputDto['metadatos']['parcela'],
  ): Promise<Parcela> {
    let parcela = await this.parcelaService.findOne({
      sigpac: mParcela.es_sigpac,
      refCat: mParcela.es_referencia_catastral,
      ptIdParcela: mParcela.pt_id_parcela,
    });

    if (!parcela) {
      let polygon: number[][] = [];
      let poblacion: Poblacion | undefined;

      if (mParcela.es_sigpac) {
        polygon = await this.sigpacService.getPolygon(mParcela.es_sigpac);
        poblacion = (
          await this.poblacionService.findMany({
            where: {
              provincia: {
                idCatastro: parseInt(mParcela.es_sigpac.split(':')[0]),
              },
              idCatastro: parseInt(mParcela.es_sigpac.split(':')[1]),
            },
          })
        )[0];
      } else if (mParcela.es_referencia_catastral) {
        polygon = await this.catastroService.getPolygon(
          mParcela.es_referencia_catastral,
        );
        poblacion = (
          await this.poblacionService.findMany({
            where: {
              provincia: {
                idCatastro: parseInt(
                  mParcela.es_referencia_catastral.slice(0, 2),
                ),
              },
              idCatastro: parseInt(
                mParcela.es_referencia_catastral.slice(2, 5),
              ),
            },
          })
        )[0];
      } else {
        throw new BadRequestException(
          null,
          'Especifica el código SIGPAC o, en su defecto, la referencia catastral de la parcela',
        );
      }

      polygon = this.closePolygon(polygon);
      const geoJson = {
        type: 'Polygon',
        coordinates: [polygon],
      };

      parcela = await this.parcelaService.create({
        sigpac: mParcela.es_sigpac,
        refCat: mParcela.es_referencia_catastral,
        ptIdParcela: mParcela.pt_id_parcela,
        nombre: mParcela.nombre,
        propietario: { connect: { id: idPropietario } },
        poblacion: { connect: { id: poblacion.id } },
      });

      await this.parcelaService.addGeom(geoJson, parcela.id);
    }

    return parcela;
  }

  async checkCultivo(
    idParcela: string,
    idResultadoImpacto: string,
    mCultivo: VentumInputDto['metadatos']['cultivo'],
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

    if (!cultivo) {
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
    } else {
      await this.cultivoService.update({
        where: { id: cultivo.id },
        data: { resultadoImpacto: { connect: { id: idResultadoImpacto } } },
      });
      await this.resultadoImpactoService.delete({
        id: cultivo.idResultadoImpacto!,
      });
    }

    return cultivo;
  }

  @Post()
  async postVentumData(@Body() data: VentumInputDto) {
    const mUsuario = data.metadatos.usuario;
    const mParcela = data.metadatos.parcela;
    const mCultivo = data.metadatos.cultivo;

    const usuario = await this.checkUsuario(mUsuario);
    const parcela = await this.checkParcela(usuario.id, mParcela);

    const resultadoImpacto = await this.resultadoImpactoService.create({
      datos: instanceToPlain(data.resultado),
      impacto: { connect: { id: 'prueba' } },
    });

    const cultivo = await this.checkCultivo(
      parcela.id,
      resultadoImpacto.id,
      mCultivo,
    );

    return {
      usuario,
      parcela,
      cultivo,
    };
  }
}
