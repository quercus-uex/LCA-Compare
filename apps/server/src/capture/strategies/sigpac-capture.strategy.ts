import { Injectable, Logger } from '@nestjs/common';
import { SigpacService } from '../../sigpac/sigpac.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type {
  CaptureStrategy,
  ParcelaMetadata,
  ParcelaResolution,
} from './capture-strategy.interface';
import {
  findPoblacionSafely,
  resolvePolygonSafely,
} from './geolocation.helpers';

@Injectable()
export class SigpacCaptureStrategy implements CaptureStrategy {
  private readonly logger = new Logger(SigpacCaptureStrategy.name);

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
    const sigpacKey = `${provincia}:${municipio}:0:0:${poligono}:${parcela}:1`;

    const polygon = await resolvePolygonSafely(
      this.logger,
      `SIGPAC ${sigpacKey}`,
      () => this.sigpacService.getPolygon(sigpac),
    );
    const poblacion = await findPoblacionSafely(
      this.logger,
      `SIGPAC ${sigpacKey}`,
      this.poblacionService,
      provincia,
      municipio,
      'ES',
    );

    return { polygon, poblacion, sigpacKey };
  }
}
