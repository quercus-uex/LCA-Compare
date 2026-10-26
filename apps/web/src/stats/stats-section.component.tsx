import type { ReactNode } from 'react';

type Props = {
  title: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const StatsSection = ({
  title,
  hint,
  actions,
  className = '',
  children,
}: Props) => (
  <section className={`card bg-base-100 shadow-sm min-w-0 ${className}`}>
    <div className="card-body p-4 gap-3 min-w-0">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="card-title text-lg">{title}</h2>
          {hint && <p className="text-xs text-base-content/60">{hint}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  </section>
);

export const StatsPlaceholder = ({
  children,
  className = 'h-72',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 rounded-box bg-base-200/50 p-4 text-center text-sm text-base-content/60 ${className}`}
  >
    {children}
  </div>
);
