import { NavBar } from './navbar.component.tsx';
import { Outlet } from 'react-router';

export const NavbarContainer = () => {
  return (
    <>
      <div className="p-5 flex flex-col gap-5 items-center flex-1">
        <NavBar />
        <Outlet />
      </div>
      <footer className="w-full flex justify-center p-4">
        <img src="/tid4agro-banner.png" alt="TID4Agro" className="h-20" />
      </footer>
    </>
  );
}