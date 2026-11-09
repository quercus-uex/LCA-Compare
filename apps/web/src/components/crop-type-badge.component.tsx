import { getCropTypeStyle, useCropTypeLabel } from '../hooks/use-crop-type-label.ts';
import { Badge } from './ui/index.ts';

export const CropTypeBadge = ({ tipo, size, className }: { tipo: string; size?: 'xs' | 'sm' | 'md'; className?: string }) => {
  const getCropTypeLabel = useCropTypeLabel();
  const { color, icon } = getCropTypeStyle(tipo);

  return (
    <Badge tone="outline" color={color} icon={icon} size={size} className={className}>
      {getCropTypeLabel(tipo)}
    </Badge>
  );
};
