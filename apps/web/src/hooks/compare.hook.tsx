import type { CompareFilterDto, CompareResultDto } from 'common/compare';
import type { Pais, Poblacion, Provincia } from 'common/location';
import type { Parcela } from 'common/parcela';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError, apiFetch, apiRequest } from '../common/api.ts';
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

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = t('compare.result.reportFilename');
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(t('compare.result.reportGenerated'));
  }, [t, i18n.language]);

  const value = useMemo(() => ({ compare, generateReport }), [compare, generateReport]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }
  return context;
}
