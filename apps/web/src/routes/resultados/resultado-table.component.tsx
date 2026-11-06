import type { ResultadoImpactoItemDto } from 'common/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getEfCategory, getEfCategoryId, IMPACT_LABEL_KEYS, IMPACT_STAGE_KEYS } from '../../common/constants.ts';
import { formatImpactValue, formatPercent } from '../../common/format.ts';
import { translateEfCategory } from '../../common/utils.ts';
import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

const byCategory = (items: ResultadoImpactoItemDto[]) =>
  new Map(items.map((i) => [i.category, i]));

const STAGE_COLORS: Record<(typeof IMPACT_STAGE_KEYS)[number], string> = {
  impacto_pesticidas: '#8b5cf6',
  impacto_fertilizantes: '#10b981',
  impacto_sistema_riego: '#06b6d4',
  impacto_manejo_cultivo: '#f59e0b',
};

const ETAPAS = IMPACT_STAGE_KEYS.map((key) => ({ key, labelKey: IMPACT_LABEL_KEYS[key], color: STAGE_COLORS[key] }));

// Las etapas solo caben en pantallas anchas; la barra de reparto las resume en el resto.
// En móvil la unidad va bajo el total y la barra bajo la categoría
const XL = 'hidden xl:table-cell';
const SM = 'hidden sm:table-cell';

const RepartoBar = ({ partes, labels }: { partes: number[]; labels: string[] }) => {
  const suma = partes.reduce((a, b) => a + b, 0);
  // El reparto solo tiene sentido si ninguna etapa resta impacto
  if (!(suma > 0 && partes.every((v) => v >= 0))) return <span className="text-base-content/70">—</span>;
  const texto = (sep: string) =>
    labels.map((l, k) => `${l}${sep}${formatPercent(((partes[k] ?? 0) / suma) * 100, 0)}`);

  return (
    <div
      className="flex h-2.5 w-full min-w-28 overflow-hidden rounded-full bg-base-200"
      role="img"
      aria-label={texto(' ').join(', ')}
      title={texto(': ').join('\n')}
    >
      {ETAPAS.map((e, k) => (
        <div key={e.key} style={{ width: `${((partes[k] ?? 0) / suma) * 100}%`, backgroundColor: e.color }} />
      ))}
    </div>
  );
};

export const ResultadoTable = ({ resultado }: { resultado: ResultadoImpacto }) => {
  const { t } = useTranslation();

  const lookup = useMemo(
    () => ({
      etapas: ETAPAS.map((e) => byCategory(resultado.datos[e.key])),
      total: byCategory(resultado.datos.impacto_total),
    }),
    [resultado],
  );

  const fmt = (amount: number | undefined) => (amount == null ? '—' : formatImpactValue(amount, '0'));

  return (
    <section className="card bg-base-100 shadow-sm" aria-labelledby="impactos-title">
      <div className="card-body gap-3 p-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="impactos-title" className="card-title">{t('resultados.impactsTitle')}</h2>
            <div className="text-sm text-base-content/70">{t('resultados.impactsHint')}</div>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/70" aria-label={t('resultados.contribution')}>
            {ETAPAS.map((e) => (
              <li key={e.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: e.color }} />
                {t(e.labelKey)}
              </li>
            ))}
          </ul>
        </header>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.fields.category')}</th>
                {ETAPAS.map((e) => <th key={e.key} className={`${XL} text-right`}>{t(e.labelKey)}</th>)}
                <th className="text-right">{t('common.fields.total')}</th>
                <th className={SM}>{t('common.fields.unit')}</th>
                <th className={`${SM} min-w-32`}>{t('resultados.contribution')}</th>
              </tr>
            </thead>
            <tbody>
              {resultado.datos.impacto_total.map((i) => {
                const id = getEfCategoryId(i.category);
                const color = id ? getEfCategory(id)?.color : undefined;
                const partes = lookup.etapas.map((m) => m.get(i.category)?.amount ?? 0);
                const labels = ETAPAS.map((e) => t(e.labelKey));
                const unidad = lookup.total.get(i.category)?.unit ?? '—';

                return (
                  <tr key={i.category}>
                    <th scope="row" className="font-medium">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? 'currentColor' }} />
                        {translateEfCategory(i.category)}
                      </span>
                      <div className="mt-2 sm:hidden"><RepartoBar partes={partes} labels={labels} /></div>
                    </th>
                    {lookup.etapas.map((m, k) => (
                      <td key={ETAPAS[k]!.key} className={`${XL} text-right font-mono tabular-nums whitespace-nowrap`}>
                        {fmt(m.get(i.category)?.amount)}
                      </td>
                    ))}
                    <td className="text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                      {fmt(lookup.total.get(i.category)?.amount)}
                      <div className="font-sans text-xs font-normal text-base-content/70 sm:hidden">{unidad}</div>
                    </td>
                    <td className={`${SM} text-base-content/70 whitespace-nowrap`}>{unidad}</td>
                    <td className={SM}><RepartoBar partes={partes} labels={labels} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
