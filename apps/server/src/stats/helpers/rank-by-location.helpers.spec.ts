import { rankPoblaciones, rankProvincias } from './rank-by-location.helpers';
import {
  EMPTY_CATEGORY_RECORD,
  type CategoryAmountRecord,
} from '../stats-aggregation.helpers';
import type { CultivoWithGeo } from './stats.types';

function makeCultivo(overrides?: Partial<CultivoWithGeo>): CultivoWithGeo {
  return {
    id: 'c1',
    superficieCultivada: 10,
    produccion: 100,
    consumoAgua: 50,
    ciclo: 1,
    tipo: 'trigo',
    idParcela: 'par-1',
    idResultadoImpacto: 'ri-1',
    fechaInicioCampania: new Date('2024-01-01'),
    parcela: {
      id: 'par-1',
      sigpac: null,
      refCat: null,
      ptIdParcela: null,
      nombre: 'P',
      idPropietario: 'u1',
      idPoblacion: 'pop-1',
      cultivos: [],
      geom: null,
      poblacion: {
        id: 'pop-1',
        idProvincia: 'prov-1',
        idCatastro: 1,
        nombre: 'Madrid',
        parcelas: [],
        provincia: {
          id: 'prov-1',
          nombre: 'Madrid',
          idCatastro: 1,
          idPais: 'es',
          poblaciones: [],
          pais: { id: 'es', nombre: 'España', codigo: 'ES', provincias: [] },
        },
      },
    },
    ...overrides,
  } as unknown as CultivoWithGeo;
}

function makeCategoryMap(
  records: Record<string, CategoryAmountRecord>,
): Map<string, CategoryAmountRecord> {
  const map = new Map<string, CategoryAmountRecord>();
  for (const [id, rec] of Object.entries(records)) {
    map.set(id, rec);
  }
  return map;
}

const emptyCategoryRecord: CategoryAmountRecord = { ...EMPTY_CATEGORY_RECORD };

describe('rank-by-location.helpers', () => {
  describe('rankProvincias', () => {
    it('returns an empty array when there are no cultivos', () => {
      expect(rankProvincias([], new Map())).toEqual([]);
    });

    it('skips cultivos without provincia', () => {
      const c = makeCultivo({
        parcela: { id: 'p', idPoblacion: null, poblacion: null } as any,
      });
      expect(rankProvincias([c], new Map())).toEqual([]);
    });

    it('groups cultivos by provincia and computes metrics', () => {
      const c1 = makeCultivo({
        id: 'c1',
        idParcela: 'par-1',
        superficieCultivada: 10,
        produccion: 100,
        consumoAgua: 50,
        idResultadoImpacto: 'ri-1',
      });
      const c2 = makeCultivo({
        id: 'c2',
        idParcela: 'par-2',
        superficieCultivada: 20,
        produccion: 200,
        consumoAgua: 100,
        idResultadoImpacto: 'ri-2',
        parcela: {
          ...c1.parcela,
          idPoblacion: 'pop-2',
          poblacion: {
            id: 'pop-2',
            idProvincia: 'prov-2',
            idCatastro: 2,
            nombre: 'Barcelona',
            parcelas: [],
            provincia: {
              id: 'prov-2',
              nombre: 'Cataluna',
              idCatastro: 2,
              idPais: 'es',
              poblaciones: [],
              pais: {
                id: 'es',
                nombre: 'España',
                codigo: 'ES',
                provincias: [],
              },
            },
          },
        } as any,
      });

      const map = makeCategoryMap({
        'ri-1': { ...emptyCategoryRecord, climate_change: 30 },
        'ri-2': { ...emptyCategoryRecord, climate_change: 60 },
      });

      const result = rankProvincias([c1, c2], map, 'climate_change');

      expect(result).toHaveLength(2);
      expect(result[0].nombreProvincia).toBe('Madrid');
      expect(result[0].numParcelas).toBe(1);
      expect(result[0].numCultivos).toBe(1);
      expect(result[0].superficieTotal).toBe(10);
    });
  });

  describe('rankPoblaciones', () => {
    it('filters by idProvinciaPoblacion when provided', () => {
      const c1 = makeCultivo();
      const c2 = makeCultivo({
        id: 'c2',
        idParcela: 'par-2',
        parcela: {
          ...c1.parcela,
          idPoblacion: 'pop-2',
          poblacion: {
            id: 'pop-2',
            idProvincia: 'prov-2',
            idCatastro: 2,
            nombre: 'Barcelona',
            parcelas: [],
            provincia: {
              id: 'prov-2',
              nombre: 'Cataluna',
              idCatastro: 2,
              idPais: 'es',
              poblaciones: [],
              pais: {
                id: 'es',
                nombre: 'España',
                codigo: 'ES',
                provincias: [],
              },
            },
          },
        } as any,
      });

      const result = rankPoblaciones([c1, c2], new Map(), undefined, 'prov-1');

      expect(result).toHaveLength(1);
      expect(result[0].nombrePoblacion).toBe('Madrid');
    });

    it('preserves poblacion entries without province name', () => {
      const c = makeCultivo({
        parcela: {
          id: 'p',
          idPoblacion: 'pop-x',
          poblacion: {
            id: 'pop-x',
            idProvincia: 'prov-x',
            idCatastro: 9,
            nombre: 'Sin provincia',
            parcelas: [],
            provincia: null,
          },
        } as any,
      });

      const result = rankPoblaciones([c], new Map());

      expect(result).toHaveLength(1);
      expect(result[0].nombreProvincia).toBe('');
    });
  });
});
