import { Body, Controller, Post } from '@nestjs/common';
import { CaptureInputDto } from './dto/capture-input.dto';
import { ResultadoImpactoService } from '../resultadoimpacto/resultado-impacto.service';
import { instanceToPlain } from 'class-transformer';
import { CaptureService } from './capture.service';

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
}
