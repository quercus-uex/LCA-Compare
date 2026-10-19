import { useTranslation } from 'react-i18next';
import { useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import type { DistribucionCultivoItemDto } from './stats.hook.tsx';

type Props = {
  selected?: string;
  onChange: (tipoCultivo: string | undefined) => void;
  distribucionCultivos: DistribucionCultivoItemDto[];
};

export const StatsCropSelector = ({
  selected,
  onChange,
  distribucionCultivos,
}: Props) => {
  const { t } = useTranslation();
  const getCropTypeLabel = useCropTypeLabel();

  return (
    <select
      className="select select-bordered select-sm min-w-40"
      value={selected ?? ''}
      onChange={(e) =>
        onChange(e.target.value ? e.target.value : undefined)
      }
    >
      <option value="">{t('stats.filters.allCrops')}</option>
      {distribucionCultivos.map((d) => (
        <option key={d.tipo} value={d.tipo}>
          {getCropTypeLabel(d.tipo)}
        </option>
      ))}
    </select>
  );
};
