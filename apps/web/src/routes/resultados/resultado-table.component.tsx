import type { ResultadoImpactoItemDto } from 'common/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResultadoImpacto } from '../../hooks/resultado-impacto.hook.tsx';

const byCategory = (items: ResultadoImpactoItemDto[]) =>
  new Map(items.map((i) => [i.category, i]));

export const ResultadoTable = ({ resultado }: { resultado: ResultadoImpacto }) => {
  const { t } = useTranslation();

  const lookup = useMemo(() => {
    const d = resultado.datos;
    return {
      pesticidas: byCategory(d.impacto_pesticidas),
      fertilizantes: byCategory(d.impacto_fertilizantes),
      sistemaRiego: byCategory(d.impacto_sistema_riego),
      manejoCultivo: byCategory(d.impacto_manejo_cultivo),
      total: byCategory(d.impacto_total),
    };
  }, [resultado]);

  const fmt = (m: Map<string, ResultadoImpactoItemDto>, category: string) =>
    m.get(category)?.amount.toFixed(5) ?? '—';

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>{t('common.fields.category')}</th>
            <th>{t('common.fields.pesticides')}</th>
            <th>{t('common.fields.fertilizers')}</th>
            <th>{t('common.fields.irrigationSystem')}</th>
            <th>{t('common.fields.cropManagement')}</th>
            <th>{t('common.fields.total')}</th>
            <th>{t('common.fields.unit')}</th>
          </tr>
        </thead>
        <tbody>
          {resultado.datos.impacto_total.map((i) => (
            <tr key={i.category}>
              <th>{i.category}</th>
              <th>{fmt(lookup.pesticidas, i.category)}</th>
              <th>{fmt(lookup.fertilizantes, i.category)}</th>
              <th>{fmt(lookup.sistemaRiego, i.category)}</th>
              <th>{fmt(lookup.manejoCultivo, i.category)}</th>
              <th>{fmt(lookup.total, i.category)}</th>
              <th>{lookup.total.get(i.category)?.unit ?? '—'}</th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};