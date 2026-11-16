import type {
  CompareExportFormat,
  CompareExportScope,
  CompareFilterDto,
  CompareResultDto,
} from 'common/compare';
import type { Pais, Poblacion, Provincia } from 'common/location';
import type { Parcela } from 'common/parcela';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError, apiFetch, apiRequest } from '../common/api.ts';
import { downloadBlob } from '../common/utils.ts';
import { fallbackLanguage, isSupportedLanguage } from '../i18n/index.ts';

export type { CompareResultDto } from 'common/compare';
export type CompareResult = CompareResultDto;

export type CompareFilterType = {
  pais?: Pais;
  poblaciones?: Poblacion[];
  provincias?: Provincia[];
  parcelas?: Parcela[];
  lat?: number;
  long?: number;
  range?: number;
  tipoCultivo?: string;
  anioCampaniaInicio?: number;
  anioCampaniaFin?: number;
  soloParcelasReferencia?: boolean;
  /** Solo las campañas consentidas a esta organización; requiere administrarla */
  organizacion?: { id: string; nombre: string };
};

type CompareContextType = {
  /** Sin `target` devuelve solo los valores medios de la referencia */
  compare: (reference: CompareFilterType, target?: CompareFilterType) => Promise<CompareResultDto>;
  generateReport: (reference: CompareFilterType, target: CompareFilterType) => Promise<void>;
  /** Resultados individuales de los cultivos de conjuntos filtrados por organización */
  exportTrace: (
    reference: CompareFilterType,
    target: CompareFilterType | undefined,
    scope: CompareExportScope,
    format: CompareExportFormat,
  ) => Promise<void>;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const transformFilters = (filters: CompareFilterType): CompareFilterDto => ({
  idsProvincia: filters.provincias?.map(p => p.id),
  idsPoblacion: filters.poblaciones?.map(p => p.id),
  idsParcela: filters.parcelas?.map(p => p.id),
  lat: filters.lat,
  long: filters.long,
  range: filters.range,
  tipoCultivo: filters.tipoCultivo,
  anioCampaniaInicio: filters.anioCampaniaInicio,
  anioCampaniaFin: filters.anioCampaniaFin,
  idPais: filters.pais?.id,
  soloParcelasReferencia: filters.soloParcelasReferencia,
  idOrganizacion: filters.organizacion?.id,
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();

  const compare = useCallback(
    (reference: CompareFilterType, target?: CompareFilterType) =>
      apiFetch<CompareResultDto>('/compare', {
        method: 'POST',
        body: JSON.stringify({
          reference: transformFilters(reference),
          target: target && transformFilters(target),
        }),
      }),
    [],
  );

  const generateReport = useCallback(async (reference: CompareFilterType, target: CompareFilterType) => {
    toast.info(t('compare.result.generatingReport'));

    const language = isSupportedLanguage(i18n.language) ? i18n.language : fallbackLanguage;
    const response = await apiRequest('/compare/report', {
      method: 'POST',
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
        language,
      }),
    });

    // Sin esto, un error del servidor se descargaría como si fuera el PDF
    if (!response.ok) {
      throw new ApiError(response.status, await response.text().catch(() => response.statusText));
    }

    downloadBlob(await response.blob(), t('compare.result.reportFilename'));
    toast.success(t('compare.result.reportGenerated'));
  }, [t, i18n.language]);

  const exportTrace = useCallback(async (
    reference: CompareFilterType,
    target: CompareFilterType | undefined,
    scope: CompareExportScope,
    format: CompareExportFormat,
  ) => {
    toast.info(t('compare.result.traceGenerating'));

    const response = await apiRequest('/compare/export', {
      method: 'POST',
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: target && transformFilters(target),
        scope,
        format,
      }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text().catch(() => response.statusText));
    }

    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
      ?? `trazabilidad-${scope}-${Date.now()}.${format}`;

    downloadBlob(await response.blob(), filename);
    toast.success(t('compare.result.traceGenerated'));
  }, [t]);

  const value = useMemo(
    () => ({ compare, generateReport, exportTrace }),
    [compare, generateReport, exportTrace],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }
  return context;
}
