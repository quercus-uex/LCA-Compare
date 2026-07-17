import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from './error-boundary.component.tsx';
import { NavBar } from './navbar.component.tsx';

export const NavbarContainer = () => {
  const location = useLocation();
  return (
    <>
      <div className="p-5 flex flex-col gap-5 items-center flex-1">
        <NavBar />
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
      <footer className="w-full flex justify-center p-4">
        <img src="/tid4agro-banner.png" alt="TID4Agro" className="h-20" />
      </footer>
    </>
  );
}