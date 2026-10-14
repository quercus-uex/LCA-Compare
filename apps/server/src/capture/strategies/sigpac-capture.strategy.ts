import { BadRequestException, Injectable } from '@nestjs/common';
import { SigpacService } from '../../sigpac/sigpac.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type {
  CaptureStrategy,
  ParcelaMetadata,
  ParcelaResolution,
} from './capture-strategy.interface';

@Injectable()
export class SigpacCaptureStrategy implements CaptureStrategy {
  constructor(
    private readonly sigpacService: SigpacService,
    private readonly poblacionService: PoblacionService,
  ) {}

  matches(mParcela: ParcelaMetadata): boolean {
    return Boolean(mParcela.es_sigpac?.provincia);
  }

  async resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution> {
    const sigpac = mParcela.es_sigpac!;
    const { provincia, municipio, poligono, parcela } = sigpac;
    const polygon = await this.sigpacService.getPolygon(sigpac);
    const poblacion = await this.poblacionService.findByCatastroIds(
      provincia!,
      municipio!,
      'ES',
    );

    if (!poblacion) {
      throw new BadRequestException(
        'No se encontró la población para la parcela SIGPAC indicada',
      );
    }

    return {
      polygon,
      poblacion,
      sigpacKey: `${provincia}:${municipio}:0:0:${poligono}:${parcela}:1`,
    };
  }
}
