import { getCropTypeStyle, useCropTypeLabel } from '../hooks/use-crop-type-label.ts';

export const CropTypeBadge = ({ tipo, className = '' }: { tipo: string; className?: string }) => {
  const getCropTypeLabel = useCropTypeLabel();
  const { color, icon: Icon } = getCropTypeStyle(tipo);

  return (
    <span className={`badge badge-outline gap-1.5 ${className}`} style={{ borderColor: color }}>
      <Icon aria-hidden className="size-4 shrink-0" style={{ color }} />
      {getCropTypeLabel(tipo)}
    </span>
  );
};
