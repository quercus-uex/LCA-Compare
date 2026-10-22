import { Injectable, Logger } from '@nestjs/common';
import { CatastroService } from '../../catastro/catastro.service';
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
export class CatastroCaptureStrategy implements CaptureStrategy {
  private readonly logger = new Logger(CatastroCaptureStrategy.name);

  constructor(
    private readonly catastroService: CatastroService,
    private readonly poblacionService: PoblacionService,
  ) {}

  matches(mParcela: ParcelaMetadata): boolean {
    return Boolean(mParcela.es_referencia_catastral);
  }

  async resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution> {
    const refCat = mParcela.es_referencia_catastral!;
    const polygon = await resolvePolygonSafely(
      this.logger,
      `refCat ${refCat}`,
      () => this.catastroService.getPolygon(refCat),
    );

    const provinciaCatastro = Number.parseInt(refCat.slice(0, 2));
    const poblacionCatastro = Number.parseInt(refCat.slice(2, 5));
    const poblacion = await findPoblacionSafely(
      this.logger,
      `refCat ${refCat}`,
      this.poblacionService,
      provinciaCatastro,
      poblacionCatastro,
      'ES',
    );

    return {
      polygon,
      poblacion,
      sigpacKey: null,
    };
  }
}
