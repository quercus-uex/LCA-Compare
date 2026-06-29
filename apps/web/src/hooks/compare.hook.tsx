import type { Pais, Poblacion, Provincia } from 'common/location';
import type { Parcela } from 'common/parcela';
import type { CompareFilterDto, CompareResultDto } from 'common/compare';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { API_BASE_URL } from '../common/constants.ts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
  idPais: filters.pais?.id
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();

  const compareSingle = useCallback(async (filters: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: transformFilters(filters),
      }),
    });

    if (!response.ok) {
      toast.error(
        t('compare.result.insufficientData'),
      );
    }

    const json = await response.json();
    return json.data as CompareResultDto;

  }, [t]);

  const compare = useCallback(async (reference: CompareFilterType, target: CompareFilterType) => {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: transformFilters(reference),
        target: transformFilters(target),
      }),
    });

    if (!response.ok) {
      toast.error(
        t('compare.result.insufficientData'),
      );
    }

    const json = await response.json();
    return json.data as CompareResultDto;
  }, [t]);

  const getReportLanguage = useCallback((): SupportedLanguage => {
    const current = i18n.language;
    return isSupportedLanguage(current) ? current : 'es';
  }, [i18n.language]);

  const generateReport = useCallback(async (reference: CompareFilterType, target: CompareFilterType) => {
    toast.info(t('compare.result.generatingReport'));

    const language = getReportLanguage();
    const response = await fetch(`${API_BASE_URL}/compare/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
