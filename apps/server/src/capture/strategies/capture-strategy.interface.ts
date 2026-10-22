import type { Feature, Polygon } from 'geojson';
import type { Poblacion } from '../../generated/prisma/client';
import type { CaptureInputDto } from '../dto/capture-input.dto';

export type ParcelaMetadata = CaptureInputDto['metadatos']['parcela'];

export interface ParcelaResolution {
  // null cuando no se pudo geolocalizar la parcela
  polygon: Feature<Polygon> | null;
  poblacion: Poblacion | null;
  sigpacKey: string | null;
}

export interface CaptureStrategy {
  matches(mParcela: ParcelaMetadata): boolean;
  resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution>;
}
