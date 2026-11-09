import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { AVATAR_URL, DOCS_URL } from '../common/constants.ts';
import { useAuth } from '../hooks/auth.hook.tsx';
import { useNotificaciones } from '../hooks/notificaciones.hook.tsx';
import { useClickOutside } from '../hooks/use-click-outside.ts';
import { supportedLanguages, toSupportedLanguage } from '../i18n/index.ts';
import type { ParcelaLinkState } from '../routes/parcelas/parcelas.utils.ts';
import { Dropdown } from './dropdown.component.tsx';
import { LanguageSelector } from './language-selector.component.tsx';
import { BellIcon, NotificationsBell, NotificationsPanel, useBellLabel } from './notifications-bell.component.tsx';

type NavItem = { to: string; labelKey: string };

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-ghost ${isActive ? 'bg-base-200 text-secondary' : ''}`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'menu-active bg-base-200 font-semibold text-secondary' : '';

const UserHeader = ({ nombre, apellidos, email }: { nombre: string; apellidos: string; email: string }) => (
  <div className="flex flex-col border-b border-base-300 px-3 pb-2 pt-1 text-left">
    <span className="font-semibold">{nombre} {apellidos}</span>
    <span className="truncate text-xs text-base-content/70">{email}</span>
  </div>
);

/** Idioma como selector segmentado, para el menú móvil */
const LanguageSegmented = () => {
  const { i18n, t } = useTranslation();
  const current = toSupportedLanguage(i18n.language);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span>{t('language.label')}</span>
      <div role="group" aria-label={t('language.label')} className="join">
        {supportedLanguages.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            className={`btn btn-sm join-item ${code === current ? 'btn-secondary' : ''}`}
            aria-pressed={code === current}
            title={t(labelKey)}
            onClick={() => void i18n.changeLanguage(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export const NavBar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // En móvil solo hay un panel abierto a la vez: el menú o las notificaciones
  const [openPanel, setOpenPanel] = useState<'menu' | 'notificaciones' | null>(null);
  const menuOpen = openPanel === 'menu';
  const notificacionesOpen = openPanel === 'notificaciones';
  const menuId = useId();
  const notificacionesId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const usuario = auth.usuario;
  const { total } = useNotificaciones();
  const bellLabel = useBellLabel();
  const togglePanel = (panel: 'menu' | 'notificaciones') =>
    setOpenPanel((open) => (open === panel ? null : panel));

  const items: NavItem[] = [
    { to: '/compare', labelKey: 'nav.compare' },
    { to: '/estadisticas', labelKey: 'nav.statistics' },
    ...(usuario
      ? [
          { to: '/parcelas', labelKey: 'nav.myPlots' },
          { to: '/organizaciones', labelKey: 'nav.organizations' },
        ]
      : []),
  ];

  // Una parcela o un resultado abiertos desde las parcelas de un miembro
  // pertenecen a «Organizaciones», aunque su ruta cuelgue de /parcelas
  const viaOrganizacion = !!(location.state as ParcelaLinkState | null)?.organizacion;
  const isItemActive = (to: string, isActive: boolean) => {
    if (!viaOrganizacion) return isActive;
    if (to === '/organizaciones') return true;
    return to === '/parcelas' ? false : isActive;
  };

  // Los paneles móviles se cierran al navegar, al pulsar fuera y con Escape
  const closeMenu = useCallback(() => setOpenPanel(null), []);
  useEffect(closeMenu, [location.pathname, closeMenu]);
  useClickOutside(barRef, closeMenu);
  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPanel, closeMenu]);

  const logout = () => {
    auth.logout();
    void navigate('/auth/login', { replace: true });
  };

  return (
    <div ref={barRef} className="relative z-[1100] w-full">
      <nav aria-label={t('nav.mainNavigation')} className="flex min-h-14 w-full items-center gap-2 rounded-xl bg-white px-3 py-2">
        <Link to="/" className="mr-2 px-1 font-semibold transition-colors hover:text-secondary">
          {t('nav.appName')}
        </Link>

        {/* Escritorio */}
        <ul className="hidden flex-1 items-center gap-1 lg:flex">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => navLinkClass({ isActive: isItemActive(item.to, isActive) })}>{t(item.labelKey)}</NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-1 lg:flex">
          <LanguageSelector />
          <a className="btn btn-ghost" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            <FiExternalLink aria-hidden />
            {t('nav.documentation')}
          </a>

          {auth.loading && <div className="skeleton size-10 rounded-full" />}

          {!auth.loading && !usuario && (
            <Link to="/auth/login" className="btn btn-primary">{t('nav.login')}</Link>
          )}

          {usuario && <NotificationsBell />}

          {usuario && (
            <Dropdown
              triggerClassName="btn btn-circle btn-ghost avatar"
              contentClassName="w-64"
              label={t('nav.account')}
              title={`${usuario.nombre} ${usuario.apellidos}`}
              trigger={
                <div className="w-10 rounded-full">
                  <img src={AVATAR_URL} alt={t('nav.profileImageAlt')} />
                </div>
              }
            >
              <UserHeader {...usuario} />
              <ul className="menu w-full p-0 pt-1">
                {usuario.rol === 'admin' && (
                  <li><Link to="/admin">{t('nav.admin')}</Link></li>
                )}
                <li>
                  <button type="button" className="text-red-700" onClick={logout}>
                    <FiLogOut aria-hidden />
                    {t('nav.logout')}
                  </button>
                </li>
              </ul>
            </Dropdown>
          )}
        </div>

        {/* Móvil y tablet */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {usuario && (
            <button
              type="button"
              className="btn btn-square btn-ghost"
              aria-expanded={notificacionesOpen}
              aria-controls={notificacionesId}
              aria-label={notificacionesOpen ? t('notificaciones.close') : bellLabel}
              onClick={() => togglePanel('notificaciones')}
            >
              {notificacionesOpen ? <FiX aria-hidden className="size-5" /> : <BellIcon total={total} />}
            </button>
          )}
          <button
            type="button"
            className="btn btn-square btn-ghost"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => togglePanel('menu')}
          >
            {menuOpen ? <FiX aria-hidden className="size-5" /> : <FiMenu aria-hidden className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Anuncia los cambios del número de novedades, que el sondeo puede traer en cualquier momento */}
      {usuario && (
        <span className="sr-only" aria-live="polite">
          {total > 0 ? t('notificaciones.liveCount', { count: total }) : ''}
        </span>
      )}

      {notificacionesOpen && usuario && (
        <div
          id={notificacionesId}
          className="absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl bg-white p-2 shadow-lg lg:hidden"
        >
          <NotificationsPanel />
        </div>
      )}

      {menuOpen && (
        <div
          id={menuId}
          className="absolute inset-x-0 top-full mt-2 rounded-xl bg-white p-2 shadow-lg lg:hidden"
        >
          {usuario && <div className="mb-1"><UserHeader {...usuario} /></div>}
          <ul className="menu w-full gap-0.5 p-0 text-base">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => mobileLinkClass({ isActive: isItemActive(item.to, isActive) })}>{t(item.labelKey)}</NavLink>
              </li>
            ))}
            {usuario?.rol === 'admin' && (
              <li><NavLink to="/admin" className={mobileLinkClass}>{t('nav.admin')}</NavLink></li>
            )}
          </ul>

          <div className="my-2 border-t border-base-300" />

          <ul className="menu w-full gap-0.5 p-0 text-base">
            <li>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                {t('nav.documentation')}
                <FiExternalLink aria-hidden className="ml-auto" />
              </a>
            </li>
          </ul>
          <LanguageSegmented />

          <div className="my-2 border-t border-base-300" />

          {auth.loading ? (
            <div className="skeleton h-10 w-full" />
          ) : usuario ? (
            <ul className="menu w-full p-0 text-base">
              <li>
                <button type="button" className="text-red-700" onClick={logout}>
                  <FiLogOut aria-hidden />
                  {t('nav.logout')}
                </button>
              </li>
            </ul>
          ) : (
            <Link to="/auth/login" className="btn btn-primary w-full">{t('nav.login')}</Link>
          )}
        </div>
      )}
    </div>
  );
};
