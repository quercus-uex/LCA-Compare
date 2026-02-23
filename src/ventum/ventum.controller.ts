import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { VentumInputDto } from './dto/ventum-input.dto';
import { SigpacService } from '../sigpac/sigpac.service';
import { CatastroService } from '../catastro/catastro.service';
import { UsuarioService } from '../usuario/usuario.service';
import * as argon2 from 'argon2';
import { ParcelaService } from '../parcela/parcela.service';
import { Parcela, Usuario } from '../generated/prisma/browser';

@Controller('/ventum')
export class VentumController {
  constructor(
    private readonly sigpacService: SigpacService,
    private readonly catastroService: CatastroService,
    private readonly usuarioService: UsuarioService,
    private readonly parcelaService: ParcelaService,
  ) {}

  @Post()
  async postVentumData(@Body() data: VentumInputDto) {
    const mUsuario = data.metadatos.usuario;
    const mParcela = data.metadatos.parcela;
    const mCultivo = data.metadatos.cultivo;

    let usuario = await this.usuarioService.findOne({
      dni: mUsuario.dni,
    });

    if (!usuario) {
      const passwordHash = await argon2.hash('prueba', {
        type: argon2.argon2id,
      });
      await this.usuarioService.create({
        ...mUsuario,
        passwordHash,
        rol: 'Usuario',
      });
      usuario = await this.usuarioService.findOne({ dni: mUsuario.dni });
    }

    let parcela: Parcela | null = null;
    if (mParcela.sigpac) {
      parcela = await this.parcelaService.findOne({ sigpac: mParcela.sigpac });
    } else if (mParcela.referencia_catastral) {
      parcela = await this.parcelaService.findOne({
        refCat: mParcela.referencia_catastral,
      });
    }

    if (!parcela) {
      await this.parcelaService.create({
        ...mParcela,
        propietario: { connect: { id: usuario!.id } },
      });
    }

    let polygon: number[][] = [];
    if (data.metadatos.parcela.sigpac) {
      polygon = await this.sigpacService.getPolygon(
        data.metadatos.parcela.sigpac,
      );
    } else if (data.metadatos.parcela.referencia_catastral) {
      polygon = await this.catastroService.getPolygon(
        data.metadatos.parcela.referencia_catastral,
      );
    } else {
      throw new BadRequestException(
        null,
        'Especifica el código SIGPAC o, en su defecto, la referencia catastral de la parcela',
      );
    }


    return polygon;
  }
}
