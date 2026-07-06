import { BadRequestException } from '@nestjs/common';
import { PredialCaptureStrategy } from './predial-capture.strategy';
import { PredialService } from '../../predial/predial.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type { ParcelaMetadata } from './capture-strategy.interface';
import type { Feature, Polygon } from 'geojson';

function predialParcela(
  overrides: Partial<ParcelaMetadata> = {},
): ParcelaMetadata {
  return {
    id: 10,
    es_sigpac: { provincia: undefined },
    es_referencia_catastral: undefined,
    pt_id_parcela_predial: 'PT12345',
    nombre: 'Predial parcel',
    ...overrides,
  };
}

describe('PredialCaptureStrategy', () => {
  let strategy: PredialCaptureStrategy;
  let predialService: jest.Mocked<Pick<PredialService, 'getPolygon'>>;
  let poblacionService: jest.Mocked<
    Pick<PoblacionService, 'findByCatastroIds'>
  >;
  const polygon: Feature<Polygon> = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [] },
    properties: { provincia: 10, poblacion: 20 },
  };

  beforeEach(() => {
    predialService = { getPolygon: jest.fn() };
    poblacionService = { findByCatastroIds: jest.fn() };
    strategy = new PredialCaptureStrategy(
      predialService as unknown as PredialService,
      poblacionService as unknown as PoblacionService,
    );
  });

  describe('matches', () => {
    it('returns true when pt_id_parcela_predial is set', () => {
      expect(strategy.matches(predialParcela())).toBe(true);
    });

    it('returns false when pt_id_parcela_predial is undefined', () => {
      expect(
        strategy.matches(predialParcela({ pt_id_parcela_predial: undefined })),
      ).toBe(false);
    });
  });

  describe('resolveParcela', () => {
    const mParcela = predialParcela();
    const ptId = mParcela.pt_id_parcela_predial!;

    it('fetches the predial polygon, reads provincia/poblacion from polygon properties, and resolves the Portuguese poblacion', async () => {
      predialService.getPolygon.mockResolvedValue(polygon);
      const poblacion = { id: 'pop3' } as any;
      poblacionService.findByCatastroIds.mockResolvedValue(poblacion);

      const result = await strategy.resolveParcela(mParcela);

      expect(result.polygon).toBe(polygon);
      expect(result.poblacion).toBe(poblacion);
      expect(result.sigpacKey).toBeNull();
      expect(predialService.getPolygon).toHaveBeenCalledWith(ptId);
      expect(poblacionService.findByCatastroIds).toHaveBeenCalledWith(
        10,
        20,
        'PT',
      );
    });

    it('throws BadRequestException when the poblacion is not found', async () => {
      predialService.getPolygon.mockResolvedValue(polygon);
      poblacionService.findByCatastroIds.mockResolvedValue(undefined);

      await expect(strategy.resolveParcela(mParcela)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
