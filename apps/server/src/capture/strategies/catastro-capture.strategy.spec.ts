import { CatastroCaptureStrategy } from './catastro-capture.strategy';
import { CatastroService } from '../../catastro/catastro.service';
import { PoblacionService } from '../../poblacion/poblacion.service';
import type { ParcelaMetadata } from './capture-strategy.interface';
import type { Feature, Polygon } from 'geojson';

function catastroParcela(
  overrides: Partial<ParcelaMetadata> = {},
): ParcelaMetadata {
  return {
    id: 10,
    es_sigpac: { provincia: undefined },
    es_referencia_catastral: '4191003AG3456S0001EP',
    pt_id_parcela_predial: undefined,
    nombre: 'Catastral parcel',
    ...overrides,
  };
}

describe('CatastroCaptureStrategy', () => {
  let strategy: CatastroCaptureStrategy;
  let catastroService: jest.Mocked<Pick<CatastroService, 'getPolygon'>>;
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
    catastroService = { getPolygon: jest.fn() };
    poblacionService = { findByCatastroIds: jest.fn() };
    strategy = new CatastroCaptureStrategy(
      catastroService as unknown as CatastroService,
      poblacionService as unknown as PoblacionService,
    );
  });

  it.each([
    ['es_referencia_catastral is set', catastroParcela(), true],
    [
      'es_referencia_catastral is undefined',
      catastroParcela({ es_referencia_catastral: undefined }),
      false,
    ],
  ])('matches when %s', (_label, mParcela, expected) => {
    expect(strategy.matches(mParcela)).toBe(expected);
  });

  describe('resolveParcela', () => {
    const mParcela = catastroParcela();
    const refCat = mParcela.es_referencia_catastral!;

    it('fetches the catastro polygon, extracts provincia/poblacion from refCat, and resolves the Spanish poblacion', async () => {
      catastroService.getPolygon.mockResolvedValue(polygon);
      const poblacion = { id: 'pop2' } as any;
      poblacionService.findByCatastroIds.mockResolvedValue(poblacion);

      const result = await strategy.resolveParcela(mParcela);

      expect(result.polygon).toBe(polygon);
      expect(result.poblacion).toBe(poblacion);
      expect(result.sigpacKey).toBeNull();
      expect(catastroService.getPolygon).toHaveBeenCalledWith(refCat);
      expect(poblacionService.findByCatastroIds).toHaveBeenCalledWith(
        41,
        910,
        'ES',
      );
    });
  });
});
