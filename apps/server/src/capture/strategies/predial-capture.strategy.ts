import { BadRequestException, Injectable } from '@nestjs/common';
import { PredialService } from '../../predial/predial.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type {
  CaptureStrategy,
  ParcelaMetadata,
  ParcelaResolution,
} from './capture-strategy.interface';

@Injectable()
export class PredialCaptureStrategy implements CaptureStrategy {
  constructor(
    private readonly predialService: PredialService,
    private readonly poblacionService: PoblacionService,
  ) {}

  matches(mParcela: ParcelaMetadata): boolean {
    return Boolean(mParcela.pt_id_parcela_predial);
  }

  async resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution> {
    const ptId = mParcela.pt_id_parcela_predial!;
    const polygon = await this.predialService.getPolygon(ptId);

    const provinciaCatastro = polygon.properties!.provincia as number;
    const poblacionCatastro = polygon.properties!.poblacion as number;
    const poblacion = await this.poblacionService.findByCatastroIds(
      provinciaCatastro,
      poblacionCatastro,
      'PT',
    );

    if (!poblacion) {
      throw new BadRequestException(
        'No se encontró la población para la parcela predial indicada',
      );
    }

    return {
      polygon,
      poblacion,
      sigpacKey: null,
    };
  }
}
