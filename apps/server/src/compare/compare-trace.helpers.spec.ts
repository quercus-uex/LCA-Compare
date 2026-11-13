import type { ResultadoImpactoDto } from 'common/api';
import type {
  CompareTraceDto,
  CompareTraceFiltersDto,
  CompareTraceResultDto,
  CompareTraceSetDto,
} from 'common/compare';
import { IMPACT_KEYS, type ImpactKey } from 'common/impact';
import {
  buildCompareTraceCSV,
  hasCultivo,
  type ResultadoImpactoTraceWithCultivo,
  toTraceResult,
} from './compare-trace.helpers';
import type { ResultadoImpactoTrace } from './compare.types';

type ImpactItems = Partial<
  Record<ImpactKey, { category: string; amount: number; unit: string }[]>
>;

function makeDatos(overrides?: ImpactItems): ResultadoImpactoDto {
  const datos: Record<string, unknown> = {};
  for (const key of IMPACT_KEYS) datos[key] = overrides?.[key] ?? [];
  return datos as unknown as ResultadoImpactoDto;
}

function makeRawResult(
  overrides?: Partial<{
    id: string;
    cultivo: boolean;
    fechaInicio: Date;
    tipo: string;
    datos: ImpactItems;
  }>,
): ResultadoImpactoTrace {
  return {
    id: overrides?.id ?? 'ri-1',
    datos: makeDatos(overrides?.datos),
    impacto: { id: 'metodo-1', nombre: 'EF 3.1' },
    cultivo:
      overrides?.cultivo === false
        ? null
        : {
            id: 'cult-1',
            tipo: overrides?.tipo ?? 'trigo',
            fechaInicioCampania:
              overrides?.fechaInicio ?? new Date('2025-03-01T00:00:00.000Z'),
            superficieCultivada: 1.5,
            produccion: 100,
            consumoAgua: 20,
            ciclo: 120,
            parcela: {
              id: 'par-1',
              nombre: 'La Vega',
              sigpac: 'SIGPAC-1',
              refCat: null,
              ptIdParcela: null,
              esParcelaReferencia: true,
              idPropietario: 'u-1',
              propietario: {
                nombre: 'Ana',
                apellidos: 'García',
                email: 'ana@example.com',
              },
              idPoblacion: 'pop-1',
              poblacion: {
                id: 'pop-1',
                nombre: 'Mérida',
                idCatastro: 123,
                idProvincia: 'prov-1',
                provincia: {
                  id: 'prov-1',
                  nombre: 'Badajoz',
                  idCatastro: 456,
                  idPais: 'pais-1',
                  pais: {
                    id: 'pais-1',
                    nombre: 'España',
                    codigo: 'ES',
                  },
                },
              },
            },
          },
  } as unknown as ResultadoImpactoTrace;
}

const filters: CompareTraceFiltersDto = {
  idOrganizacion: 'org-1',
  organizacion: { id: 'org-1', nombre: 'Cooperativa Sur' },
  idPais: 'pais-1',
  pais: { id: 'pais-1', nombre: 'España', codigo: 'ES' },
  idsProvincia: ['prov-1'],
  provincias: [{ id: 'prov-1', nombre: 'Badajoz' }],
  idsPoblacion: ['pop-1'],
  poblaciones: [{ id: 'pop-1', nombre: 'Mérida' }],
  idsParcela: ['par-1'],
  parcelas: [{ id: 'par-1', nombre: 'La Vega' }],
  tipoCultivo: 'trigo',
  anioCampaniaInicio: 2023,
  anioCampaniaFin: 2025,
  soloParcelasReferencia: true,
};

function makeTraceResult(
  overrides?: Parameters<typeof makeRawResult>[0],
): CompareTraceResultDto {
  return toTraceResult(
    makeRawResult(overrides) as ResultadoImpactoTraceWithCultivo,
  );
}

function makeSet(
  results: CompareTraceResultDto[],
  setFilters: CompareTraceFiltersDto = filters,
): CompareTraceSetDto {
  return {
    filters: setFilters,
    count: results.length,
    mean: makeDatos(),
    results,
  };
}

describe('toTraceResult', () => {
  it('maps the method, crop, location, owner and raw impact data', () => {
    const raw = makeRawResult({
      id: 'ri-9',
      tipo: 'cebada',
      fechaInicio: new Date('2024-12-31T23:00:00.000Z'),
    });

    const result = toTraceResult(raw as ResultadoImpactoTraceWithCultivo);

    expect(result.id).toBe('ri-9');
    expect(result.metodo).toEqual({ id: 'metodo-1', nombre: 'EF 3.1' });
    expect(result.cultivo).toMatchObject({
      id: 'cult-1',
      tipo: 'cebada',
      anioCampania: 2024,
      fechaInicioCampania: '2024-12-31T23:00:00.000Z',
      superficieCultivada: 1.5,
      produccion: 100,
      consumoAgua: 20,
      ciclo: 120,
    });
    expect(result.cultivo.parcela).toMatchObject({
      id: 'par-1',
      nombre: 'La Vega',
      sigpac: 'SIGPAC-1',
      esParcelaReferencia: true,
      propietario: {
        nombre: 'Ana García',
        email: 'ana@example.com',
      },
      poblacion: {
        nombre: 'Mérida',
        provincia: {
          nombre: 'Badajoz',
          pais: { nombre: 'España', codigo: 'ES' },
        },
      },
    });
    expect(result.datos).toBe(raw.datos);
  });

  it('hasCultivo tells apart results without a crop', () => {
    expect(hasCultivo(makeRawResult())).toBe(true);
    expect(hasCultivo(makeRawResult({ cultivo: false }))).toBe(false);
  });
});

describe('buildCompareTraceCSV', () => {
  it('writes one wide row per result and category with a BOM and CRLF', () => {
    const ref = makeTraceResult({
      datos: {
        impacto_fertilizantes: [
          { category: 'GWP', amount: 1, unit: 'kg CO2 eq' },
        ],
        impacto_total: [
          { category: 'AP', amount: 5, unit: 'mol H+ eq' },
          { category: 'GWP', amount: 10, unit: 'kg CO2 eq' },
        ],
      },
    });
    const tar = makeTraceResult({
      id: 'ri-2',
      tipo: 'cebada',
      datos: {
        impacto_total: [{ category: 'GWP', amount: 2, unit: 'kg CO2 eq' }],
      },
    });
    const trace: CompareTraceDto = {
      schemaVersion: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      scope: 'full',
      reference: makeSet([ref]),
      target: makeSet([tar], { ...filters, tipoCultivo: 'cebada' }),
    };

    const text = buildCompareTraceCSV(trace);

    expect(text.startsWith('\ufeffversion_esquema;generado_en;')).toBe(true);
    const lines = text.slice(1).split('\r\n');
    // Header + two reference categories (AP, GWP) + one target category
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('categoria;impacto_fertilizantes');
    expect(lines[0]).toContain('impacto_total;unidad');

    // AP comes before GWP and only fills the total stage
    expect(lines[1].split(';')[38]).toBe('AP');
    expect(lines[1].split(';')[39]).toBe('');
    expect(lines[1].split(';')[43]).toBe('5');
    expect(lines[1].split(';')[44]).toBe('mol H+ eq');

    const gwp = lines[2].split(';');
    expect(gwp[2]).toBe('reference');
    expect(gwp[3]).toBe('Cooperativa Sur');
    expect(gwp[5]).toBe('España');
    expect(gwp[6]).toBe('Badajoz');
    expect(gwp[7]).toBe('Mérida');
    expect(gwp[8]).toBe('La Vega');
    expect(gwp[9]).toBe('trigo');
    expect(gwp[12]).toBe('true');
    expect(gwp[16]).toBe('ri-1');
    expect(gwp[17]).toBe('EF 3.1');
    expect(gwp[20]).toBe('trigo');
    expect(gwp[21]).toBe('2025');
    expect(gwp[28]).toBe('La Vega');
    expect(gwp[32]).toBe('true');
    expect(gwp[33]).toBe('Ana García');
    expect(gwp[34]).toBe('ana@example.com');
    expect(gwp[38]).toBe('GWP');
    expect(gwp[39]).toBe('1');
    expect(gwp[43]).toBe('10');
    expect(gwp[44]).toBe('kg CO2 eq');

    const tarCells = lines[3].split(';');
    expect(tarCells[2]).toBe('target');
    expect(tarCells[9]).toBe('cebada');
    expect(tarCells[43]).toBe('2');
  });

  it('quotes separators and quotes, and neutralizes formula-like text', () => {
    const result = makeTraceResult({
      datos: {
        impacto_total: [{ category: 'GWP', amount: -5, unit: 'kg CO2 eq' }],
      },
    });
    result.cultivo.parcela.nombre = 'La "Vega"; Norte';
    result.cultivo.parcela.propietario.nombre = '=2+2';
    result.cultivo.parcela.propietario.email = 'a@b.c';
    const trace: CompareTraceDto = {
      schemaVersion: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      scope: 'reference',
      reference: makeSet([result]),
    };

    const line = buildCompareTraceCSV(trace).slice(1).split('\r\n')[1];

    expect(line).toContain('"La ""Vega""; Norte"');
    expect(line).toContain("'=2+2");
    // Negative numbers must stay numeric for the spreadsheet
    expect(line).toMatch(/;-5;kg CO2 eq$/);
  });

  it.each([
    ['tab', '\t=HYPERLINK("x")'],
    ['carriage return', '\r=cmd|x'],
  ])('neutralizes formulas preceded by a %s', (_name, nombre) => {
    const result = makeTraceResult({
      datos: {
        impacto_total: [{ category: 'GWP', amount: 1, unit: 'kg CO2 eq' }],
      },
    });
    result.cultivo.parcela.nombre = nombre;
    const trace: CompareTraceDto = {
      schemaVersion: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      scope: 'reference',
      reference: makeSet([result]),
    };

    const csv = buildCompareTraceCSV(trace);

    expect(csv).toMatch(/;"?'[\t\r]=/);
    expect(csv).not.toMatch(/;"?[\t\r]=/);
  });

  it('groups stage values of the same category written differently', () => {
    const result = makeTraceResult({
      datos: {
        impacto_fertilizantes: [
          { category: 'Climate Change', amount: 1, unit: 'kg CO2 eq' },
        ],
        impacto_total: [
          { category: 'Climate change', amount: 10, unit: 'kg CO2 eq' },
        ],
      },
    });
    const trace: CompareTraceDto = {
      schemaVersion: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      scope: 'reference',
      reference: makeSet([result]),
    };

    const lines = buildCompareTraceCSV(trace).slice(1).split('\r\n');

    expect(lines).toHaveLength(2);
    const cells = lines[1].split(';');
    expect(cells[39]).toBe('1');
    expect(cells[43]).toBe('10');
  });

  it('omits sets that are not part of the export', () => {
    const trace: CompareTraceDto = {
      schemaVersion: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      scope: 'target',
      target: makeSet([makeTraceResult({ id: 'ri-2' })]),
    };

    const lines = buildCompareTraceCSV(trace).slice(1).split('\r\n');

    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('reference');
  });
});
