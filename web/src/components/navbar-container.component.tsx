import { NavBar } from './navbar.component.tsx';
import { Outlet } from 'react-router';

export const NavbarContainer = () => {
  return (
    <div className="p-5 flex flex-col gap-5 items-center">
      <NavBar />
      <Outlet />
    </div>
  );
}