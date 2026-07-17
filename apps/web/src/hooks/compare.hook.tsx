import type { CompareFilterDto, CompareResultDto } from 'common/compare';
import type { Pais, Poblacion, Provincia } from 'common/location';
import type { Parcela } from 'common/parcela';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError, apiRequest } from '../common/api.ts';
import { isSupportedLanguage, type SupportedLanguage } from '../i18n/index.ts';

export type { CompareFilterDto, CompareResultDto } from 'common/compare';
export type { CompareResultItemDto } from 'common/compare';
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
};

type CompareContextType = {
  compareSingle: (filters: CompareFilterType) => Promise<CompareResultDto>;
  compare: (left: CompareFilterType, right: CompareFilterType) => Promise<CompareResultDto>;
  generateReport: (left: CompareFilterType, right: CompareFilterType) => Promise<void>;
  getReportLanguage: () => SupportedLanguage;
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
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();

  const compareSingle = useCallback(async (filters: CompareFilterType) => {
    const response = await apiRequest('/compare', {
      method: 'POST',
      body: JSON.stringify({
        reference: transformFilters(filters),
      }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text().catch(() => response.statusText));
    }

    const json = (await response.json()) as { data: CompareResultDto };
    return json.data;
  }, []);

  const compare = useCallback(async (reference: CompareFilterType, target: CompareFilterType) => {
    const response = await apiRequest('/compare', {
      method: 'POST',
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
      }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text().catch(() => response.statusText));
    }

    const json = (await response.json()) as { data: CompareResultDto };
    return json.data;
  }, []);

  const getReportLanguage = useCallback((): SupportedLanguage => {
    const current = i18n.language;
    return isSupportedLanguage(current) ? current : 'es';
  }, [i18n.language]);

  const generateReport = useCallback(async (reference: CompareFilterType, target: CompareFilterType) => {
    toast.info(t('compare.result.generatingReport'));

    const language = getReportLanguage();
    const response = await apiRequest('/compare/report', {
      method: 'POST',
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
        language,
      }),
    });

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
  }, [t, getReportLanguage]);

  const value = useMemo(() => ({ compare, compareSingle, generateReport, getReportLanguage }), [compare, compareSingle, generateReport, getReportLanguage]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }
  return context;
}
