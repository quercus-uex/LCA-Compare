import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './error-boundary.component.tsx';
import { NavBar } from './navbar.component.tsx';
import { Spinner } from './ui/index.ts';

export const NavbarContainer = () => {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <>
      {/* La barra y el contenido comparten el ancho máximo, para que sus bordes coincidan en pantallas anchas */}
      <div className="mx-auto flex w-full max-w-[96rem] flex-1 flex-col items-center gap-5 p-5">
        <NavBar />
        <ErrorBoundary key={location.pathname}>
          <Suspense
            fallback={
              <span role="status" className="mt-10 flex" aria-label={t('common.loading')}>
                <Spinner size="lg" />
              </span>
            }
          >
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
      <footer className="w-full flex justify-center p-4">
        <img src="/tid4agro-banner.png" alt="TID4Agro" className="h-20" />
      </footer>
    </>
  );
}