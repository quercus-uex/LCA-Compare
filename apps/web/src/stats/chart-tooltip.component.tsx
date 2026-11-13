import type { ReactNode } from 'react';

/** Caja de los tooltips de las gráficas: título en negrita y una línea por dato */
export const ChartTooltip = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <div className="rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-lg">
    <p className="font-bold">{title}</p>
    {children}
  </div>
);
