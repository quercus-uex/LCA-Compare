import type { ResultadoImpactoDto } from './api.js';
import type { ImpactKey } from './impact.js';

export type CompareReportLanguage = 'es' | 'en' | 'pt';

export type CompareExportScope = 'full' | 'reference' | 'target';
export type CompareExportFormat = 'json' | 'csv';

export type CompareFilterDto = {
  idPais?: string;
  idsPoblacion?: string[];
  idsProvincia?: string[];
  idsParcela?: string[];
  lat?: number;
  long?: number;
  range?: number;
  tipoCultivo?: string;
  anioCampaniaInicio?: number;
  anioCampaniaFin?: number;
  soloParcelasReferencia?: boolean;
  /** Solo cultivos de las campañas consentidas a esta organización (requiere ser su administrador) */
  idOrganizacion?: string;
};

export type CompareQueryItemDto = CompareFilterDto;

export type CompareQueryDto = {
  reference: CompareQueryItemDto;
  target?: CompareQueryItemDto;
  language?: CompareReportLanguage;
};

export type CompareResultItemDto = {
  category: string;
  refAmount: number;
  tarAmount?: number;
  unit: string;
  /**
   * Percentage change of the target with respect to the reference (baseline):
   * `(tarAmount - refAmount) / |refAmount| * 100`. Positive means the target
   * has a higher impact. `null` when the reference is zero or the category is
   * missing from the target (then `tarAmount` is absent too); absent when
   * there is no target set.
   */
  diff?: number | null;
};

export type CompareResultDto = Record<ImpactKey, CompareResultItemDto[]>;

export type CompareTracePropietarioDto = {
  nombre: string;
  email: string;
};

export type CompareTraceFiltersDto = Omit<
  CompareFilterDto,
  'idOrganizacion'
> & {
  idOrganizacion: string;
  organizacion: { id: string; nombre: string };
  pais?: { id: string; nombre: string; codigo: string };
  provincias?: { id: string; nombre: string }[];
  poblaciones?: { id: string; nombre: string }[];
  parcelas?: { id: string; nombre: string }[];
};

export type CompareTraceResultDto = {
  id: string;
  metodo: { id: string; nombre: string };
  cultivo: {
    id: string;
    tipo: string;
    anioCampania: number;
    fechaInicioCampania: string;
    superficieCultivada: number;
    produccion: number;
    consumoAgua: number;
    ciclo: number;
    parcela: {
      id: string;
      nombre: string;
      sigpac: string | null;
      refCat: string | null;
      ptIdParcela: string | null;
      esParcelaReferencia: boolean;
      propietario: CompareTracePropietarioDto;
      poblacion: {
        id: string;
        nombre: string;
        idCatastro: number;
        provincia: {
          id: string;
          nombre: string;
          idCatastro: number;
          pais: { id: string; nombre: string; codigo: string };
        };
      } | null;
    };
  };
  /** Datos tal y como llegaron de openLCA, sin normalizar ni promediar */
  datos: ResultadoImpactoDto;
};

export type CompareTraceSetDto = {
  filters: CompareTraceFiltersDto;
  count: number;
  mean: ResultadoImpactoDto;
  results: CompareTraceResultDto[];
};

export type CompareTraceDto = {
  schemaVersion: 1;
  generatedAt: string;
  scope: CompareExportScope;
  reference?: CompareTraceSetDto;
  target?: CompareTraceSetDto;
  comparison?: CompareResultDto;
};
