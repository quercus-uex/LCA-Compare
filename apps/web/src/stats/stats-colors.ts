export const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export const colorAt = (index: number): string => CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]!;

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'oklch(0.21 0.006 285.885)',
  border: '1px solid oklch(0.3 0.01 285.885)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'oklch(0.9 0.01 285.885)',
};