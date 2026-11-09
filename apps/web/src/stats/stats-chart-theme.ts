import type { CSSProperties } from 'react';

// Colores ligados a las variables del tema de DaisyUI 5, para que las gráficas
// sigan al tema en lugar de llevar colores fijos
const baseContent = (percent: number) =>
  `color-mix(in oklab, var(--color-base-content) ${percent}%, transparent)`;

export const CHART_GRID_STROKE = baseContent(12);
export const CHART_REFERENCE_STROKE = baseContent(35);
export const CHART_MUTED_FILL = baseContent(12);
export const CHART_SELECTED_FILL = baseContent(30);

export const CHART_TICK = { fontSize: 12, fill: baseContent(70) };
export const CHART_SMALL_TICK = { fontSize: 11, fill: baseContent(70) };

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
