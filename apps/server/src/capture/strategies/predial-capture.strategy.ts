import { Injectable, Logger } from '@nestjs/common';
import { PredialService } from '../../predial/predial.service';
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
export class PredialCaptureStrategy implements CaptureStrategy {
  private readonly logger = new Logger(PredialCaptureStrategy.name);

  constructor(
    private readonly predialService: PredialService,
    private readonly poblacionService: PoblacionService,
  ) {}

  matches(mParcela: ParcelaMetadata): boolean {
    return Boolean(mParcela.pt_id_parcela_predial);
  }

  async resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution> {
    const ptId = mParcela.pt_id_parcela_predial!;
    const polygon = await resolvePolygonSafely(
      this.logger,
      `predial ${ptId}`,
      () => this.predialService.getPolygon(ptId),
    );

    // Los códigos de la población solo llegan en la respuesta del predial
    const poblacion = polygon
      ? await findPoblacionSafely(
          this.logger,
          `predial ${ptId}`,
          this.poblacionService,
          polygon.properties?.provincia as number | undefined,
          polygon.properties?.poblacion as number | undefined,
          'PT',
        )
      : null;

    return {
      polygon,
      poblacion,
      sigpacKey: null,
    };
  }
}
