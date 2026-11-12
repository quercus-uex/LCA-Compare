import { type ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type To } from 'react-router';
import { Skeleton } from './loading.component.tsx';

/** Contenedor de cada página: mismo ancho máximo y espaciado en todas */
export const Page = ({ busy, children }: { busy?: boolean; children: ReactNode }) => (
  <div className="flex w-full flex-col gap-5" aria-busy={busy || undefined}>
    {children}
  </div>
);

/** Título de la página, con subtítulo opcional y un dato o acción a la derecha */
export const PageHeader = ({ title, subtitle, aside }: { title: string; subtitle?: ReactNode; aside?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
    <div className="min-w-0">
      <h1 className="text-3xl font-bold break-words">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
    {aside && <div className="text-muted">{aside}</div>}
  </header>
);

/** Esqueleto de la cabecera, con la misma altura para que la página no salte al cargar */
export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-9 w-64 max-w-full" />
    <Skeleton className="h-5 w-96 max-w-full" />
  </div>
);

export type Crumb = { label: string; to?: To };

/** Migas de pan; la última es la página actual */
export const Breadcrumbs = ({ items, state }: {
  items: Crumb[];
  /** Estado de navegación que conservan los enlaces (filtros de la lista de origen, p. ej.) */
  state?: unknown;
}) => {
  const { t } = useTranslation();
  return (
    <nav className="breadcrumbs text-sm [&>ul]:flex-wrap [&>ul]:whitespace-normal" aria-label={t('common.breadcrumb')}>
      <ul>
        {items.map((c, i) => (
          <li key={i} aria-current={i === items.length - 1 && i > 0 ? 'page' : undefined}>
            {c.to ? <Link to={c.to} state={state}>{c.label}</Link> : c.label}
          </li>
        ))}
      </ul>
    </nav>
  );
};

const BODY_CLASS = {
  comfortable: 'card-body min-w-0 gap-4 p-4 sm:p-6',
  /** Para paneles densos como los de estadísticas */
  compact: 'card-body min-w-0 gap-3 p-4',
} as const;

type Density = keyof typeof BODY_CLASS;

type CardProps = {
  as?: 'div' | 'section' | 'article' | 'li';
  density?: Density;
  /** Sin relleno interior: para listas con separadores que llegan al borde */
  flush?: boolean;
  className?: string;
  /** Solo para valores que dependen de los datos (el color de una categoría, p. ej.) */
  style?: React.CSSProperties;
  children: ReactNode;
} & Pick<React.HTMLAttributes<HTMLElement>, 'aria-labelledby' | 'aria-label'>;

/** Superficie blanca sobre el fondo de la página */
export const Card = ({ as: Tag = 'div', density = 'comfortable', flush, className, children, ...rest }: CardProps) => (
  <Tag {...rest} className={`card min-w-0 bg-base-100 shadow-sm ${className ?? ''}`}>
    {flush ? children : <div className={BODY_CLASS[density]}>{children}</div>}
  </Tag>
);

type CardLinkProps = {
  to: To;
  /** Estado de navegación (filtros de la lista de origen, p. ej.) */
  state?: unknown;
  /** Nombre accesible del enlace, si no basta su contenido */
  label?: string;
  'aria-describedby'?: string;
  className?: string;
  children: ReactNode;
};

/** Tarjeta entera enlazada: se eleva al pasar el ratón */
export const CardLink = ({ to, state, label, className, children, ...rest }: CardLinkProps) => (
  <Link
    {...rest}
    to={to}
    state={state}
    aria-label={label}
    className={`card min-w-0 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary ${className ?? ''}`}
  >
    <div className={`${BODY_CLASS.comfortable} gap-2`}>{children}</div>
  </Link>
);

type SectionHeaderProps = {
  title: string;
  hint?: ReactNode;
  actions?: ReactNode;
  id?: string;
  /** `page`: bloque de primer nivel de una página; `card`: dentro de una tarjeta */
  level?: 'page' | 'card';
};

export const SectionHeader = ({ title, hint, actions, id, level = 'card' }: SectionHeaderProps) => (
  <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
    <div className="min-w-0">
      {level === 'page'
        ? <h2 id={id} className="text-2xl font-bold">{title}</h2>
        : <h2 id={id} className="text-lg font-semibold">{title}</h2>}
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
    {actions}
  </header>
);

/** Tarjeta con título, ayuda y acciones (gráficas, bloques de ajustes) */
export const Section = ({ title, hint, actions, density, className, children }: Omit<SectionHeaderProps, 'level' | 'id'> & {
  density?: Density;
  className?: string;
  children: ReactNode;
}) => {
  const id = useId();
  return (
    <Card as="section" density={density} className={className} aria-labelledby={id}>
      <SectionHeader id={id} title={title} hint={hint} actions={actions} />
      {children}
    </Card>
  );
};
