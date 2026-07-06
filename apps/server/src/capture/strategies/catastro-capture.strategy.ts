import { BadRequestException, Injectable } from '@nestjs/common';
import { CatastroService } from '../../catastro/catastro.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type {
  CaptureStrategy,
  ParcelaMetadata,
  ParcelaResolution,
} from './capture-strategy.interface';

@Injectable()
export class CatastroCaptureStrategy implements CaptureStrategy {
  constructor(
    private readonly catastroService: CatastroService,
    private readonly poblacionService: PoblacionService,
  ) {}

  matches(mParcela: ParcelaMetadata): boolean {
    return Boolean(mParcela.es_referencia_catastral);
  }

  async resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution> {
    const refCat = mParcela.es_referencia_catastral!;
    const polygon = await this.catastroService.getPolygon(refCat);

    const provinciaCatastro = Number.parseInt(refCat.slice(0, 2));
    const poblacionCatastro = Number.parseInt(refCat.slice(2, 5));
    const poblacion = await this.poblacionService.findByCatastroIds(
      provinciaCatastro,
      poblacionCatastro,
      'ES',
    );

    if (!poblacion) {
      throw new BadRequestException(
        'No se encontró la población para la referencia catastral indicada',
      );
    }

    return {
      polygon,
      poblacion,
      sigpacKey: null,
    };
  }
}
