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
import { toSigpacKey } from '../../sigpac/sigpac.helpers';

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
    const sigpacKey = toSigpacKey(sigpac);

    // Ninguna de las dos búsquedas lanza: un fallo se registra y devuelve null
    const [polygon, poblacion] = await Promise.all([
      resolvePolygonSafely(this.logger, `SIGPAC ${sigpacKey}`, () =>
        this.sigpacService.getPolygon(sigpac),
      ),
      findPoblacionSafely(
        this.logger,
        `SIGPAC ${sigpacKey}`,
        this.poblacionService,
        sigpac.provincia,
        sigpac.municipio,
        'ES',
      ),
    ]);

    return { polygon, poblacion, sigpacKey };
  }
}
