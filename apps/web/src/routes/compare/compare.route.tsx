import type { CompareExportFormat, CompareExportScope } from 'common/compare';
import { Fragment, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { ApiError } from '../../common/api.ts';
import { exportJSON, exportCSV, hasTargetSet, omitNullish } from '../../common/utils.ts';
import { Button, Dropdown, Menu, MenuItem, MenuTitle } from '../../components/ui/index.ts';
import {
  type CompareFilterType,
  type CompareResult,
  useCompare,
} from '../../hooks/compare.hook.tsx';
import type { Poblacion, Provincia } from '../../hooks/location.hook.tsx';
import { useOrganizacionesAdministradas } from '../../hooks/organizacion.hook.tsx';
import type { Parcela } from '../../hooks/parcela.hook.tsx';
import { buildCompareCSV, buildCompareExportPayload } from './compare-export.utils.ts';
import { CompareFilterCard } from './compare-filter-card.component.tsx';
import { CompareResultCard } from './compare-result-card.component.tsx';

type CompareRouteState = {
  parcelaObjetivo?: Parcela;
  parcelaReferencia?: Parcela;
  provinciaReferencia?: Provincia;
  poblacionReferencia?: Poblacion;
};

export const CompareRoute = () => {
  const location = useLocation();
  const state = location.state as CompareRouteState | null;
  const parcelaObjetivo = state?.parcelaObjetivo;
  const parcelaReferencia = state?.parcelaReferencia;
  const provinciaReferencia = state?.provinciaReferencia;
  const poblacionReferencia = state?.poblacionReferencia;
  const initialReferenciaFilters: CompareFilterType = {
    parcelas: parcelaReferencia ? [parcelaReferencia] : [],
    provincias: provinciaReferencia ? [provinciaReferencia] : [],
    poblaciones: poblacionReferencia ? [poblacionReferencia] : [],
  };
  const initialObjetivoFilters: CompareFilterType | undefined = parcelaObjetivo
    ? { parcelas: [parcelaObjetivo], provincias: [], poblaciones: [] }
    : undefined;

  const [filtersRef, setFiltersRef] = useState<CompareFilterType>(initialReferenciaFilters);
  const [filtersObj, setFiltersObj] = useState<CompareFilterType | undefined>(initialObjetivoFilters);
  // Resultado junto a los filtros que lo produjeron: si una comparativa
  // posterior falla, el resultado en pantalla sigue siendo el anterior, y los
  // informes y exportaciones deben usar sus filtros, no los del formulario
  const [comparison, setComparison] = useState<{
    result: CompareResult;
    reference: CompareFilterType;
    target?: CompareFilterType;
  }>();
  const result = comparison?.result;
  const appliedRef = comparison?.reference;
  const appliedObj = comparison?.target;

  const exportOptions: Array<{
    mode: CompareExportScope;
    titleKey: string;
    filePrefix: string;
    metadata: unknown;
    needsTarget: boolean;
  }> = [
    { mode: 'full', titleKey: 'compare.actions.exportComparison', filePrefix: 'comparativa', metadata: { reference: appliedRef, target: appliedObj }, needsTarget: true },
    { mode: 'target', titleKey: 'compare.actions.exportTarget', filePrefix: 'objetivo', metadata: appliedObj, needsTarget: true },
    { mode: 'reference', titleKey: 'compare.actions.exportReference', filePrefix: 'referencia', metadata: appliedRef, needsTarget: false },
  ];
  const refOrg = appliedRef?.organizacion;
  const tarOrg = appliedObj?.organizacion;
  const traceOptions: Array<{ scope: CompareExportScope; labelKey: string }> = [
    ...(refOrg && tarOrg ? [{ scope: 'full' as const, labelKey: 'compare.actions.traceFull' }] : []),
    ...(refOrg ? [{ scope: 'reference' as const, labelKey: 'compare.actions.traceReference' }] : []),
    ...(tarOrg ? [{ scope: 'target' as const, labelKey: 'compare.actions.traceTarget' }] : []),
  ];
  const compare = useCompare();
  const organizaciones = useOrganizacionesAdministradas();
  const { t } = useTranslation();

  // 403: el filtro de organización es de una que el usuario ya no administra.
  // Sin datos y con organización, lo más probable es que sus miembros aún no
  // hayan aceptado campañas que encajen con el resto de filtros
  const showCompareError = (e: unknown, ...sets: (CompareFilterType | undefined)[]) => {
    if (e instanceof ApiError && e.status === 403) return toast.error(t('compare.result.organizationForbidden'));
    const conOrganizacion = sets.some((f) => f?.organizacion);
    toast.error(t(conOrganizacion ? 'compare.result.insufficientOrganizationData' : 'compare.result.insufficientData'));
  };

  // Solo la última comparativa enviada puede actualizar el resultado o avisar
  // de un error: una respuesta anterior que llegue tarde se descarta
  const compareSeq = useRef(0);
  const runCompare = async (reference: CompareFilterType, target?: CompareFilterType) => {
    const seq = ++compareSeq.current;
    try {
      const result = await compare.compare(reference, target);
      if (seq === compareSeq.current) setComparison({ result, reference, target });
    } catch (e) {
      if (seq === compareSeq.current) showCompareError(e, reference, target);
    }
  };

  const exportTrace = async (scope: CompareExportScope, format: CompareExportFormat) => {
    if (!appliedRef) return;
    try {
      await compare.exportTrace(appliedRef, appliedObj, scope, format);
    } catch (e) {
      showCompareError(e, appliedRef, appliedObj);
    }
  };

  return (
    <div className="flex gap-5 w-full justify-center min-w-0 max-xl:flex-col">
      <CompareFilterCard
        name={t('compare.filters.reference')}
        required
        initialFilters={initialReferenciaFilters}
        organizaciones={organizaciones}
        onSubmit={async (data) => {
          const d = omitNullish(data!) as CompareFilterType;
          setFiltersRef(d);
          await runCompare(d, filtersObj);
        }}
      />
      <div className="flex flex-col gap-2 max-w-full flex-3">
        {result && (
          <div className="flex gap-2 justify-end flex-wrap">
            {appliedRef && appliedObj && hasTargetSet(result) && (
              <Button
                variant="secondary"
                onClick={() => {
                  void (async () => {
                    try {
                      await compare.generateReport(appliedRef, appliedObj);
                    } catch (e) {
                      showCompareError(e, appliedRef, appliedObj);
                    }
                  })();
                }}
              >
                {t('compare.actions.generateReport')}
              </Button>
            )}

            <Dropdown variant="outline" trigger={t('common.actions.export')}>
              <Menu>
                {exportOptions
                  .filter((option) => !option.needsTarget || hasTargetSet(result))
                  .map(({ mode, titleKey, filePrefix, metadata }) => (
                    <Fragment key={mode}>
                      <MenuTitle>{t(titleKey)}</MenuTitle>
                      <MenuItem onClick={() => exportJSON({ metadata, result: buildCompareExportPayload(result, mode) })}>
                        JSON
                      </MenuItem>
                      <MenuItem onClick={() => exportCSV(`${filePrefix}-${Date.now()}.csv`, buildCompareCSV(result, mode, t))}>
                        CSV
                      </MenuItem>
                    </Fragment>
                  ))}
              </Menu>
            </Dropdown>

            {traceOptions.length > 0 && (
              <Dropdown variant="outline" trigger={t('compare.actions.exportTrace')}>
                <Menu>
                  {traceOptions.map(({ scope, labelKey }) => (
                    <Fragment key={scope}>
                      <MenuTitle>{t(labelKey)}</MenuTitle>
                      <MenuItem onClick={() => void exportTrace(scope, 'json')}>
                        JSON
                      </MenuItem>
                      <MenuItem onClick={() => void exportTrace(scope, 'csv')}>
                        CSV
                      </MenuItem>
                    </Fragment>
                  ))}
                </Menu>
              </Dropdown>
            )}
          </div>
        )}
        <CompareResultCard result={result} />
      </div>

      <CompareFilterCard
        name={t('compare.filters.target')}
        initialFilters={initialObjetivoFilters}
        organizaciones={organizaciones}
        onSubmit={async (data) => {
          const d = data ? (omitNullish(data) as CompareFilterType) : undefined;
          setFiltersObj(d);
          await runCompare(filtersRef, d);
        }}
      />
    </div>
  );
}
