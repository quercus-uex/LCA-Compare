import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './error-boundary.component.tsx';
import { NavBar } from './navbar.component.tsx';

export const NavbarContainer = () => {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <>
      <div className="p-5 flex flex-col gap-5 items-center flex-1">
        <NavBar />
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<span role="status" className="loading loading-spinner loading-lg mt-10" aria-label={t('common.loading')} />}>
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