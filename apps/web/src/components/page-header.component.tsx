import type { ReactNode } from 'react';

/** Contenedor común de las páginas: mismo ancho máximo y espaciado en todas */
export const PAGE_CLASS = 'flex w-full max-w-[96rem] flex-col gap-5';

/** Cabecera común de las páginas de primer nivel (Mis parcelas, Estadísticas, Administración) */
export const PageHeader = ({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
    <div className="min-w-0">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-base-content/70">{subtitle}</p>}
    </div>
    {aside && <div className="text-base-content/70">{aside}</div>}
  </header>
);

/** Esqueleto de la cabecera, con la misma altura para que la página no salte al cargar */
export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <div className="skeleton h-9 w-64" />
    <div className="skeleton h-5 w-96 max-w-full" />
  </div>
);
