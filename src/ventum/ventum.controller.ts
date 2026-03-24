import { Body, Controller, Post } from '@nestjs/common';
import { VentumInputDto } from './dto/ventum-input.dto';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { instanceToPlain } from 'class-transformer';
import { VentumService } from './ventum.service';

@Controller('/ventum')
export class VentumController {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly ventumService: VentumService,
  ) {}

  @Post()
  async postVentumData(@Body() data: VentumInputDto) {
    const mUsuario = data.metadatos.usuario;
    const mParcela = data.metadatos.parcela;
    const mCultivo = data.metadatos.cultivo;

    const usuario = await this.ventumService.checkUsuario(mUsuario);
    const parcela = await this.ventumService.checkParcela(usuario.id, mParcela);

    const resultadoImpacto = await this.resultadoImpactoService.create({
      datos: instanceToPlain(data.resultado),
      impacto: { connect: { id: 'prueba' } },
    });

    const cultivo = await this.ventumService.checkCultivo(
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

  @Post('/bulk')
  async extractVentumData() {
    const fetchToken = await fetch(
      'https://acvapi.dtagro.es/api/usuario/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.VENTUM_ACV_EMAIL,
          password: process.env.VENTUM_ACV_PASSWORD,
        }),
      },
    );
    const token = (await fetchToken.json()) as { token: string };
    const cultivos: any[] = [];

    for (let i = 1; i < 100; i++) {
      const fetchCultivo = await fetch(
        `https://acvapi.dtagro.es/api/cultivo/calculos/${i}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token.token}`,
          },
        },
      );
      try {
        cultivos.push(await fetchCultivo.json());
      } catch {
        console.log(`Error en parcela con ID ${i}`);
      }
    }

    console.log(`Recuperadas ${cultivos.length} parcelas`);

    return {
      data: cultivos,
    };
  }
}
