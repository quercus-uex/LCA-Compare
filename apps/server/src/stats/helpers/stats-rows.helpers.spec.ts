import {
  collectCategorias,
  computeDistribucionCultivos,
  filterRows,
  toStatsRows,
  uniqueSorted,
  type StatsCultivo,
  type StatsRow,
} from './stats-rows.helpers';

function makeCultivo(overrides: Partial<StatsCultivo> = {}): StatsCultivo {
  return {
    idParcela: 'par-1',
    tipo: 'trigo',
    fechaInicioCampania: new Date('2024-03-01T00:00:00.000Z'),
    superficieCultivada: 10,
    produccion: 1000,
    consumoAgua: 500,
    resultadoImpacto: {
      datos: {
        impacto_total: [
          { category: 'Climate change', amount: 4, unit: 'kg CO2 eq' },
        ],
      },
    },
    parcela: {
      poblacion: {
        id: 'pob-1',
        nombre: 'Don Benito',
        provincia: { id: 'prov-1', nombre: 'Badajoz' },
      },
    },
    ...overrides,
  };
}

function makeRow(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    idParcela: 'par-1',
    tipo: 'trigo',
    anio: 2024,
    superficie: 10,
    produccion: 1000,
    consumoAgua: 500,
    categorias: null,
    poblacion: null,
    provincia: null,
    ...overrides,
  };
}

describe('stats-rows.helpers', () => {
  describe('toStatsRows', () => {
    it('maps a cultivo to a row with its zones and category amounts', () => {
      const [row] = toStatsRows([makeCultivo()]);

      expect(row).toMatchObject({
        idParcela: 'par-1',
        tipo: 'trigo',
        anio: 2024,
        superficie: 10,
        produccion: 1000,
        consumoAgua: 500,
        poblacion: { id: 'pob-1', nombre: 'Don Benito' },
        provincia: { id: 'prov-1', nombre: 'Badajoz' },
      });
      expect(row.categorias?.climate_change).toBe(4);
      // Una categoría que no trae el resultado no vale 0
      expect(row.categorias).not.toHaveProperty('acidification');
    });

    it('takes the campaign year in UTC', () => {
      const [row] = toStatsRows([
        makeCultivo({
          fechaInicioCampania: new Date('2023-12-31T23:30:00.000Z'),
        }),
      ]);

      expect(row.anio).toBe(2023);
    });

    it('leaves categorias null without an impact result', () => {
      const [row] = toStatsRows([makeCultivo({ resultadoImpacto: null })]);

      expect(row.categorias).toBeNull();
    });

    it('treats malformed impact data as a result without amounts', () => {
      const [row] = toStatsRows([
        makeCultivo({ resultadoImpacto: { datos: 'oops' } }),
      ]);

      expect(row.categorias).toEqual({});
    });

    it('leaves zones null when the plot has no town', () => {
      const [row] = toStatsRows([
        makeCultivo({ parcela: { poblacion: null } }),
      ]);

      expect(row.poblacion).toBeNull();
      expect(row.provincia).toBeNull();
    });
  });

  describe('filterRows', () => {
    const rows = [
      makeRow({ anio: 2023, tipo: 'trigo' }),
      makeRow({ anio: 2024, tipo: 'trigo' }),
      makeRow({ anio: 2024, tipo: 'maiz' }),
    ];

    it('returns every row without filters', () => {
      expect(filterRows(rows, {})).toHaveLength(3);
    });

    it('filters by year and crop type together', () => {
      expect(filterRows(rows, { anio: 2024 })).toHaveLength(2);
      expect(filterRows(rows, { tipoCultivo: 'trigo' })).toHaveLength(2);
      expect(filterRows(rows, { anio: 2024, tipoCultivo: 'maiz' })).toEqual([
        rows[2],
      ]);
    });
  });

  describe('collectCategorias', () => {
    it('keeps only rows with impact results', () => {
      const categorias = { climate_change: 1 } as StatsRow['categorias'];
      expect(collectCategorias([makeRow(), makeRow({ categorias })])).toEqual([
        categorias,
      ]);
    });
  });

  describe('uniqueSorted', () => {
    it('deduplicates and sorts numbers and strings', () => {
      expect(uniqueSorted([2024, 2022, 2024, 2023])).toEqual([
        2022, 2023, 2024,
      ]);
      expect(uniqueSorted(['trigo', 'maiz', 'trigo'])).toEqual([
        'maiz',
        'trigo',
      ]);
    });
  });

  describe('computeDistribucionCultivos', () => {
    it('counts crops and sums area per type, most frequent first', () => {
      const result = computeDistribucionCultivos([
        makeRow({ tipo: 'maiz', superficie: 1.004 }),
        makeRow({ tipo: 'trigo', superficie: 2 }),
        makeRow({ tipo: 'trigo', superficie: 3 }),
      ]);

      expect(result).toEqual([
        { tipo: 'trigo', count: 2, superficieTotal: 5 },
        { tipo: 'maiz', count: 1, superficieTotal: 1 },
      ]);
    });

    it('returns an empty list without rows', () => {
      expect(computeDistribucionCultivos([])).toEqual([]);
    });
  });
});
