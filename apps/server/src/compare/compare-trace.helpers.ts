import type { ResultadoImpactoDto } from 'common/api';
import type {
  CompareTraceDto,
  CompareTraceResultDto,
  CompareTraceSetDto,
} from 'common/compare';
import { IMPACT_KEYS, type ImpactKey } from 'common/impact';
import { getCategoryKey } from './compare.helpers';
import type { ResultadoImpactoTrace } from './compare.types';

const CSV_SEPARATOR = ';';

const CSV_HEADER = [
  'version_esquema',
  'generado_en',
  'conjunto',
  'organizacion',
  'id_organizacion',
  'filtro_pais',
  'filtro_provincias',
  'filtro_poblaciones',
  'filtro_parcelas',
  'filtro_tipo_cultivo',
  'filtro_anio_inicio',
  'filtro_anio_fin',
  'filtro_solo_referencia',
  'filtro_latitud',
  'filtro_longitud',
  'filtro_radio',
  'id_resultado',
  'metodo_impacto',
  'id_metodo_impacto',
  'id_cultivo',
  'tipo_cultivo',
  'anio_campania',
  'fecha_inicio_campania',
  'superficie_cultivada',
  'produccion',
  'consumo_agua',
  'ciclo',
  'id_parcela',
  'parcela',
  'sigpac',
  'ref_catastral',
  'pt_id_parcela',
  'es_parcela_referencia',
  'propietario',
  'email_propietario',
  'poblacion',
  'provincia',
  'pais',
  'categoria',
  'impacto_fertilizantes',
  'impacto_manejo_cultivo',
  'impacto_pesticidas',
  'impacto_sistema_riego',
  'impacto_total',
  'unidad',
];

type StageValues = Partial<Record<ImpactKey, { amount: number; unit: string }>>;

type CsvCell = string | number | null | undefined;

const escapeCell = (value: CsvCell): string => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Evita que una hoja de cálculo interprete textos como fórmulas; los
  // números negativos deben seguir siendo números
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export type ResultadoImpactoTraceWithCultivo = ResultadoImpactoTrace & {
  cultivo: NonNullable<ResultadoImpactoTrace['cultivo']>;
};

export const hasCultivo = (
  result: ResultadoImpactoTrace,
): result is ResultadoImpactoTraceWithCultivo => result.cultivo !== null;

/** Resultado de impacto con los metadatos que necesita la exportación de trazabilidad */
export function toTraceResult(
  result: ResultadoImpactoTraceWithCultivo,
): CompareTraceResultDto {
  const { cultivo } = result;
  const { parcela } = cultivo;
  const poblacion = parcela.poblacion;

  return {
    id: result.id,
    metodo: { id: result.impacto.id, nombre: result.impacto.nombre },
    cultivo: {
      id: cultivo.id,
      tipo: cultivo.tipo,
      anioCampania: cultivo.fechaInicioCampania.getUTCFullYear(),
      fechaInicioCampania: cultivo.fechaInicioCampania.toISOString(),
      superficieCultivada: cultivo.superficieCultivada,
      produccion: cultivo.produccion,
      consumoAgua: cultivo.consumoAgua,
      ciclo: cultivo.ciclo,
      parcela: {
        id: parcela.id,
        nombre: parcela.nombre,
        sigpac: parcela.sigpac,
        refCat: parcela.refCat,
        ptIdParcela: parcela.ptIdParcela,
        esParcelaReferencia: parcela.esParcelaReferencia,
        propietario: {
          nombre: `${parcela.propietario.nombre} ${parcela.propietario.apellidos}`,
          email: parcela.propietario.email,
        },
        poblacion: poblacion
          ? {
              id: poblacion.id,
              nombre: poblacion.nombre,
              idCatastro: poblacion.idCatastro,
              provincia: {
                id: poblacion.provincia.id,
                nombre: poblacion.provincia.nombre,
                idCatastro: poblacion.provincia.idCatastro,
                pais: {
                  id: poblacion.provincia.pais.id,
                  nombre: poblacion.provincia.pais.nombre,
                  codigo: poblacion.provincia.pais.codigo,
                },
              },
            }
          : null,
      },
    },
    datos: result.datos as unknown as ResultadoImpactoDto,
  };
}

const filterNames = (items?: { nombre: string }[]) =>
  items?.map((item) => item.nombre).join(', ') ?? '';

/**
 * CSV ancho: una fila por resultado y categoría, con una columna por etapa.
 * Los metadatos del conjunto se repiten en cada fila para que el fichero se
 * pueda leer y filtrar sin necesidad del JSON.
 */
export function buildCompareTraceCSV(trace: CompareTraceDto): string {
  const rows: CsvCell[][] = [CSV_HEADER];

  const appendSet = (name: 'reference' | 'target', set: CompareTraceSetDto) => {
    const { filters } = set;
    for (const result of set.results) {
      // Misma agrupación que la media y la comparativa: una categoría escrita
      // de forma distinta en cada etapa sigue siendo una sola fila
      const categories = new Map<
        string,
        { category: string; values: StageValues }
      >();
      for (const key of IMPACT_KEYS) {
        for (const item of result.datos[key] ?? []) {
          const categoryKey = getCategoryKey(item.category);
          let entry = categories.get(categoryKey);
          if (!entry) {
            entry = { category: item.category, values: {} };
            categories.set(categoryKey, entry);
          }
          entry.values[key] ??= { amount: item.amount, unit: item.unit };
        }
      }

      for (const { category, values } of [...categories.values()].sort((a, b) =>
        a.category.localeCompare(b.category, 'es'),
      )) {
        const units = [
          ...new Set(
            Object.values(values)
              .map((item) => item?.unit)
              .filter((unit): unit is string => !!unit),
          ),
        ];
        const { cultivo } = result;
        rows.push([
          trace.schemaVersion,
          trace.generatedAt,
          name,
          filters.organizacion.nombre,
          filters.idOrganizacion,
          filters.pais?.nombre,
          filterNames(filters.provincias),
          filterNames(filters.poblaciones),
          filterNames(filters.parcelas),
          filters.tipoCultivo,
          filters.anioCampaniaInicio,
          filters.anioCampaniaFin,
          filters.soloParcelasReferencia ? 'true' : '',
          filters.lat,
          filters.long,
          filters.range,
          result.id,
          result.metodo.nombre,
          result.metodo.id,
          cultivo.id,
          cultivo.tipo,
          cultivo.anioCampania,
          cultivo.fechaInicioCampania,
          cultivo.superficieCultivada,
          cultivo.produccion,
          cultivo.consumoAgua,
          cultivo.ciclo,
          cultivo.parcela.id,
          cultivo.parcela.nombre,
          cultivo.parcela.sigpac,
          cultivo.parcela.refCat,
          cultivo.parcela.ptIdParcela,
          cultivo.parcela.esParcelaReferencia ? 'true' : 'false',
          cultivo.parcela.propietario.nombre,
          cultivo.parcela.propietario.email,
          cultivo.parcela.poblacion?.nombre,
          cultivo.parcela.poblacion?.provincia.nombre,
          cultivo.parcela.poblacion?.provincia.pais.nombre,
          category,
          ...IMPACT_KEYS.map((key) => values[key]?.amount),
          units.join(' | '),
        ]);
      }
    }
  };

  if (trace.reference) appendSet('reference', trace.reference);
  if (trace.target) appendSet('target', trace.target);

  const body = rows
    .map((row) => row.map(escapeCell).join(CSV_SEPARATOR))
    .join('\r\n');
  return `\ufeff${body}`;
}
