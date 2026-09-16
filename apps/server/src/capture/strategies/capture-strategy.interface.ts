import type { Feature, Polygon } from 'geojson';
import type { Poblacion } from '../../generated/prisma/client';
import type { CaptureInputDto } from '../dto/capture-input.dto';

export type ParcelaMetadata = CaptureInputDto['metadatos']['parcela'];

export interface ParcelaResolution {
  polygon: Feature<Polygon>;
  poblacion: Poblacion;
  sigpacKey: string | null;
}

export interface CaptureStrategy {
  matches(mParcela: ParcelaMetadata): boolean;
  resolveParcela(mParcela: ParcelaMetadata): Promise<ParcelaResolution>;
}
