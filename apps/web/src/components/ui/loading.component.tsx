const SPINNER_SIZE = { xs: 'loading-xs', sm: 'loading-sm', md: 'loading-md' } as const;

export const Spinner = ({ size = 'sm' }: { size?: keyof typeof SPINNER_SIZE }) => (
  <span aria-hidden className={`loading loading-spinner ${SPINNER_SIZE[size]}`} />
);

/** Bloque gris animado que ocupa el sitio del contenido mientras carga */
export const Skeleton = ({ className }: { className: string }) => (
  <div aria-hidden className={`skeleton ${className}`} />
);
