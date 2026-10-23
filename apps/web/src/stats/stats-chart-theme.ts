import type { CSSProperties } from 'react';

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export const colorAt = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]!;

// Colores ligados a las variables del tema de DaisyUI 5, para que las gráficas
// sigan al tema en lugar de llevar colores fijos
const baseContent = (percent: number) =>
  `color-mix(in oklab, var(--color-base-content) ${percent}%, transparent)`;

export const CHART_GRID_STROKE = baseContent(12);
export const CHART_REFERENCE_STROKE = baseContent(35);
export const CHART_MUTED_FILL = baseContent(12);
export const CHART_SELECTED_FILL = baseContent(30);

export const CHART_TICK = { fontSize: 12, fill: baseContent(70) };
export const CHART_SMALL_TICK = { fontSize: 10, fill: baseContent(70) };

export const CHART_POINT_LABEL_STYLE: CSSProperties = {
  fontSize: 11,
  fill: baseContent(80),
};

export const CHART_AXIS_LABEL_STYLE: CSSProperties = {
  fontSize: 12,
  fill: baseContent(70),
};

// Colores de las dos zonas comparadas en el perfil de impacto
export const PROFILE_COLORS = ['#ef4444', '#3b82f6'] as const;
