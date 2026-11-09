import type { AccesoOrganizacion } from './organizacion.js';
import type { CategoryValues } from './stats.js';

export type Cultivo = {
  id: string;
  fechaInicioCampania: string;
  superficieCultivada: number;
  produccion: number;
  consumoAgua: number;
  ciclo: number;
  tipo: string;
  idParcela: string;
  idResultadoImpacto: string;
};

export type Parcela = {
  id: string;
  sigpac: string | null;
  refCat: string | null;
  ptIdParcela: string | null;
  nombre: string;
  idPropietario: string;
  idPoblacion: string | null;
  esParcelaReferencia: boolean;
};

export type ParcelaPoblacion = {
  id: string;
  nombre: string;
  provincia: { id: string; nombre: string };
};

/** Último cultivo de una parcela, tal como se resume en el listado */
export type CultivoResumen = Pick<
  Cultivo,
  'id' | 'tipo' | 'fechaInicioCampania' | 'superficieCultivada'
>;

/** Parcela del listado del usuario, sin el detalle de sus campañas */
export type ParcelaResumen = Parcela & {
  poblacion: ParcelaPoblacion | null;
  ultimoCultivo: CultivoResumen | null;
  numCultivos: number;
};

/**
 * Cultivo con el impacto total de su resultado por categoría EF. Una
 * categoría que no aparece en el resultado se omite; es `null` si el cultivo
 * no tiene resultado.
 */
export type CultivoConImpacto = Cultivo & {
  impactoTotal: Partial<CategoryValues> | null;
};

/** Parcela con su ubicación y sus cultivos, del más reciente al más antiguo */
export type ParcelaDetalle = Parcela & {
  poblacion: ParcelaPoblacion | null;
  cultivos: CultivoConImpacto[];
  /**
   * Solo si quien consulta no es el propietario: los cultivos se limitan a las
   * campañas que el propietario ha consentido a sus organizaciones
   */
  acceso?: AccesoOrganizacion;
};
