import { useTranslation } from 'react-i18next';
import type { ImpactKey } from '../common/constants.ts';
import { formatImpactValue, formatPercent } from '../common/format.ts';
import { hasTargetSet, translateEfCategory } from '../common/utils.ts';
import type { CompareResult } from '../hooks/compare.hook.tsx';

type Row = CompareResult[ImpactKey][number];

// Más impacto que la referencia es desfavorable
const diffClass = (diff: Row['diff']) => (diff == null ? '' : diff >= 0 ? 'text-danger' : 'text-favorable');
const formatDiff = (diff: Row['diff']) => (diff != null ? formatPercent(diff, 2) : 'n/a');
const formatTarget = (amount: Row['tarAmount']) => (amount != null ? formatImpactValue(amount, '0') : '—');

/**
 * Tabla de la comparativa. Depende del ancho de su contenedor, no de la pantalla
 * (en escritorio va en la columna central del comparador): si no caben las cinco
 * columnas, cada categoría pasa a ser un bloque con sus cifras debajo del nombre
 */
export const ResultComparisonTable = ({
  result,
  selectedImpact,
}: {
  result: CompareResult;
  selectedImpact: ImpactKey;
}) => {
  const { t } = useTranslation();
  const hasTarget = hasTargetSet(result);
  const rows = result[selectedImpact];

  return (
    <div className="@container">
      <div className="hidden overflow-x-auto @xl:block">
        <table className="table table-md">
          <thead>
            <tr>
              <th>{t('common.fields.category')}</th>
              <th>{t('common.fields.referenceAmount')}</th>
              {hasTarget && <th>{t('common.fields.targetAmount')}</th>}
              <th>{t('common.fields.unit')}</th>
              {hasTarget && <th>{t('common.fields.difference')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.category}>
                <th scope="row">{translateEfCategory(i.category)}</th>
                <td className="font-semibold tabular-nums">{formatImpactValue(i.refAmount, '0')}</td>
                {hasTarget && <td className="font-semibold tabular-nums">{formatTarget(i.tarAmount)}</td>}
                <td className="font-semibold">{i.unit}</td>
                {hasTarget && <td className={`font-semibold tabular-nums ${diffClass(i.diff)}`}>{formatDiff(i.diff)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-base-200 @xl:hidden">
        {rows.map((i) => (
          <li key={i.category} className="py-3">
            <p className="font-semibold">
              {translateEfCategory(i.category)}
              <span className="ml-1.5 text-xs font-normal text-muted">{i.unit}</span>
            </p>
            <dl className={`mt-1 grid gap-2 text-sm ${hasTarget ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <div>
                <dt className="text-xs text-muted">{t('compare.filters.reference')}</dt>
                <dd className="font-semibold tabular-nums">{formatImpactValue(i.refAmount, '0')}</dd>
              </div>
              {hasTarget && (
                <>
                  <div>
                    <dt className="text-xs text-muted">{t('compare.filters.target')}</dt>
                    <dd className="font-semibold tabular-nums">{formatTarget(i.tarAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t('common.fields.difference')}</dt>
                    <dd className={`font-semibold tabular-nums ${diffClass(i.diff)}`}>{formatDiff(i.diff)}</dd>
                  </div>
                </>
              )}
            </dl>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted mt-2">{t('compare.result.meanNote')}</p>
      {hasTarget && (
        <p className="text-sm text-muted mt-1">{t('compare.result.differenceNote')}</p>
      )}
    </div>
  );
};
