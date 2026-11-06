import { SigpacCaptureStrategy } from './sigpac-capture.strategy';
import { SigpacService } from '../../sigpac/sigpac.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type { ParcelaMetadata } from './capture-strategy.interface';
import type { Feature, Polygon } from 'geojson';

function sigpacParcela(
  overrides: Partial<ParcelaMetadata> = {},
): ParcelaMetadata {
  return {
    id: 10,
    es_sigpac: { provincia: 41, municipio: 91, poligono: 3, parcela: 45 },
    es_referencia_catastral: undefined,
    pt_id_parcela_predial: undefined,
    nombre: 'Test',
    ...overrides,
  };
}

describe('SigpacCaptureStrategy', () => {
  let strategy: SigpacCaptureStrategy;
  let sigpacService: jest.Mocked<Pick<SigpacService, 'getPolygon'>>;
  let poblacionService: jest.Mocked<
    Pick<PoblacionService, 'findByCatastroIds'>
  >;
  const polygon: Feature<Polygon> = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-6.0, 39.0],
          [-6.1, 39.1],
          [-6.2, 39.0],
          [-6.0, 39.0],
        ],
      ],
    },
    properties: {},
  };

  beforeEach(() => {
    sigpacService = { getPolygon: jest.fn() };
    poblacionService = { findByCatastroIds: jest.fn() };
    strategy = new SigpacCaptureStrategy(
      sigpacService as unknown as SigpacService,
      poblacionService as unknown as PoblacionService,
    );
  });

  it.each([
    ['es_sigpac.provincia is set', sigpacParcela(), true],
    [
      'es_sigpac.provincia is undefined',
      sigpacParcela({ es_sigpac: { provincia: undefined } }),
      false,
    ],
    [
      'es_sigpac is omitted',
      sigpacParcela({ es_sigpac: undefined, pt_id_parcela_predial: '1234-56' }),
      false,
    ],
  ])('matches when %s', (_label, mParcela, expected) => {
    expect(strategy.matches(mParcela)).toBe(expected);
  });

  describe('resolveParcela', () => {
    const mParcela = sigpacParcela();

    it('fetches the SIGPAC polygon, resolves the Spanish poblacion, and computes the sigpac key', async () => {
      sigpacService.getPolygon.mockResolvedValue(polygon);
      const poblacion = { id: 'pop1' } as any;
      poblacionService.findByCatastroIds.mockResolvedValue(poblacion);

      const result = await strategy.resolveParcela(mParcela);

      expect(result.polygon).toBe(polygon);
      expect(result.poblacion).toBe(poblacion);
      expect(result.sigpacKey).toBe('41:91:0:0:3:45:1');
      expect(sigpacService.getPolygon).toHaveBeenCalledWith(mParcela.es_sigpac);
      expect(poblacionService.findByCatastroIds).toHaveBeenCalledWith(
        41,
        91,
        'ES',
      );
    });

    it('skips the poblacion lookup when the municipio is missing', async () => {
      sigpacService.getPolygon.mockResolvedValue(polygon);

      const result = await strategy.resolveParcela(
        sigpacParcela({ es_sigpac: { provincia: 41 } }),
      );

      expect(result.poblacion).toBeNull();
      expect(poblacionService.findByCatastroIds).not.toHaveBeenCalled();
    });
  });
});
