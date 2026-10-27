import { EF_CATEGORIES } from 'common/impact';
import { STATS_MIN_PARCELAS, type CategoryValues } from 'common/stats';
import { rankPoblaciones, rankProvincias } from './rank-by-location.helpers';
import type { StatsRow } from './stats-rows.helpers';

function categorias(climateChange: number): CategoryValues {
  const record = {} as CategoryValues;
  for (const cat of EF_CATEGORIES) record[cat.id] = 0;
  record.climate_change = climateChange;
  return record;
}

const BADAJOZ = { id: 'prov-ba', nombre: 'Badajoz' };
const CACERES = { id: 'prov-cc', nombre: 'Cáceres' };
const DON_BENITO = { id: 'pob-db', nombre: 'Don Benito' };
const ZAFRA = { id: 'pob-za', nombre: 'Zafra' };
const CORIA = { id: 'pob-co', nombre: 'Coria' };

function makeRow(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    idParcela: 'par-1',
    tipo: 'trigo',
    anio: 2024,
    superficie: 10,
    produccion: 1000,
    consumoAgua: 500,
    categorias: categorias(1),
    poblacion: DON_BENITO,
    provincia: BADAJOZ,
    ...overrides,
  };
}

/** Una fila por parcela, todas con impacto, en la zona indicada */
function zonaRows(
  count: number,
  zona: Pick<StatsRow, 'poblacion' | 'provincia'>,
  climateChange = 1,
  prefix = zona.poblacion?.id ?? 'x',
): StatsRow[] {
  return Array.from({ length: count }, (_, i) =>
    makeRow({
      ...zona,
      idParcela: `${prefix}-${i}`,
      categorias: categorias(climateChange),
    }),
  );
}

describe('rank-by-location.helpers', () => {
  it('uses a minimum of 3 plots', () => {
    expect(STATS_MIN_PARCELAS).toBe(3);
  });

  describe('rankProvincias', () => {
    it('aggregates plots, crops, area and mean impacts per province', () => {
      const rows = [
        ...zonaRows(3, { poblacion: DON_BENITO, provincia: BADAJOZ }, 10),
        makeRow({ idParcela: 'pob-db-0', categorias: categorias(30) }),
      ];

      const { ranking, ocultas } = rankProvincias(rows);

      expect(ocultas).toBe(0);
      expect(ranking).toHaveLength(1);
      expect(ranking[0]).toMatchObject({
        idProvincia: 'prov-ba',
        nombreProvincia: 'Badajoz',
        numParcelas: 3,
        numCultivos: 4,
        superficieTotal: 40,
      });
      expect(ranking[0].impactosPorCategoria.climate_change).toBe(15);
    });

    it('hides provinces with fewer plots with impact results than the minimum', () => {
      const rows = [
        ...zonaRows(3, { poblacion: DON_BENITO, provincia: BADAJOZ }),
        ...zonaRows(2, { poblacion: CORIA, provincia: CACERES }),
        // Tercera parcela de Cáceres, pero sin resultado: no cuenta
        makeRow({
          idParcela: 'pob-co-sin',
          poblacion: CORIA,
          provincia: CACERES,
          categorias: null,
        }),
      ];

      const { ranking, ocultas } = rankProvincias(rows);

      expect(ranking.map((r) => r.idProvincia)).toEqual(['prov-ba']);
      expect(ocultas).toBe(1);
    });

    it('ignores crops without a province', () => {
      const rows = [
        ...zonaRows(3, { poblacion: DON_BENITO, provincia: BADAJOZ }),
        makeRow({ idParcela: 'huerfana', poblacion: null, provincia: null }),
      ];

      const { ranking, ocultas } = rankProvincias(rows);

      expect(ranking).toHaveLength(1);
      expect(ranking[0].numCultivos).toBe(3);
      expect(ocultas).toBe(0);
    });

    it('computes yield, water allocation and water productivity as ratios of totals', () => {
      const rows = [
        makeRow({
          idParcela: 'a',
          superficie: 1,
          produccion: 1000,
          consumoAgua: 100,
        }),
        makeRow({
          idParcela: 'b',
          superficie: 2,
          produccion: 5000,
          consumoAgua: 400,
        }),
        makeRow({
          idParcela: 'c',
          superficie: 3,
          produccion: 0,
          consumoAgua: 500,
        }),
      ];

      const [provincia] = rankProvincias(rows).ranking;

      expect(provincia.rendimiento).toBe(1000);
      expect(provincia.dotacionAgua).toBe(166.7);
      expect(provincia.productividadAgua).toBe(6);
    });

    it('computes water allocation and productivity only from irrigated crops', () => {
      const rows = [
        makeRow({
          idParcela: 'a',
          superficie: 2,
          produccion: 4000,
          consumoAgua: 1000,
        }),
        makeRow({
          idParcela: 'b',
          superficie: 2,
          produccion: 6000,
          consumoAgua: 1000,
        }),
        // Secano: cuenta para el rendimiento, no para el agua
        makeRow({
          idParcela: 'c',
          superficie: 6,
          produccion: 2000,
          consumoAgua: 0,
        }),
      ];

      const [provincia] = rankProvincias(rows).ranking;

      expect(provincia.rendimiento).toBe(1200);
      expect(provincia.dotacionAgua).toBe(500);
      expect(provincia.productividadAgua).toBe(5);
    });

    it('returns null ratios when a denominator is 0', () => {
      const rows = zonaRows(3, {
        poblacion: DON_BENITO,
        provincia: BADAJOZ,
      }).map((r) => ({ ...r, superficie: 0, consumoAgua: 0 }));

      const [provincia] = rankProvincias(rows).ranking;

      expect(provincia.rendimiento).toBeNull();
      expect(provincia.dotacionAgua).toBeNull();
      expect(provincia.productividadAgua).toBeNull();
    });

    it('sorts from lower to higher climate change impact', () => {
      const rows = [
        ...zonaRows(3, { poblacion: DON_BENITO, provincia: BADAJOZ }, 50),
        ...zonaRows(3, { poblacion: CORIA, provincia: CACERES }, 20),
      ];

      expect(rankProvincias(rows).ranking.map((r) => r.idProvincia)).toEqual([
        'prov-cc',
        'prov-ba',
      ]);
    });
  });

  describe('rankPoblaciones', () => {
    it('includes the province of each town', () => {
      const { ranking } = rankPoblaciones(
        zonaRows(3, { poblacion: CORIA, provincia: CACERES }),
      );

      expect(ranking[0]).toMatchObject({
        idPoblacion: 'pob-co',
        nombrePoblacion: 'Coria',
        idProvincia: 'prov-cc',
        nombreProvincia: 'Cáceres',
        numParcelas: 3,
        numCultivos: 3,
        superficieTotal: 30,
      });
    });

    it('hides towns below the minimum even if their province is shown', () => {
      const rows = [
        ...zonaRows(2, { poblacion: DON_BENITO, provincia: BADAJOZ }),
        ...zonaRows(1, { poblacion: ZAFRA, provincia: BADAJOZ }),
      ];

      expect(rankProvincias(rows).ranking).toHaveLength(1);
      const poblaciones = rankPoblaciones(rows);
      expect(poblaciones.ranking).toEqual([]);
      expect(poblaciones.ocultas).toBe(2);
    });

    it('sorts from lower to higher climate change impact', () => {
      const rows = [
        ...zonaRows(3, { poblacion: DON_BENITO, provincia: BADAJOZ }, 9),
        ...zonaRows(3, { poblacion: ZAFRA, provincia: BADAJOZ }, 3),
      ];

      expect(rankPoblaciones(rows).ranking.map((r) => r.idPoblacion)).toEqual([
        'pob-za',
        'pob-db',
      ]);
    });
  });
});
