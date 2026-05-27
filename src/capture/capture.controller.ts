import { Body, Controller, Post } from '@nestjs/common';
import { CaptureInputDto } from './dto/capture-input.dto';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { instanceToPlain } from 'class-transformer';
import { CaptureService } from './capture.service';
import * as fs from 'node:fs';

@Controller('/capture')
export class CaptureController {
  constructor(
    private readonly resultadoImpactoService: ResultadoImpactoService,
    private readonly captureService: CaptureService,
  ) {}

  @Post()
  async postCaptureData(@Body() data: CaptureInputDto) {
    const mUsuario = data.metadatos.usuario;
    const mParcela = data.metadatos.parcela;
    const mCultivo = data.metadatos.cultivo;

    const usuario = await this.captureService.checkUsuario(mUsuario);
    const parcela = await this.captureService.checkParcela(
      usuario.id,
      mParcela,
    );

    const resultadoImpacto = await this.resultadoImpactoService.create({
      datos: instanceToPlain(data.resultado),
      impacto: { connect: { id: process.env.DEFAULT_IMPACT_METHOD_UUID } },
    });

    const cultivo = await this.captureService.checkCultivo(
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
  async extractCaptureData() {
    const fetchToken = await fetch(
      'https://acvapi.dtagro.es/api/usuario/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.CAPTURE_ACV_EMAIL,
          password: process.env.CAPTURE_ACV_PASSWORD,
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
        const json = (await fetchCultivo.json()) as object;
        cultivos.push(json);
        fs.writeFileSync(
          `./output/data-${i}.json`,
          JSON.stringify(json, null, 2),
          'utf-8',
        );
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
